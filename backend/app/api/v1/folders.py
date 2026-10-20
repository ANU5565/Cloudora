from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.folder import Folder
from app.models.file import File
from app.schemas.folder import (
    FolderCreateRequest,
    FolderPatchRequest,
    FolderResponse,
    FolderContentsResponse
)
from app.services.folder_service import FolderService

router = APIRouter(prefix="/folders", tags=["folders"])


@router.get("", response_model=List[FolderResponse])
def list_folders(
    parent_id: Optional[str] = Query(None),
    is_trashed: bool = Query(False),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Folder).filter(
        Folder.owner_id == user.id,
        Folder.is_trashed == is_trashed
    )
    if parent_id is not None:
        if parent_id in ["", "root"]:
            query = query.filter(Folder.parent_id == None)
        else:
            query = query.filter(Folder.parent_id == parent_id)

    return query.order_by(Folder.name.asc()).all()


@router.post("", response_model=FolderResponse)
def create_folder(
    data: FolderCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return FolderService.create_folder(db, user, data)


@router.get("/{folder_id}/contents", response_model=FolderContentsResponse)
def get_folder_contents(
    folder_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    actual_folder_id = None if folder_id in ["root", "none", ""] else folder_id
    current_folder = None
    if actual_folder_id:
        current_folder = db.query(Folder).filter(
            Folder.id == actual_folder_id,
            Folder.owner_id == user.id,
            Folder.is_trashed == False
        ).first()

    breadcrumbs = FolderService.get_breadcrumbs(db, actual_folder_id, user.id)

    # Subfolders
    folders = db.query(Folder).filter(
        Folder.owner_id == user.id,
        Folder.parent_id == actual_folder_id,
        Folder.is_trashed == False
    ).order_by(Folder.name.asc()).all()

    # Files
    files = db.query(File).filter(
        File.owner_id == user.id,
        File.folder_id == actual_folder_id,
        File.upload_status == "completed",
        File.is_trashed == False
    ).order_by(File.display_name.asc()).all()

    return FolderContentsResponse(
        current_folder=current_folder,
        breadcrumbs=breadcrumbs,
        folders=folders,
        files=files
    )


@router.patch("/{folder_id}", response_model=FolderResponse)
def patch_folder(
    folder_id: str,
    data: FolderPatchRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return FolderService.patch_folder(db, user, folder_id, data)


@router.delete("/{folder_id}")
def trash_folder(
    folder_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    FolderService.trash_folder(db, user, folder_id)
    return {"message": "Folder and contents moved to trash"}


@router.post("/{folder_id}/restore")
def restore_folder(
    folder_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    FolderService.restore_folder(db, user, folder_id)
    return {"message": "Folder and contents restored from trash"}
