from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.share import Share
from app.models.file import File
from app.models.folder import Folder
from app.models.user import User
from app.models.audit import AuditEvent
from app.schemas.share import ShareCreateRequest
from app.core.security import generate_secure_token, hash_token, hash_password, verify_password
from app.core.config import settings
from app.core.exceptions import (
    ResourceNotFoundException,
    PermissionDeniedException,
    ShareExpiredException,
    ShareRevokedException,
    CloudoraException
)
from app.storage import get_storage_provider
from fastapi import status


class ShareService:
    @staticmethod
    def create_share(db: Session, user: User, data: ShareCreateRequest) -> tuple[Share, str]:
        if not data.file_id and not data.folder_id:
            raise CloudoraException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Must specify either file_id or folder_id to share",
                code="INVALID_SHARE_TARGET"
            )

        if data.file_id:
            file_obj = db.query(File).filter(File.id == data.file_id, File.is_trashed == False).first()
            if not file_obj:
                raise ResourceNotFoundException("File")
            if file_obj.owner_id != user.id:
                raise PermissionDeniedException("Cannot share another user's file")

        if data.folder_id:
            folder_obj = db.query(Folder).filter(Folder.id == data.folder_id, Folder.is_trashed == False).first()
            if not folder_obj:
                raise ResourceNotFoundException("Folder")
            if folder_obj.owner_id != user.id:
                raise PermissionDeniedException("Cannot share another user's folder")

        raw_token = generate_secure_token(32)
        token_hash = hash_token(raw_token)

        expires_at = None
        if data.expires_hours:
            expires_at = datetime.now(timezone.utc) + timedelta(hours=data.expires_hours)

        pwd_hash = hash_password(data.password) if data.password else None

        share = Share(
            owner_id=user.id,
            file_id=data.file_id,
            folder_id=data.folder_id,
            token_hash=token_hash,
            access_policy=data.access_policy,
            password_hash=pwd_hash,
            expires_at=expires_at
        )
        db.add(share)
        db.commit()
        db.refresh(share)

        share_url = f"{settings.APP_URL.replace(':8000', ':3000')}/share/{raw_token}"

        audit = AuditEvent(
            user_id=user.id,
            action="SHARE_CREATED",
            target_type="share",
            target_id=share.id,
            details=f"Created share link for {'file ' + str(data.file_id) if data.file_id else 'folder ' + str(data.folder_id)}"
        )
        db.add(audit)
        db.commit()

        return share, share_url

    @staticmethod
    def revoke_share(db: Session, user: User, share_id: str) -> bool:
        share = db.query(Share).filter(Share.id == share_id).first()
        if not share:
            raise ResourceNotFoundException("Share link")
        if share.owner_id != user.id:
            raise PermissionDeniedException()

        share.is_revoked = True
        share.revoked_at = datetime.now(timezone.utc)
        db.commit()
        return True

    @staticmethod
    def get_public_share(db: Session, raw_token: str, password: Optional[str] = None, ip_address: str = None) -> Dict[str, Any]:
        token_hash = hash_token(raw_token)
        share = db.query(Share).filter(Share.token_hash == token_hash).first()
        if not share:
            raise ResourceNotFoundException("Share link")

        if share.is_revoked:
            raise ShareRevokedException()

        if share.expires_at and datetime.now(timezone.utc) > share.expires_at.replace(tzinfo=timezone.utc if share.expires_at.tzinfo is None else None):
            raise ShareExpiredException()

        requires_password = share.password_hash is not None
        if requires_password:
            if not password or not verify_password(password, share.password_hash):
                return {
                    "id": share.id,
                    "access_policy": share.access_policy,
                    "requires_password": True,
                    "expires_at": share.expires_at,
                    "file": None,
                    "folder": None,
                    "download_url": None
                }

        download_url = None
        file_obj = None
        if share.file_id:
            file_obj = db.query(File).filter(File.id == share.file_id, File.is_trashed == False).first()
            if not file_obj:
                raise ResourceNotFoundException("Shared file is no longer available")
            
            if share.access_policy in ["download", "view"]:
                storage = get_storage_provider()
                download_url = storage.generate_download_url(
                    storage_key=file_obj.storage_key,
                    display_name=file_obj.display_name,
                    expires_in=settings.SIGNED_URL_TTL_SECONDS
                )

        folder_obj = None
        if share.folder_id:
            folder_obj = db.query(Folder).filter(Folder.id == share.folder_id, Folder.is_trashed == False).first()

        # Audit access
        audit = AuditEvent(
            user_id=None,
            action="PUBLIC_SHARE_ACCESSED",
            target_type="share",
            target_id=share.id,
            ip_address=ip_address
        )
        db.add(audit)
        db.commit()

        return {
            "id": share.id,
            "access_policy": share.access_policy,
            "requires_password": False,
            "expires_at": share.expires_at,
            "file": file_obj,
            "folder": folder_obj,
            "download_url": download_url
        }
