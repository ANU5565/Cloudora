from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.file import File
from app.schemas.file import (
    UploadIntentRequest,
    UploadIntentResponse,
    CompleteUploadRequest,
    FileResponse,
    FilePatchRequest,
    DownloadIntentResponse,
    BulkFileActionRequest
)
from app.services.file_service import FileService

router = APIRouter(prefix="/files", tags=["files"])


@router.get("", response_model=List[FileResponse])
def list_files(
    folder_id: Optional[str] = Query(None),
    is_trashed: bool = Query(False),
    is_favorite: Optional[bool] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(File).filter(
        File.owner_id == user.id,
        File.is_trashed == is_trashed,
        File.upload_status == "completed"
    )

    if folder_id is not None:
        if folder_id in ["", "root"]:
            query = query.filter(File.folder_id == None)
        else:
            query = query.filter(File.folder_id == folder_id)

    if is_favorite is not None:
        query = query.filter(File.is_favorite == is_favorite)

    return query.order_by(File.updated_at.desc()).offset(offset).limit(limit).all()


@router.post("/upload-intents", response_model=UploadIntentResponse)
def create_upload_intent(
    data: UploadIntentRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return FileService.create_upload_intent(db, user, data)


@router.post("/{file_id}/complete-upload", response_model=FileResponse)
def complete_upload(
    file_id: str,
    data: CompleteUploadRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return FileService.complete_upload(db, user, data.upload_session_id)


@router.post("/{file_id}/download-intent", response_model=DownloadIntentResponse)
def create_download_intent(
    file_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return FileService.create_download_intent(db, user, file_id)


@router.patch("/{file_id}", response_model=FileResponse)
def patch_file(
    file_id: str,
    data: FilePatchRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return FileService.patch_file(db, user, file_id, data)


@router.delete("/{file_id}")
def trash_file(
    file_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    FileService.trash_file(db, user, file_id)
    return {"message": "File moved to trash"}


@router.post("/{file_id}/restore")
def restore_file(
    file_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    FileService.restore_file(db, user, file_id)
    return {"message": "File restored from trash"}


@router.delete("/{file_id}/permanent")
def permanent_delete_file(
    file_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    FileService.permanent_delete(db, user, file_id)
    return {"message": "File permanently deleted"}


@router.post("/bulk")
def bulk_file_action(
    data: BulkFileActionRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    for fid in data.file_ids:
        if data.action == "trash":
            FileService.trash_file(db, user, fid)
        elif data.action == "restore":
            FileService.restore_file(db, user, fid)
        elif data.action == "delete":
            FileService.permanent_delete(db, user, fid)
        elif data.action == "favorite":
            FileService.patch_file(db, user, fid, FilePatchRequest(is_favorite=True))
        elif data.action == "unfavorite":
            FileService.patch_file(db, user, fid, FilePatchRequest(is_favorite=False))
    return {"message": f"Bulk {data.action} completed for {len(data.file_ids)} files"}
