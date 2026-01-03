"""
Neural Canvas Backend - Batch Processing Router
Handles batch operations for assets: AI analysis, filters, bulk edits.
Industry Best Practice: Async background tasks for scalable processing.
"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.database import get_async_db
from app.models.user import User
from app.models.asset import Asset
from app.dependencies import get_current_active_user
from app.services.image_processor import image_processor
from app.crud.asset import get_asset_by_id, create_asset
from app.schemas.asset import AssetCreate


router = APIRouter(prefix="/batch", tags=["Batch Processing"])


# --- Request/Response Schemas ---

class BatchProcessRequest(BaseModel):
    """Request to process multiple assets."""
    asset_ids: list[str]
    operation: str  # "analyze", "resize", "filter", "thumbnail"
    params: Optional[dict] = None  # Operation-specific parameters


class BatchJobResponse(BaseModel):
    """Response after submitting a batch job."""
    job_id: str
    status: str  # "queued", "processing", "completed", "failed"
    total_assets: int
    message: str


class BatchStatusResponse(BaseModel):
    """Status of a batch job."""
    job_id: str
    status: str
    processed: int
    total: int
    failed_ids: list[str]


# --- In-memory job tracking (for MVP; use Redis in production) ---
_batch_jobs: dict[str, dict] = {}


# --- Background Task Functions ---

async def process_batch_analyze(
    job_id: str,
    asset_ids: list[str],
    user_id: str,
    db_url: str,  # We'll need to create a new session in the background
):
    """
    Background task: Analyze multiple assets with Gemini.
    Creates new versioned assets with analysis results.
    """
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker
    
    engine = create_async_engine(db_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    job = _batch_jobs[job_id]
    job["status"] = "processing"
    
    async with async_session() as db:
        for asset_id in asset_ids:
            try:
                # Get asset
                result = await db.execute(
                    Asset.__table__.select().where(
                        Asset.id == asset_id,
                        Asset.owner_id == user_id
                    )
                )
                asset_row = result.fetchone()
                if not asset_row:
                    job["failed_ids"].append(asset_id)
                    continue
                
                # Download and analyze
                image = await image_processor.download_image(asset_row.storage_url)
                analysis = await image_processor.analyze_with_gemini(image)
                
                # Update asset with analysis
                await db.execute(
                    Asset.__table__.update()
                    .where(Asset.id == asset_id)
                    .values(
                        tags=analysis.get("tags", []),
                        caption=analysis.get("caption"),
                        analyzed=True,
                        processing_status="completed"
                    )
                )
                await db.commit()
                
                job["processed"] += 1
                
            except Exception as e:
                print(f"[BATCH] Failed to process {asset_id}: {e}")
                job["failed_ids"].append(asset_id)
    
    job["status"] = "completed" if not job["failed_ids"] else "partial"
    await engine.dispose()


async def process_batch_filter(
    job_id: str,
    asset_ids: list[str],
    user_id: str,
    filter_type: str,
    db_url: str,
):
    """
    Background task: Apply filter to assets, creating new versions.
    Preserves originals (versioning).
    """
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker
    
    engine = create_async_engine(db_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    job = _batch_jobs[job_id]
    job["status"] = "processing"
    
    async with async_session() as db:
        for asset_id in asset_ids:
            try:
                # Get original asset
                result = await db.execute(
                    Asset.__table__.select().where(
                        Asset.id == asset_id,
                        Asset.owner_id == user_id
                    )
                )
                asset_row = result.fetchone()
                if not asset_row:
                    job["failed_ids"].append(asset_id)
                    continue
                
                # Download, apply filter
                image = await image_processor.download_image(asset_row.storage_url)
                filtered = image_processor.apply_filter(image, filter_type)
                
                # TODO: Upload filtered image to cloud storage
                # For now, just mark as processed
                
                # Create new version asset
                new_id = str(uuid.uuid4())
                new_asset = Asset(
                    id=new_id,
                    owner_id=user_id,
                    parent_id=asset_id,  # Link to original
                    version_number=2,  # TODO: Query max version
                    is_original=False,
                    processing_status="completed",
                    storage_url=asset_row.storage_url,  # TODO: Use new URL
                    thumbnail_url=asset_row.thumbnail_url,
                    width=filtered.width,
                    height=filtered.height,
                    original_filename=f"{asset_row.original_filename}_{filter_type}",
                    mime_type=asset_row.mime_type,
                )
                db.add(new_asset)
                await db.commit()
                
                job["processed"] += 1
                
            except Exception as e:
                print(f"[BATCH] Failed to process {asset_id}: {e}")
                job["failed_ids"].append(asset_id)
    
    job["status"] = "completed" if not job["failed_ids"] else "partial"
    await engine.dispose()


# --- API Endpoints ---

@router.post("/process", response_model=BatchJobResponse)
async def submit_batch_job(
    request: BatchProcessRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db),
) -> BatchJobResponse:
    """
    Submit a batch processing job.
    Operations: analyze, resize, filter, thumbnail
    """
    if not request.asset_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No asset IDs provided"
        )
    
    if request.operation not in ["analyze", "resize", "filter", "thumbnail"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown operation: {request.operation}"
        )
    
    # Create job
    job_id = str(uuid.uuid4())
    _batch_jobs[job_id] = {
        "status": "queued",
        "processed": 0,
        "total": len(request.asset_ids),
        "failed_ids": [],
    }
    
    # Get DB URL for background task
    from app.config import settings
    db_url = settings.database_url
    
    # Schedule background task
    if request.operation == "analyze":
        background_tasks.add_task(
            process_batch_analyze,
            job_id,
            request.asset_ids,
            current_user.id,
            db_url,
        )
    elif request.operation == "filter":
        filter_type = request.params.get("filter_type", "grayscale") if request.params else "grayscale"
        background_tasks.add_task(
            process_batch_filter,
            job_id,
            request.asset_ids,
            current_user.id,
            filter_type,
            db_url,
        )
    else:
        # TODO: Implement other operations
        _batch_jobs[job_id]["status"] = "failed"
        return BatchJobResponse(
            job_id=job_id,
            status="failed",
            total_assets=len(request.asset_ids),
            message=f"Operation '{request.operation}' not yet implemented"
        )
    
    return BatchJobResponse(
        job_id=job_id,
        status="queued",
        total_assets=len(request.asset_ids),
        message=f"Batch {request.operation} job submitted successfully"
    )


@router.get("/status/{job_id}", response_model=BatchStatusResponse)
async def get_batch_status(
    job_id: str,
    current_user: User = Depends(get_current_active_user),
) -> BatchStatusResponse:
    """Get status of a batch processing job."""
    if job_id not in _batch_jobs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    job = _batch_jobs[job_id]
    return BatchStatusResponse(
        job_id=job_id,
        status=job["status"],
        processed=job["processed"],
        total=job["total"],
        failed_ids=job["failed_ids"],
    )


@router.get("/jobs", response_model=list[BatchStatusResponse])
async def list_batch_jobs(
    current_user: User = Depends(get_current_active_user),
) -> list[BatchStatusResponse]:
    """List all batch jobs (for current session)."""
    return [
        BatchStatusResponse(
            job_id=job_id,
            status=job["status"],
            processed=job["processed"],
            total=job["total"],
            failed_ids=job["failed_ids"],
        )
        for job_id, job in _batch_jobs.items()
    ]
