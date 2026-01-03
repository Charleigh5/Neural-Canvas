"""
Neural Canvas Backend - FastAPI Application Entry Point
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine
from app.routers import auth_router, users_router, assets_router, reels_router, themes_router, batch_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    print("🚀 Neural Canvas Backend starting...")
    yield
    # Shutdown
    await engine.dispose()
    print("👋 Neural Canvas Backend shutdown complete.")


# Create FastAPI application
app = FastAPI(
    title="Neural Canvas API",
    description="Backend API for Neural Canvas - AI-powered image orchestration studio",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers (routers define their own prefix internally)
app.include_router(auth_router, tags=["auth"])
app.include_router(users_router, tags=["users"])
app.include_router(assets_router, tags=["assets"])
app.include_router(reels_router, prefix="/reels", tags=["reels"])  # Has no internal prefix
app.include_router(themes_router, prefix="/themes", tags=["themes"])  # Has no internal prefix
app.include_router(batch_router, tags=["batch"])


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "Neural Canvas API",
        "version": "1.0.0",
    }


@app.get("/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "database": "connected",
        "environment": settings.environment,
    }
