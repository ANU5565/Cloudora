from fastapi import HTTPException, status


class CloudoraException(HTTPException):
    def __init__(self, status_code: int, detail: str, code: str = "ERROR"):
        super().__init__(status_code=status_code, detail={"code": code, "message": detail})


class QuotaExceededException(CloudoraException):
    def __init__(self, detail: str = "Storage quota exceeded for this account"):
        super().__init__(status_code=status.HTTP_413_CONTENT_TOO_LARGE, detail=detail, code="QUOTA_EXCEEDED")


class FileTooLargeException(CloudoraException):
    def __init__(self, max_size_bytes: int):
        super().__init__(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {max_size_bytes} bytes",
            code="FILE_TOO_LARGE"
        )


class ResourceNotFoundException(CloudoraException):
    def __init__(self, resource: str = "Resource"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=f"{resource} not found", code="NOT_FOUND")


class PermissionDeniedException(CloudoraException):
    def __init__(self, detail: str = "You do not have permission to perform this action"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail, code="PERMISSION_DENIED")


class AuthenticationException(CloudoraException):
    def __init__(self, detail: str = "Invalid authentication credentials"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail, code="UNAUTHENTICATED")


class FolderCycleException(CloudoraException):
    def __init__(self, detail: str = "Cannot move a folder into itself or any of its subfolders"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail, code="FOLDER_CYCLE")


class ShareExpiredException(CloudoraException):
    def __init__(self, detail: str = "This share link has expired"):
        super().__init__(status_code=status.HTTP_410_GONE, detail=detail, code="SHARE_EXPIRED")


class ShareRevokedException(CloudoraException):
    def __init__(self, detail: str = "This share link has been revoked by the owner"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail, code="SHARE_REVOKED")
