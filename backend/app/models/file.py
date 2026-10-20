import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, BigInteger, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.session import Base


class File(Base):
    __tablename__ = "files"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    folder_id = Column(String(36), ForeignKey("folders.id", ondelete="SET NULL"), nullable=True, index=True)
    
    display_name = Column(String(255), nullable=False)
    storage_key = Column(String(512), unique=True, nullable=False, index=True)
    mime_type = Column(String(128), default="application/octet-stream", nullable=False)
    size_bytes = Column(BigInteger, default=0, nullable=False)
    
    # "pending", "completed", "failed"
    upload_status = Column(String(32), default="pending", nullable=False, index=True)
    checksum = Column(String(64), nullable=True)
    
    is_favorite = Column(Boolean, default=False, nullable=False, index=True)
    is_trashed = Column(Boolean, default=False, nullable=False, index=True)
    trashed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    owner = relationship("User", back_populates="files")
    folder = relationship("Folder", back_populates="files")
    shares = relationship("Share", back_populates="file", cascade="all, delete-orphan")


Index("ix_files_owner_trashed", File.owner_id, File.is_trashed)
Index("ix_files_owner_folder", File.owner_id, File.folder_id)
