from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.core.security import decode_access_token
from app.core.exceptions import AuthenticationException

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    if not token:
        raise AuthenticationException("Not authenticated")

    payload = decode_access_token(token)
    if not payload:
        raise AuthenticationException("Invalid or expired session token")

    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationException("Invalid token payload")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise AuthenticationException("User no longer exists")

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )

    return user
