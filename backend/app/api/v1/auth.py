from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.auth import UserRegister, UserLogin, UserResponse, TokenResponse, ChangePasswordRequest
from app.services.auth_service import AuthService
from app.api.deps import get_current_user
from app.models.user import User
from app.core.security import verify_password, hash_password
from app.core.exceptions import AuthenticationException

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse)
def register(data: UserRegister, request: Request, db: Session = Depends(get_db)):
    ip = request.client.host if request.client else None
    return AuthService.register_user(db, data, ip_address=ip)


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, request: Request, db: Session = Depends(get_db)):
    ip = request.client.host if request.client else None
    user, token = AuthService.authenticate_user(db, data, ip_address=ip)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    return user


@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(data.current_password, user.hashed_password):
        raise AuthenticationException("Current password is incorrect")

    user.hashed_password = hash_password(data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}
