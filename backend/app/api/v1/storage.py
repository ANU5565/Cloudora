from fastapi import APIRouter, Depends, Request, Response, Query, HTTPException, status
from fastapi.responses import FileResponse as FastApiFileResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.storage import StorageStatsResponse
from app.services.quota_service import QuotaService
from app.storage import get_storage_provider
from app.storage.local_provider import LocalStorageProvider

router = APIRouter(prefix="/storage", tags=["storage"])


@router.get("/stats", response_model=StorageStatsResponse)
def get_storage_stats(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return QuotaService.get_storage_breakdown(db, user)


@router.put("/upload")
async def local_storage_upload_handler(
    request: Request,
    key: str = Query(...),
    exp: int = Query(...),
    sig: str = Query(...)
):
    """
    Direct upload handler for local object storage development mode.
    Verifies HMAC signature and expiration before streaming body to disk.
    """
    storage = get_storage_provider()
    if not isinstance(storage, LocalStorageProvider):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Direct upload endpoint only active for local storage provider")

    if not storage.verify_signature("upload", key, exp, sig):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Signature invalid or expired")

    # Read body stream and save
    file_path = storage._get_path(key)
    import os
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, "wb") as f:
        async for chunk in request.stream():
            f.write(chunk)

    return {"message": "Upload successful", "bytes_received": os.path.getsize(file_path)}


@router.get("/download")
def local_storage_download_handler(
    key: str = Query(...),
    exp: int = Query(...),
    sig: str = Query(...),
    filename: str = Query("file")
):
    """
    Direct download handler for local object storage development mode.
    Verifies HMAC signature and expiration before returning file.
    """
    storage = get_storage_provider()
    if not isinstance(storage, LocalStorageProvider):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Direct download endpoint only active for local storage provider")

    if not storage.verify_signature("download", key, exp, sig):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Signature invalid or expired")

    file_path = storage._get_path(key)
    import os
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Object not found in storage")

    return FastApiFileResponse(
        path=file_path,
        filename=filename,
        media_type="application/octet-stream"
    )
