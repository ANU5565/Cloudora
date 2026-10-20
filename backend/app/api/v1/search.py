from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.file import File
from app.models.folder import Folder
from app.schemas.file import FileResponse
from app.schemas.folder import FolderResponse
from pydantic import BaseModel

router = APIRouter(prefix="/search", tags=["search"])


class SearchResponse(BaseModel):
    files: List[FileResponse]
    folders: List[FolderResponse]


@router.get("", response_model=SearchResponse)
def search(
    q: str = Query("", min_length=0, max_length=100),
    file_type: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query_text = f"%{q.strip()}%" if q.strip() else "%"

    # Search files
    file_query = db.query(File).filter(
        File.owner_id == user.id,
        File.is_trashed == False,
        File.upload_status == "completed",
        File.display_name.ilike(query_text)
    )

    if file_type:
        ft = file_type.lower()
        if ft == "image":
            file_query = file_query.filter(File.mime_type.ilike("image/%"))
        elif ft == "video":
            file_query = file_query.filter(File.mime_type.ilike("video/%"))
        elif ft == "audio":
            file_query = file_query.filter(File.mime_type.ilike("audio/%"))
        elif ft == "document":
            file_query = file_query.filter(or_(
                File.mime_type.ilike("application/pdf%"),
                File.mime_type.ilike("%word%"),
                File.mime_type.ilike("%sheet%"),
                File.mime_type.ilike("text/%")
            ))

    files = file_query.order_by(File.updated_at.desc()).limit(50).all()

    # Search folders
    folder_query = db.query(Folder).filter(
        Folder.owner_id == user.id,
        Folder.is_trashed == False,
        Folder.name.ilike(query_text)
    )
    folders = folder_query.order_by(Folder.name.asc()).limit(20).all()

    return SearchResponse(files=files, folders=folders)
