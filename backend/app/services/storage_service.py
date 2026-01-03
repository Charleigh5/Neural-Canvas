"""
Neural Canvas Backend - Cloud Storage Service
Implements S3-compatible file uploads (Cloudflare R2, AWS S3, Backblaze B2)
per Context7/boto3 best practices:
- Multipart uploads for large files
- Progress tracking
- Retry logic with TransferConfig
"""

import logging
from typing import Optional
from io import BytesIO

import boto3
from botocore.exceptions import ClientError
from boto3.s3.transfer import TransferConfig

from app.config import settings

logger = logging.getLogger(__name__)


# Multipart threshold: 50MB (per Context7 best practices)
MB = 1024 * 1024
TRANSFER_CONFIG = TransferConfig(
    multipart_threshold=50 * MB,
    max_concurrency=10,
    multipart_chunksize=10 * MB,
    use_threads=True,
)


class StorageService:
    """
    Cloud storage service for processed images.
    Configured for Cloudflare R2 (S3-compatible).
    """

    def __init__(self):
        self.s3_client = None
        self.bucket = settings.r2_bucket
        self.public_url = settings.r2_public_url
        self._initialize_client()

    def _initialize_client(self):
        """Initialize S3-compatible client for R2."""
        if settings.r2_access_key_id and settings.r2_secret_access_key and settings.r2_endpoint_url:
            self.s3_client = boto3.client(
                "s3",
                region_name="auto",
                endpoint_url=settings.r2_endpoint_url,
                aws_access_key_id=settings.r2_access_key_id,
                aws_secret_access_key=settings.r2_secret_access_key,
            )
            logger.info("R2 storage client initialized: %s", settings.r2_endpoint_url)
        else:
            logger.warning("R2 credentials not configured, uploads disabled")

    def upload_image(
        self,
        image_bytes: bytes,
        object_key: str,
        content_type: str = "image/jpeg",
        metadata: Optional[dict] = None,
    ) -> Optional[str]:
        """
        Upload image bytes to R2.
        
        Returns:
            Public URL if successful, None on failure
        """
        if not self.s3_client:
            logger.error("R2 client not initialized")
            return None

        try:
            extra_args = {"ContentType": content_type}
            if metadata:
                extra_args["Metadata"] = metadata

            self.s3_client.upload_fileobj(
                BytesIO(image_bytes),
                self.bucket,
                object_key,
                ExtraArgs=extra_args,
                Config=TRANSFER_CONFIG,
            )

            url = f"{self.public_url}/{object_key}" if self.public_url else object_key
            logger.info("Uploaded to R2: %s", url)
            return url

        except ClientError as e:
            logger.error("R2 upload failed: %s", e)
            return None

    def upload_file(
        self,
        file_path: str,
        object_key: Optional[str] = None,
    ) -> Optional[str]:
        """Upload a file from disk to R2."""
        import os
        
        if not self.s3_client:
            logger.error("R2 client not initialized")
            return None

        if object_key is None:
            object_key = os.path.basename(file_path)

        try:
            self.s3_client.upload_file(
                file_path,
                self.bucket,
                object_key,
                Config=TRANSFER_CONFIG,
            )
            
            url = f"{self.public_url}/{object_key}" if self.public_url else object_key
            logger.info("Uploaded file to R2: %s", url)
            return url

        except ClientError as e:
            logger.error("R2 file upload failed: %s", e)
            return None

    def delete_object(self, object_key: str) -> bool:
        """Delete an object from R2."""
        if not self.s3_client:
            return False

        try:
            self.s3_client.delete_object(Bucket=self.bucket, Key=object_key)
            logger.info("Deleted from R2: %s", object_key)
            return True
        except ClientError as e:
            logger.error("R2 delete failed: %s", e)
            return False

    def generate_presigned_url(
        self,
        object_key: str,
        expiration: int = 3600,
    ) -> Optional[str]:
        """Generate a presigned URL for temporary access."""
        if not self.s3_client:
            return None

        try:
            return self.s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket, "Key": object_key},
                ExpiresIn=expiration,
            )
        except ClientError as e:
            logger.error("Presigned URL generation failed: %s", e)
            return None


# Singleton instance
storage_service = StorageService()
