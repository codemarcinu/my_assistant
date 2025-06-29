"""
Celery Worker Configuration for FoodSave AI
Handles background task processing for receipt analysis and other async operations.
"""

import os
from celery import Celery
from celery.utils.log import get_task_logger

# Configure logging
logger = get_task_logger(__name__)

# Get configuration from environment variables
broker_url = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0")  # Back to Redis
result_backend_url = os.environ.get("CELERY_RESULT_BACKEND_URL", "redis://localhost:6379/0")  # Back to Redis

# Create Celery application
celery_app = Celery(
    "foodsave_worker",
    broker=broker_url,
    backend=result_backend_url,
    include=[
        "src.tasks.receipt_tasks",
        "src.tasks.notification_tasks"
    ]
)

# Celery configuration
celery_app.conf.update(
    task_serializer="pickle",
    accept_content=["pickle", "json"],
    result_serializer="pickle",
    timezone="Europe/Warsaw",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
    worker_concurrency=2,
    task_always_eager=False,  # Set to True for testing
    task_eager_propagates=True,
    result_expires=3600,  # 1 hour
    result_persistent=False,  # Changed from True to False to prevent serialization issues
    task_ignore_result=False,
    task_store_errors_even_if_ignored=True,
    # Fix for Redis result backend issues
    result_backend_transport_options={
        'retry_on_timeout': True,
        'max_connections': 20,
    },
    # Additional settings for better exception handling
    task_remote_tracebacks=True,
    worker_redirect_stdouts=False,
    worker_redirect_stdouts_level='WARNING',
    task_annotations={
        "src.tasks.receipt_tasks.process_receipt_task": {
            "rate_limit": "10/m",  # Max 10 tasks per minute
            "max_retries": 3,
            "default_retry_delay": 60,  # 1 minute
        }
    }
)

# Task routing (optional - for more complex setups)
celery_app.conf.task_routes = {
    "src.tasks.receipt_tasks.*": {"queue": "receipts"},
    "src.tasks.notification_tasks.*": {"queue": "notifications"},
}

# Default queue
celery_app.conf.task_default_queue = "default"

# Queue definitions
celery_app.conf.task_queues = {
    "default": {
        "exchange": "default",
        "routing_key": "default",
    },
    "receipts": {
        "exchange": "receipts",
        "routing_key": "receipts",
    },
    "notifications": {
        "exchange": "notifications", 
        "routing_key": "notifications",
    },
}

if __name__ == "__main__":
    celery_app.start() 