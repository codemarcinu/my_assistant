"""
Receipt processing API v3 - Asynchronous
Handles background processing of receipt images with Celery tasks.
"""

import shutil
import uuid
import os
from pathlib import Path
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, UploadFile, File, HTTPException, status, Query
from fastapi.responses import JSONResponse
from celery.result import AsyncResult

from src.tasks.receipt_tasks import process_receipt_task
from src.worker import celery_app

router = APIRouter()

# Configuration
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./temp_uploads"))
UPLOAD_DIR.mkdir(exist_ok=True, parents=True)

# Allowed file types
ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
ALLOWED_PDF_TYPES = ["application/pdf"]
ALLOWED_FILE_TYPES = ALLOWED_IMAGE_TYPES + ALLOWED_PDF_TYPES


@router.post("/receipts/process", status_code=status.HTTP_202_ACCEPTED)
async def process_receipt(
    file: UploadFile = File(...),
    user_id: Optional[str] = Query(None, description="User ID for notifications")
):
    """
    Przyjmuje plik paragonu, zapisuje go i tworzy zadanie w tle.
    Zwraca natychmiast ID zadania.
    
    Args:
        file: Plik obrazu paragonu
        user_id: ID użytkownika (opcjonalne)
    
    Returns:
        JSONResponse z job_id zadania
    """
    try:
        # Validate file content type
        if not file.content_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "status_code": 400,
                    "error_code": "BAD_REQUEST",
                    "message": "Missing content type header",
                    "details": {
                        "field": "file",
                        "error": "Content-Type header is required",
                    },
                },
            )

        # Check if file type is allowed
        if file.content_type not in ALLOWED_FILE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "status_code": 400,
                    "error_code": "BAD_REQUEST",
                    "message": "Unsupported file type",
                    "details": {
                        "content_type": file.content_type,
                        "supported_types": ALLOWED_FILE_TYPES,
                    },
                },
            )

        # Read file content
        file_bytes = await file.read()

        # Check file size (max 10MB)
        if len(file_bytes) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail={
                    "status_code": 413,
                    "error_code": "FILE_TOO_LARGE",
                    "message": "File too large",
                    "details": {
                        "max_size_mb": 10,
                        "actual_size_mb": len(file_bytes) / (1024 * 1024),
                    },
                },
            )

        # Generate unique filename
        file_extension = Path(file.filename).suffix if file.filename else ".jpg"
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        saved_path = UPLOAD_DIR / unique_filename

        # Save file to temporary location
        with saved_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Create Celery task
        task = process_receipt_task.delay(
            file_path=str(saved_path),
            original_filename=file.filename or "unknown",
            user_id=user_id
        )

        return JSONResponse(
            status_code=status.HTTP_202_ACCEPTED,
            content={
                "status_code": 202,
                "message": "Receipt processing started",
                "data": {
                    "job_id": task.id,
                    "filename": file.filename,
                    "file_size": len(file_bytes),
                    "submitted_at": datetime.now().isoformat(),
                    "status": "PENDING"
                }
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status_code": 500,
                "error_code": "INTERNAL_SERVER_ERROR",
                "message": "Unexpected error starting receipt processing",
                "details": {"error": str(e)},
            },
        )


@router.get("/receipts/status/{job_id}")
async def get_receipt_status(job_id: str):
    """
    Zwraca status zadania przetwarzania paragonu.
    
    Args:
        job_id: ID zadania Celery
    
    Returns:
        JSONResponse ze statusem zadania
    """
    try:
        task_result = AsyncResult(job_id, app=celery_app)
        
        # Handle potential serialization errors from Celery
        try:
            task_status = task_result.status
        except (ValueError, KeyError) as e:
            # Handle Celery serialization errors
            if "Exception information must include the exception type" in str(e):
                return JSONResponse(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    content={
                        "status_code": 500,
                        "error_code": "SERIALIZATION_ERROR",
                        "message": "Task status corrupted - serialization error detected",
                        "details": {
                            "error": "Celery task result contains improperly serialized exception data",
                            "job_id": job_id,
                            "suggestion": "Task may have failed due to custom exception serialization issues"
                        },
                    },
                )
            else:
                raise e
        
        response_data = {
            "job_id": job_id,
            "status": task_status,
            "timestamp": datetime.now().isoformat()
        }
        
        # Add additional data based on status
        if task_status == "PENDING":
            response_data["message"] = "Task is waiting for execution"
        elif task_status == "STARTED":
            response_data["message"] = "Task has been started"
        elif task_status == "PROGRESS":
            # Include progress information
            if task_result.info:
                response_data.update(task_result.info)
        elif task_status == "SUCCESS":
            response_data["message"] = "Task completed successfully"
            if task_result.result:
                response_data["result"] = task_result.result
        elif task_status == "FAILURE":
            response_data["message"] = "Task failed"
            if task_result.info:
                response_data["error"] = task_result.info
        elif task_status == "RETRY":
            response_data["message"] = "Task is being retried"
            if task_result.info:
                response_data["retry_info"] = task_result.info
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status_code": 200,
                "message": "Task status retrieved successfully",
                "data": response_data
            }
        )
        
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status_code": 500,
                "error_code": "INTERNAL_SERVER_ERROR",
                "message": "Error retrieving task status",
                "details": {"error": str(e)},
            },
        )


@router.delete("/receipts/cancel/{job_id}")
async def cancel_receipt_processing(job_id: str):
    """
    Anuluje zadanie przetwarzania paragonu.
    
    Args:
        job_id: ID zadania Celery
    
    Returns:
        JSONResponse z wynikiem anulowania
    """
    try:
        celery_app.control.revoke(job_id, terminate=True)
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status_code": 200,
                "message": "Task cancellation requested",
                "data": {
                    "job_id": job_id,
                    "cancelled_at": datetime.now().isoformat()
                }
            }
        )
        
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status_code": 500,
                "error_code": "INTERNAL_SERVER_ERROR",
                "message": "Error cancelling task",
                "details": {"error": str(e)},
            },
        )


@router.get("/receipts/health")
async def receipt_processing_health():
    """
    Sprawdza stan systemu przetwarzania paragonów.
    
    Returns:
        JSONResponse ze statusem systemu
    """
    try:
        # Check Celery worker status
        inspect = celery_app.control.inspect()
        active_tasks = inspect.active()
        registered_tasks = inspect.registered()
        
        # Count active receipt processing tasks
        receipt_tasks_count = 0
        if active_tasks:
            for worker_tasks in active_tasks.values():
                for task in worker_tasks:
                    if task.get('name') == 'src.tasks.receipt_tasks.process_receipt_task':
                        receipt_tasks_count += 1
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status_code": 200,
                "message": "Receipt processing system health check",
                "data": {
                    "status": "healthy",
                    "timestamp": datetime.now().isoformat(),
                    "active_receipt_tasks": receipt_tasks_count,
                    "workers_available": bool(active_tasks),
                    "tasks_registered": bool(registered_tasks)
                }
            }
        )
        
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status_code": 503,
                "error_code": "SERVICE_UNAVAILABLE",
                "message": "Receipt processing system unavailable",
                "details": {"error": str(e)},
            },
        ) 