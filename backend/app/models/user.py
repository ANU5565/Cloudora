import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, BigInteger, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.core.config import settings


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    
    # Storage quota tracking
    storage_quota_bytes = Column(BigInteger, default=settings.DEFAULT_STORAGE_QUOTA, nullable=False)
    storage_used_bytes = Column(BigInteger, default=0, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    files = relationship("File", back_populates="owner", cascade="all, delete-orphan")
    folders = relationship("Folder", back_populates="owner", cascade="all, delete-orphan")
    shares = relationship("Share", back_populates="owner", cascade="all, delete-orphan")
    upload_sessions = relationship("UploadSession", back_populates="owner", cascade="all, delete-orphan")
