import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, BigInteger, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base


class UploadSession(Base):
    __tablename__ = "upload_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    file_id = Column(String(36), ForeignKey("files.id", ondelete="CASCADE"), nullable=False, index=True)

    storage_key = Column(String(512), nullable=False)
    reserved_bytes = Column(BigInteger, nullable=False)
    # "pending", "completed", "cancelled", "expired"
    status = Column(String(32), default="pending", nullable=False)

    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    owner = relationship("User", back_populates="upload_sessions")
