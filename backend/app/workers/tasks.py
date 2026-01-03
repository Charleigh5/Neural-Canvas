"""
Neural Canvas Backend - Celery Tasks
Background tasks for image processing, AI analysis, and batch operations.
Per Context7: Proper retry logic, error handling, and progress tracking.
"""

from celery import shared_task
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 3},
    name="app.workers.tasks.analyze_image",
)
def analyze_image(self, asset_id: str, image_url: str):
    """
    Analyze an image with Gemini AI.
    Per Context7: Uses exponential backoff retry.
    
    Args:
        asset_id: Database asset ID
        image_url: URL to the image
    """
    logger.info(f"[TASK] Analyzing image: {asset_id}")
    
    try:
        # Import here to avoid circular imports
        from app.services.image_processor import image_processor
        from app.services.storage_service import storage_service
        import asyncio
        
        # Download image
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        image = loop.run_until_complete(image_processor.download_image(image_url))
        
        # Analyze with Gemini
        analysis = loop.run_until_complete(image_processor.analyze_with_gemini(image))
        loop.close()
        
        logger.info(f"[TASK] Analysis complete for {asset_id}: {len(analysis.get('tags', []))} tags")
        
        return {
            "asset_id": asset_id,
            "status": "completed",
            "tags": analysis.get("tags", []),
            "caption": analysis.get("caption"),
            "mood": analysis.get("mood"),
        }
        
    except Exception as e:
        logger.error(f"[TASK] Analysis failed for {asset_id}: {e}")
        raise  # Re-raise for Celery retry


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 2},
    name="app.workers.tasks.generate_thumbnail",
)
def generate_thumbnail(self, asset_id: str, image_url: str, size: tuple = (300, 300)):
    """
    Generate a thumbnail for an asset.
    
    Args:
        asset_id: Database asset ID
        image_url: URL to the original image
        size: Thumbnail dimensions (width, height)
    """
    logger.info(f"[TASK] Generating thumbnail for: {asset_id}")
    
    try:
        from app.services.image_processor import image_processor
        from app.services.storage_service import storage_service
        import asyncio
        
        # Download image
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        image = loop.run_until_complete(image_processor.download_image(image_url))
        loop.close()
        
        # Create thumbnail
        thumb_bytes = image_processor.create_thumbnail(image, size)
        
        # Upload to S3
        thumb_key = f"thumbnails/{asset_id}.jpg"
        thumb_url = storage_service.upload_image(thumb_bytes, thumb_key)
        
        logger.info(f"[TASK] Thumbnail created for {asset_id}: {thumb_url}")
        
        return {
            "asset_id": asset_id,
            "status": "completed",
            "thumbnail_url": thumb_url,
        }
        
    except Exception as e:
        logger.error(f"[TASK] Thumbnail generation failed for {asset_id}: {e}")
        raise


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 1},
    name="app.workers.tasks.process_batch",
)
def process_batch(self, job_id: str, asset_ids: list, operation: str, params: dict = None):
    """
    Process a batch of assets.
    
    Args:
        job_id: Batch job ID for tracking
        asset_ids: List of asset IDs to process
        operation: Operation type (analyze, filter, resize)
        params: Operation-specific parameters
    """
    logger.info(f"[TASK] Processing batch {job_id}: {len(asset_ids)} assets, op={operation}")
    
    results = {
        "job_id": job_id,
        "processed": 0,
        "failed": 0,
        "failed_ids": [],
    }
    
    for asset_id in asset_ids:
        try:
            if operation == "analyze":
                # Delegate to analyze_image task
                analyze_image.delay(asset_id, params.get("image_url"))
            elif operation == "thumbnail":
                generate_thumbnail.delay(asset_id, params.get("image_url"))
            
            results["processed"] += 1
            
        except Exception as e:
            logger.error(f"[TASK] Batch item failed: {asset_id} - {e}")
            results["failed"] += 1
            results["failed_ids"].append(asset_id)
    
    logger.info(f"[TASK] Batch {job_id} complete: {results['processed']}/{len(asset_ids)}")
    return results


@shared_task(name="app.workers.tasks.cleanup_expired_jobs")
def cleanup_expired_jobs():
    """
    Periodic task to clean up expired batch jobs.
    Schedule via Celery Beat.
    """
    logger.info("[TASK] Cleaning up expired batch jobs")
    # TODO: Implement cleanup logic
    return {"status": "completed", "cleaned": 0}
