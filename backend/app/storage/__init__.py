from app.core.config import settings
from app.storage.base import StorageProvider
from app.storage.local_provider import LocalStorageProvider
from app.storage.s3_provider import S3StorageProvider

_provider_instance = None


def get_storage_provider() -> StorageProvider:
    global _provider_instance
    if _provider_instance is None:
        if settings.STORAGE_PROVIDER == "s3":
            _provider_instance = S3StorageProvider()
        else:
            _provider_instance = LocalStorageProvider()
    return _provider_instance


__all__ = ["StorageProvider", "LocalStorageProvider", "S3StorageProvider", "get_storage_provider"]
