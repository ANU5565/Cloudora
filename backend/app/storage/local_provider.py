import os
import hmac
import hashlib
import time
import shutil
from typing import Dict, Any, BinaryIO
from app.storage.base import StorageProvider
from app.core.config import settings


class LocalStorageProvider(StorageProvider):
    """
    Local object storage implementation for local development, test environments,
    and isolated testing without requiring third-party credentials.
    Files are stored isolated in a designated storage directory.
    Upload and download URLs use HMAC signature verification and TTL.
    """

    def __init__(self, base_dir: str = None):
        self.base_dir = os.path.abspath(base_dir or settings.LOCAL_STORAGE_PATH)
        os.makedirs(self.base_dir, exist_ok=True)

    def _get_path(self, storage_key: str) -> str:
        # Prevent any path traversal in key
        clean_key = storage_key.replace("..", "").lstrip("/\\")
        return os.path.join(self.base_dir, clean_key)

    def _generate_signature(self, action: str, storage_key: str, expires_at: int) -> str:
        msg = f"{action}:{storage_key}:{expires_at}".encode("utf-8")
        return hmac.new(settings.JWT_SECRET_KEY.encode("utf-8"), msg, hashlib.sha256).hexdigest()

    def verify_signature(self, action: str, storage_key: str, expires_at: int, signature: str) -> bool:
        if time.time() > expires_at:
            return False
        expected = self._generate_signature(action, storage_key, expires_at)
        return hmac.compare_digest(expected, signature)

    def generate_upload_url(
        self,
        storage_key: str,
        content_type: str,
        max_size_bytes: int,
        expires_in: int = 900
    ) -> Dict[str, Any]:
        expires_at = int(time.time()) + expires_in
        sig = self._generate_signature("upload", storage_key, expires_at)
        url = f"{settings.APP_URL}/api/v1/storage/upload?key={storage_key}&exp={expires_at}&sig={sig}"
        return {
            "upload_url": url,
            "method": "PUT",
            "headers": {"Content-Type": content_type},
            "fields": {}
        }

    def verify_object(self, storage_key: str) -> Dict[str, Any]:
        file_path = self._get_path(storage_key)
        if not os.path.exists(file_path):
            return {"exists": False, "size_bytes": 0, "content_type": "application/octet-stream", "etag": None}

        size = os.path.getsize(file_path)
        # Compute sha256
        sha = hashlib.sha256()
        with open(file_path, "rb") as f:
            while chunk := f.read(65536):
                sha.update(chunk)

        return {
            "exists": True,
            "size_bytes": size,
            "content_type": "application/octet-stream",
            "etag": sha.hexdigest()
        }

    def generate_download_url(
        self,
        storage_key: str,
        display_name: str,
        expires_in: int = 900
    ) -> str:
        expires_at = int(time.time()) + expires_in
        sig = self._generate_signature("download", storage_key, expires_at)
        # Safe URL
        import urllib.parse
        encoded_name = urllib.parse.quote(display_name)
        return f"{settings.APP_URL}/api/v1/storage/download?key={storage_key}&exp={expires_at}&sig={sig}&filename={encoded_name}"

    def delete_object(self, storage_key: str) -> bool:
        file_path = self._get_path(storage_key)
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False

    def save_file_stream(self, storage_key: str, stream: BinaryIO, content_type: str) -> int:
        file_path = self._get_path(storage_key)
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "wb") as f:
            shutil.copyfileobj(stream, f)
        return os.path.getsize(file_path)

    def get_file_stream(self, storage_key: str) -> BinaryIO:
        file_path = self._get_path(storage_key)
        return open(file_path, "rb")
