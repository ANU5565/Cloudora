from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings
from app.core.logging import logger
from app.db.session import engine, Base
import app.models  # Ensure models are loaded

# Routers
from app.api.v1.auth import router as auth_router
from app.api.v1.files import router as files_router
from app.api.v1.folders import router as folders_router
from app.api.v1.shares import router as shares_router
from app.api.v1.storage import router as storage_router
from app.api.v1.search import router as search_router

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="Cloudora - Modern Privacy-Focused Cloud Storage API",
    version="1.0.0",
    docs_url="/docs" if settings.APP_ENV != "production" else None,
    redoc_url=None
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        return response


# Add middlewares
app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Length"]
)


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {str(exc)}", exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={"code": "INTERNAL_SERVER_ERROR", "message": "An unexpected error occurred. Please try again later."}
    )


# Health check
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "storage_provider": settings.STORAGE_PROVIDER
    }


# Include v1 routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(files_router, prefix="/api/v1")
app.include_router(folders_router, prefix="/api/v1")
app.include_router(shares_router, prefix="/api/v1")
app.include_router(storage_router, prefix="/api/v1")
app.include_router(search_router, prefix="/api/v1")
