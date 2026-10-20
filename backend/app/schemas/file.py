from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict


class UploadIntentRequest(BaseModel):
    filename: str = Field(..., min_length=1, max_length=255)
    size_bytes: int = Field(..., gt=0)
    mime_type: Optional[str] = "application/octet-stream"
    folder_id: Optional[str] = None


class UploadIntentResponse(BaseModel):
    file_id: str
    upload_session_id: str
    upload_url: str
    method: str
    headers: Dict[str, str] = {}
    expires_at: datetime


class CompleteUploadRequest(BaseModel):
    upload_session_id: str


class FileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    owner_id: str
    folder_id: Optional[str]
    display_name: str
    mime_type: str
    size_bytes: int
    upload_status: str
    checksum: Optional[str]
    is_favorite: bool
    is_trashed: bool
    trashed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


class FilePatchRequest(BaseModel):
    display_name: Optional[str] = Field(None, min_length=1, max_length=255)
    folder_id: Optional[str] = None
    is_favorite: Optional[bool] = None


class DownloadIntentResponse(BaseModel):
    download_url: str
    expires_in: int
    filename: str
    mime_type: str
    size_bytes: int


class BulkFileActionRequest(BaseModel):
    file_ids: List[str] = Field(..., min_length=1)
    action: str = Field(..., pattern="^(delete|trash|restore|favorite|unfavorite)$")
