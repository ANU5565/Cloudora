from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.file import FileResponse
from app.schemas.folder import FolderResponse


class ShareCreateRequest(BaseModel):
    file_id: Optional[str] = None
    folder_id: Optional[str] = None
    access_policy: str = Field("download", pattern="^(view|download)$")
    password: Optional[str] = Field(None, max_length=128)
    expires_hours: Optional[int] = Field(None, gt=0, le=24 * 365)


class ShareResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    file_id: Optional[str]
    folder_id: Optional[str]
    access_policy: str
    has_password: bool = False
    expires_at: Optional[datetime]
    is_revoked: bool
    created_at: datetime
    share_url: Optional[str] = None


class PublicShareVerifyRequest(BaseModel):
    password: Optional[str] = None


class PublicShareResponse(BaseModel):
    id: str
    access_policy: str
    requires_password: bool
    expires_at: Optional[datetime]
    file: Optional[FileResponse] = None
    folder: Optional[FolderResponse] = None
    download_url: Optional[str] = None
