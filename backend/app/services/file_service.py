import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.models.file import File
from app.models.folder import Folder
from app.models.user import User
from app.models.upload_session import UploadSession
from app.models.audit import AuditEvent
from app.schemas.file import UploadIntentRequest, UploadIntentResponse, FilePatchRequest
from app.storage import get_storage_provider
from app.services.quota_service import QuotaService
from app.core.config import settings
from app.core.security import normalize_filename
from app.core.exceptions import (
    ResourceNotFoundException,
    PermissionDeniedException,
    FileTooLargeException,
    CloudoraException
)
from fastapi import status


class FileService:
    @staticmethod
    def create_upload_intent(db: Session, user: User, data: UploadIntentRequest) -> UploadIntentResponse:
        # 1. Validate max file size
        if data.size_bytes > settings.MAX_UPLOAD_SIZE:
            raise FileTooLargeException(settings.MAX_UPLOAD_SIZE)

        # 2. Check and reserve quota
        QuotaService.check_and_reserve_quota(db, user, data.size_bytes)

        # 3. Validate target folder if specified
        if data.folder_id:
            folder = db.query(Folder).filter(Folder.id == data.folder_id, Folder.is_trashed == False).first()
            if not folder:
                raise ResourceNotFoundException("Target folder")
            if folder.owner_id != user.id:
                raise PermissionDeniedException("Cannot upload to a folder owned by another user")

        # 4. Normalize filename and generate unpredictable internal storage key
        clean_name = normalize_filename(data.filename)
        storage_key = f"users/{user.id}/{uuid.uuid4().hex}/{clean_name}"

        # 5. Create File record with status="pending"
        file_obj = File(
            owner_id=user.id,
            folder_id=data.folder_id,
            display_name=clean_name,
            storage_key=storage_key,
            mime_type=data.mime_type or "application/octet-stream",
            size_bytes=data.size_bytes,
            upload_status="pending"
        )
        db.add(file_obj)
        db.flush()

        # 6. Create UploadSession
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=settings.SIGNED_URL_TTL_SECONDS)
        upload_session = UploadSession(
            owner_id=user.id,
            file_id=file_obj.id,
            storage_key=storage_key,
            reserved_bytes=data.size_bytes,
            status="pending",
            expires_at=expires_at
        )
        db.add(upload_session)
        db.commit()
        db.refresh(file_obj)
        db.refresh(upload_session)

        # 7. Generate upload authorization from storage provider
        storage = get_storage_provider()
        upload_auth = storage.generate_upload_url(
            storage_key=storage_key,
            content_type=file_obj.mime_type,
            max_size_bytes=data.size_bytes,
            expires_in=settings.SIGNED_URL_TTL_SECONDS
        )

        return UploadIntentResponse(
            file_id=file_obj.id,
            upload_session_id=upload_session.id,
            upload_url=upload_auth["upload_url"],
            method=upload_auth["method"],
            headers=upload_auth.get("headers", {}),
            expires_at=expires_at
        )

    @staticmethod
    def complete_upload(db: Session, user: User, upload_session_id: str) -> File:
        session = db.query(UploadSession).filter(UploadSession.id == upload_session_id).first()
        if not session:
            raise ResourceNotFoundException("Upload session")
        if session.owner_id != user.id:
            raise PermissionDeniedException()

        file_obj = db.query(File).filter(File.id == session.file_id).first()
        if not file_obj:
            raise ResourceNotFoundException("File")

        # Verify object existence and properties in storage
        storage = get_storage_provider()
        obj_meta = storage.verify_object(session.storage_key)
        if not obj_meta.get("exists"):
            session.status = "failed"
            file_obj.upload_status = "failed"
            db.commit()
            raise CloudoraException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File content has not been received in object storage",
                code="OBJECT_NOT_FOUND"
            )

        # Update file verified size, checksum, and status
        verified_size = obj_meta.get("size_bytes", session.reserved_bytes)
        file_obj.size_bytes = verified_size
        file_obj.checksum = obj_meta.get("etag")
        file_obj.upload_status = "completed"

        session.status = "completed"
        db.commit()

        # Recalculate user storage usage authoritatively
        QuotaService.recalculate_user_storage(db, user.id)

        # Audit event
        audit = AuditEvent(
            user_id=user.id,
            action="FILE_UPLOADED",
            target_type="file",
            target_id=file_obj.id,
            details=f"Uploaded '{file_obj.display_name}' ({file_obj.size_bytes} bytes)"
        )
        db.add(audit)
        db.commit()
        db.refresh(file_obj)

        return file_obj

    @staticmethod
    def create_download_intent(db: Session, user: User, file_id: str) -> Dict[str, Any]:
        file_obj = db.query(File).filter(File.id == file_id).first()
        if not file_obj:
            raise ResourceNotFoundException("File")
        if file_obj.owner_id != user.id:
            raise PermissionDeniedException("Cannot access file owned by another user")
        if file_obj.is_trashed:
            raise CloudoraException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File is in trash. Restore it before downloading.",
                code="FILE_IN_TRASH"
            )
        if file_obj.upload_status != "completed":
            raise CloudoraException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File upload has not completed.",
                code="FILE_NOT_READY"
            )

        storage = get_storage_provider()
        url = storage.generate_download_url(
            storage_key=file_obj.storage_key,
            display_name=file_obj.display_name,
            expires_in=settings.SIGNED_URL_TTL_SECONDS
        )

        audit = AuditEvent(
            user_id=user.id,
            action="FILE_DOWNLOADED",
            target_type="file",
            target_id=file_obj.id
        )
        db.add(audit)
        db.commit()

        return {
            "download_url": url,
            "expires_in": settings.SIGNED_URL_TTL_SECONDS,
            "filename": file_obj.display_name,
            "mime_type": file_obj.mime_type,
            "size_bytes": file_obj.size_bytes
        }

    @staticmethod
    def patch_file(db: Session, user: User, file_id: str, data: FilePatchRequest) -> File:
        file_obj = db.query(File).filter(File.id == file_id).first()
        if not file_obj:
            raise ResourceNotFoundException("File")
        if file_obj.owner_id != user.id:
            raise PermissionDeniedException("Cannot modify file owned by another user")

        if data.display_name is not None:
            file_obj.display_name = normalize_filename(data.display_name)

        if data.is_favorite is not None:
            file_obj.is_favorite = data.is_favorite

        if data.folder_id is not None:
            if data.folder_id in ["", "root"]:
                file_obj.folder_id = None
            else:
                target_folder = db.query(Folder).filter(Folder.id == data.folder_id, Folder.is_trashed == False).first()
                if not target_folder:
                    raise ResourceNotFoundException("Target folder")
                if target_folder.owner_id != user.id:
                    raise PermissionDeniedException("Cannot move file to another user's folder")
                file_obj.folder_id = target_folder.id

        db.commit()
        db.refresh(file_obj)
        return file_obj

    @staticmethod
    def trash_file(db: Session, user: User, file_id: str) -> bool:
        file_obj = db.query(File).filter(File.id == file_id).first()
        if not file_obj:
            raise ResourceNotFoundException("File")
        if file_obj.owner_id != user.id:
            raise PermissionDeniedException()

        file_obj.is_trashed = True
        file_obj.trashed_at = datetime.now(timezone.utc)
        db.commit()
        return True

    @staticmethod
    def restore_file(db: Session, user: User, file_id: str) -> bool:
        file_obj = db.query(File).filter(File.id == file_id, File.is_trashed == True).first()
        if not file_obj:
            raise ResourceNotFoundException("File in trash")
        if file_obj.owner_id != user.id:
            raise PermissionDeniedException()

        file_obj.is_trashed = False
        file_obj.trashed_at = None
        db.commit()
        return True

    @staticmethod
    def permanent_delete(db: Session, user: User, file_id: str) -> bool:
        file_obj = db.query(File).filter(File.id == file_id).first()
        if not file_obj:
            raise ResourceNotFoundException("File")
        if file_obj.owner_id != user.id:
            raise PermissionDeniedException()

        storage = get_storage_provider()
        storage.delete_object(file_obj.storage_key)

        db.delete(file_obj)
        db.commit()

        # Recalculate user storage usage
        QuotaService.recalculate_user_storage(db, user.id)
        return True
