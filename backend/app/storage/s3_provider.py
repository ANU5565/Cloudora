import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from typing import Dict, Any, BinaryIO
from app.storage.base import StorageProvider
from app.core.config import settings


class S3StorageProvider(StorageProvider):
    """
    Cloudflare R2 and AWS S3 compatible object storage provider.
    Uses AWS Signature Version 4 for presigned upload and download URLs.
    """

    def __init__(self):
        self.bucket = settings.S3_BUCKET_NAME
        s3_kwargs = {
            "service_name": "s3",
            "region_name": settings.S3_REGION,
            "config": Config(signature_version="s3v4")
        }
        if settings.S3_ENDPOINT_URL:
            s3_kwargs["endpoint_url"] = settings.S3_ENDPOINT_URL
        if settings.S3_ACCESS_KEY_ID and settings.S3_SECRET_ACCESS_KEY:
            s3_kwargs["aws_access_key_id"] = settings.S3_ACCESS_KEY_ID
            s3_kwargs["aws_secret_access_key"] = settings.S3_SECRET_ACCESS_KEY

        self.client = boto3.client(**s3_kwargs)

    def generate_upload_url(
        self,
        storage_key: str,
        content_type: str,
        max_size_bytes: int,
        expires_in: int = 900
    ) -> Dict[str, Any]:
        url = self.client.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": self.bucket,
                "Key": storage_key,
                "ContentType": content_type,
            },
            ExpiresIn=expires_in,
        )
        return {
            "upload_url": url,
            "method": "PUT",
            "headers": {"Content-Type": content_type},
            "fields": {}
        }

    def verify_object(self, storage_key: str) -> Dict[str, Any]:
        try:
            res = self.client.head_object(Bucket=self.bucket, Key=storage_key)
            return {
                "exists": True,
                "size_bytes": res.get("ContentLength", 0),
                "content_type": res.get("ContentType", "application/octet-stream"),
                "etag": res.get("ETag", "").strip('"')
            }
        except ClientError as e:
            if e.response["Error"]["Code"] in ("404", "NoSuchKey"):
                return {"exists": False, "size_bytes": 0, "content_type": "application/octet-stream", "etag": None}
            raise e

    def generate_download_url(
        self,
        storage_key: str,
        display_name: str,
        expires_in: int = 900
    ) -> str:
        safe_disposition = f'attachment; filename="{display_name}"'
        return self.client.generate_presigned_url(
            ClientMethod="get_object",
            Params={
                "Bucket": self.bucket,
                "Key": storage_key,
                "ResponseContentDisposition": safe_disposition
            },
            ExpiresIn=expires_in,
        )

    def delete_object(self, storage_key: str) -> bool:
        try:
            self.client.delete_object(Bucket=self.bucket, Key=storage_key)
            return True
        except ClientError:
            return False

    def save_file_stream(self, storage_key: str, stream: BinaryIO, content_type: str) -> int:
        self.client.upload_fileobj(
            stream,
            self.bucket,
            storage_key,
            ExtraArgs={"ContentType": content_type}
        )
        meta = self.verify_object(storage_key)
        return meta.get("size_bytes", 0)

    def get_file_stream(self, storage_key: str) -> BinaryIO:
        res = self.client.get_object(Bucket=self.bucket, Key=storage_key)
        return res["Body"]
