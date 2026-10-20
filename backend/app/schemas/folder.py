from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.file import FileResponse


class FolderCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    parent_id: Optional[str] = None


class FolderPatchRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    parent_id: Optional[str] = None


class FolderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    owner_id: str
    parent_id: Optional[str]
    name: str
    is_trashed: bool
    trashed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


class BreadcrumbItem(BaseModel):
    id: Optional[str]
    name: str


class FolderContentsResponse(BaseModel):
    current_folder: Optional[FolderResponse] = None
    breadcrumbs: List[BreadcrumbItem] = []
    folders: List[FolderResponse] = []
    files: List[FileResponse] = []
