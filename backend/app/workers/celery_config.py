"""
Neural Canvas Backend - Celery Worker Configuration
Per Context7 best practices: Redis broker, task routing, retry logic.
"""

from celery import Celery
import os

# Redis configuration from environment
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Create Celery app with Redis broker
celery_app = Celery(
    "neural_canvas",
    broker=REDIS_URL,
    backend=REDIS_URL,  # Use Redis for result backend too
    include=["app.workers.tasks"],  # Auto-discover tasks
)

# Configuration per Context7 best practices
celery_app.conf.update(
    # Serialization
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    
    # Timezone
    timezone="UTC",
    enable_utc=True,
    
    # Task settings
    task_track_started=True,
    task_time_limit=300,  # 5 minute hard limit
    task_soft_time_limit=240,  # 4 minute soft limit
    
    # Retry settings
    task_acks_late=True,  # Ack after task completes (for reliability)
    task_reject_on_worker_lost=True,
    
    # Concurrency
    worker_prefetch_multiplier=1,  # Fetch one task at a time (for heavy tasks)
    worker_concurrency=4,  # 4 concurrent workers
    
    # Result expiration
    result_expires=3600,  # 1 hour
    
    # Task routing
    task_routes={
        "app.workers.tasks.analyze_image": {"queue": "ai"},
        "app.workers.tasks.process_batch": {"queue": "processing"},
        "app.workers.tasks.generate_thumbnail": {"queue": "low"},
    },
)

# Optional: Configure logging
celery_app.conf.worker_hijack_root_logger = False
