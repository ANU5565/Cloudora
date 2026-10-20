from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.user import User
from app.models.file import File
from app.models.upload_session import UploadSession
from app.core.exceptions import QuotaExceededException
from datetime import datetime, timezone
from typing import Dict, Any, List


class QuotaService:
    @staticmethod
    def check_and_reserve_quota(db: Session, user: User, size_bytes: int) -> int:
        """
        Check if user has sufficient quota for an upload, taking pending upload sessions into account.
        Raises QuotaExceededException if quota would be exceeded.
        """
        # Calculate currently reserved bytes from active pending upload sessions
        now = datetime.now(timezone.utc)
        reserved_query = db.query(func.coalesce(func.sum(UploadSession.reserved_bytes), 0)).filter(
            UploadSession.owner_id == user.id,
            UploadSession.status == "pending",
            UploadSession.expires_at > now
        ).scalar()
        
        pending_reserved = int(reserved_query or 0)
        total_projected = user.storage_used_bytes + pending_reserved + size_bytes

        if total_projected > user.storage_quota_bytes:
            raise QuotaExceededException(
                f"Upload of {size_bytes} bytes exceeds remaining quota. "
                f"Used: {user.storage_used_bytes}, Pending: {pending_reserved}, Quota: {user.storage_quota_bytes}"
            )
        return total_projected

    @staticmethod
    def recalculate_user_storage(db: Session, user_id: str) -> int:
        """Authoritatively sum all completed, non-trashed file sizes for the user and update User record."""
        total = db.query(func.coalesce(func.sum(File.size_bytes), 0)).filter(
            File.owner_id == user_id,
            File.upload_status == "completed"
        ).scalar()
        total_bytes = int(total or 0)

        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.storage_used_bytes = total_bytes
            db.commit()
            db.refresh(user)
        return total_bytes

    @staticmethod
    def get_storage_breakdown(db: Session, user: User) -> Dict[str, Any]:
        """Categorize completed user files into types and find largest files."""
        files = db.query(File).filter(
            File.owner_id == user.id,
            File.upload_status == "completed",
            File.is_trashed == False
        ).all()

        categories = {
            "images": 0,
            "videos": 0,
            "documents": 0,
            "audio": 0,
            "archives": 0,
            "code": 0,
            "others": 0
        }

        for f in files:
            m = f.mime_type.lower()
            ext = f.display_name.split(".")[-1].lower() if "." in f.display_name else ""

            if m.startswith("image/"):
                categories["images"] += f.size_bytes
            elif m.startswith("video/"):
                categories["videos"] += f.size_bytes
            elif m.startswith("audio/"):
                categories["audio"] += f.size_bytes
            elif m in ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"] or ext in ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "pdf", "rtf", "csv"]:
                categories["documents"] += f.size_bytes
            elif m in ["application/zip", "application/x-tar", "application/x-rar-compressed", "application/gzip", "application/x-7z-compressed"] or ext in ["zip", "tar", "gz", "rar", "7z"]:
                categories["archives"] += f.size_bytes
            elif ext in ["py", "js", "ts", "tsx", "jsx", "html", "css", "json", "md", "rs", "go", "java", "cpp", "c", "sh", "sql"]:
                categories["code"] += f.size_bytes
            else:
                categories["others"] += f.size_bytes

        # Largest 10 files
        largest = db.query(File).filter(
            File.owner_id == user.id,
            File.upload_status == "completed",
            File.is_trashed == False
        ).order_by(File.size_bytes.desc()).limit(10).all()

        remaining = max(0, user.storage_quota_bytes - user.storage_used_bytes)
        pct = round((user.storage_used_bytes / user.storage_quota_bytes * 100), 2) if user.storage_quota_bytes > 0 else 0.0

        return {
            "quota_bytes": user.storage_quota_bytes,
            "used_bytes": user.storage_used_bytes,
            "remaining_bytes": remaining,
            "used_percent": pct,
            "file_count": len(files),
            "by_category": categories,
            "largest_files": largest
        }
