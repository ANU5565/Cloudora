from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, BinaryIO


class StorageProvider(ABC):
    """Abstract interface for object storage providers (Cloudflare R2, S3, Local)."""

    @abstractmethod
    def generate_upload_url(
        self,
        storage_key: str,
        content_type: str,
        max_size_bytes: int,
        expires_in: int = 900
    ) -> Dict[str, Any]:
        """
        Generate short-lived upload authorization.
        Returns a dictionary with 'upload_url', 'method' (PUT/POST), and any required 'fields' or 'headers'.
        """
        pass

    @abstractmethod
    def verify_object(self, storage_key: str) -> Dict[str, Any]:
        """
        Verify that an object exists in storage and retrieve its authoritative size and content type.
        Returns dict with: 'exists': bool, 'size_bytes': int, 'content_type': str, 'etag': Optional[str]
        """
        pass

    @abstractmethod
    def generate_download_url(
        self,
        storage_key: str,
        display_name: str,
        expires_in: int = 900
    ) -> str:
        """
        Generate a short-lived download URL with safe Content-Disposition headers.
        """
        pass

    @abstractmethod
    def delete_object(self, storage_key: str) -> bool:
        """Delete an object permanently from storage."""
        pass

    @abstractmethod
    def save_file_stream(self, storage_key: str, stream: BinaryIO, content_type: str) -> int:
        """Directly save a file stream (used for testing or direct proxy uploads). Returns size in bytes."""
        pass

    @abstractmethod
    def get_file_stream(self, storage_key: str) -> BinaryIO:
        """Retrieve binary stream of an object."""
        pass
