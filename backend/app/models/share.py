import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.session import Base


class Share(Base):
    __tablename__ = "shares"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    file_id = Column(String(36), ForeignKey("files.id", ondelete="CASCADE"), nullable=True, index=True)
    folder_id = Column(String(36), ForeignKey("folders.id", ondelete="CASCADE"), nullable=True, index=True)

    token_hash = Column(String(64), unique=True, nullable=False, index=True)
    access_policy = Column(String(32), default="download", nullable=False)  # "view", "download"
    password_hash = Column(String(255), nullable=True)

    expires_at = Column(DateTime, nullable=True, index=True)
    is_revoked = Column(Boolean, default=False, nullable=False, index=True)
    revoked_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    owner = relationship("User", back_populates="shares")
    file = relationship("File", back_populates="shares")

    @property
    def has_password(self) -> bool:
        return self.password_hash is not None


Index("ix_shares_token_revoked", Share.token_hash, Share.is_revoked)
