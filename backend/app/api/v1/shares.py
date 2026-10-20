from typing import List, Optional
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.share import Share
from app.schemas.share import (
    ShareCreateRequest,
    ShareResponse,
    PublicShareVerifyRequest,
    PublicShareResponse
)
from app.services.share_service import ShareService

router = APIRouter(prefix="/shares", tags=["shares"])


@router.post("", response_model=ShareResponse)
def create_share(
    data: ShareCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    share, share_url = ShareService.create_share(db, user, data)
    resp = ShareResponse.model_validate(share)
    resp.has_password = share.password_hash is not None
    resp.share_url = share_url
    return resp


@router.get("", response_model=List[ShareResponse])
def list_shares(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    shares = db.query(Share).filter(Share.owner_id == user.id, Share.is_revoked == False).all()
    results = []
    for s in shares:
        r = ShareResponse.model_validate(s)
        r.has_password = s.password_hash is not None
        results.append(r)
    return results


@router.delete("/{share_id}")
def revoke_share(
    share_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ShareService.revoke_share(db, user, share_id)
    return {"message": "Share link revoked"}


@router.post("/public/{token}", response_model=PublicShareResponse)
def access_public_share(
    token: str,
    data: Optional[PublicShareVerifyRequest] = None,
    request: Request = None,
    db: Session = Depends(get_db)
):
    ip = request.client.host if request and request.client else None
    pwd = data.password if data else None
    return ShareService.get_public_share(db, token, password=pwd, ip_address=ip)
