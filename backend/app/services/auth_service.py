from sqlalchemy.orm import Session
from app.models.user import User
from app.models.audit import AuditEvent
from app.schemas.auth import UserRegister, UserLogin
from app.core.security import hash_password, verify_password, create_access_token, generate_secure_token
from app.core.exceptions import AuthenticationException, CloudoraException
from fastapi import status


class AuthService:
    @staticmethod
    def register_user(db: Session, reg_data: UserRegister, ip_address: str = None) -> User:
        # Check if email is already taken
        existing = db.query(User).filter(User.email == reg_data.email.lower()).first()
        if existing:
            raise CloudoraException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email address already exists",
                code="EMAIL_ALREADY_EXISTS"
            )

        hashed = hash_password(reg_data.password)
        # In local/development, account is activated and verified for instant usability
        user = User(
            email=reg_data.email.lower(),
            full_name=reg_data.full_name.strip(),
            hashed_password=hashed,
            is_active=True,
            is_verified=True  # In dev mode, auto-verify for frictionless onboarding
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Audit event
        audit = AuditEvent(
            user_id=user.id,
            action="USER_REGISTERED",
            target_type="user",
            target_id=user.id,
            ip_address=ip_address
        )
        db.add(audit)
        db.commit()

        return user

    @staticmethod
    def authenticate_user(db: Session, login_data: UserLogin, ip_address: str = None) -> tuple[User, str]:
        user = db.query(User).filter(User.email == login_data.email.lower()).first()
        if not user or not verify_password(login_data.password, user.hashed_password):
            raise AuthenticationException("Invalid email or password")

        if not user.is_active:
            raise CloudoraException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account has been deactivated",
                code="ACCOUNT_INACTIVE"
            )

        token = create_access_token(subject=user.id, claims={"email": user.email})

        # Audit event
        audit = AuditEvent(
            user_id=user.id,
            action="USER_LOGIN",
            target_type="user",
            target_id=user.id,
            ip_address=ip_address
        )
        db.add(audit)
        db.commit()

        return user, token
