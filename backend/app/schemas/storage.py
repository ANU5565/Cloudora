from typing import Dict, List
from pydantic import BaseModel
from app.schemas.file import FileResponse


class StorageStatsResponse(BaseModel):
    quota_bytes: int
    used_bytes: int
    remaining_bytes: int
    used_percent: float
    file_count: int
    by_category: Dict[str, int]
    largest_files: List[FileResponse]
