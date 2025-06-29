#!/usr/bin/env python3
"""
Minimal Celery test project to isolate serialization issues.
Run this to test if the problem is with the main project or Celery/Redis configuration.
"""

import os
import time
from celery import Celery
from celery.result import AsyncResult

# Celery configuration
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')

# Create Celery app
app = Celery('test_celery_minimal')

# Configure Celery
app.conf.update(
    broker_url=CELERY_BROKER_URL,
    result_backend=CELERY_RESULT_BACKEND,
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Europe/Warsaw',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,
    task_soft_time_limit=25 * 60,
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
    broker_connection_retry_on_startup=True,
    result_expires=3600,
    result_persistent=False,
    task_ignore_result=False,
    task_store_errors_even_if_ignored=True,
    worker_disable_rate_limits=False,
    worker_send_task_events=True,
    task_send_sent_event=True,
    task_remote_tracebacks=True,
    worker_redirect_stdouts=False,
    worker_redirect_stdouts_level='WARNING',
)

@app.task
def test_success_task():
    """Task that returns a successful result."""
    return {"status": "SUCCESS", "message": "Task completed successfully", "data": {"test": True}}

@app.task
def test_exception_task():
    """Task that raises a standard Python exception."""
    raise RuntimeError("Test exception for Celery serialization")

@app.task
def test_custom_exception_task():
    """Task that raises a custom exception (this should fail)."""
    class CustomError(Exception):
        pass
    raise CustomError("Custom exception test")

@app.task
def test_complex_return_task():
    """Task that returns a complex object (this might fail)."""
    from datetime import datetime
    return {
        "status": "SUCCESS",
        "timestamp": datetime.now(),
        "data": {"nested": {"deep": "value"}}
    }

def test_celery_serialization():
    """Test all task types to identify serialization issues."""
    print("🧪 Testing Celery Serialization")
    print("=" * 50)
    
    # Test 1: Success task
    print("\n1. Testing success task...")
    try:
        result = test_success_task.delay()
        time.sleep(2)
        print(f"   Status: {result.status}")
        print(f"   Result: {result.get()}")
        print("   ✅ Success task works")
    except Exception as e:
        print(f"   ❌ Success task failed: {e}")
    
    # Test 2: Standard exception task
    print("\n2. Testing standard exception task...")
    try:
        result = test_exception_task.delay()
        time.sleep(2)
        print(f"   Status: {result.status}")
        try:
            result.get()
        except Exception as e:
            print(f"   Exception caught: {type(e).__name__}: {e}")
        print("   ✅ Standard exception task works")
    except Exception as e:
        print(f"   ❌ Standard exception task failed: {e}")
    
    # Test 3: Custom exception task
    print("\n3. Testing custom exception task...")
    try:
        result = test_custom_exception_task.delay()
        time.sleep(2)
        print(f"   Status: {result.status}")
        try:
            result.get()
        except Exception as e:
            print(f"   Exception caught: {type(e).__name__}: {e}")
        print("   ✅ Custom exception task works")
    except Exception as e:
        print(f"   ❌ Custom exception task failed: {e}")
    
    # Test 4: Complex return task
    print("\n4. Testing complex return task...")
    try:
        result = test_complex_return_task.delay()
        time.sleep(2)
        print(f"   Status: {result.status}")
        print(f"   Result: {result.get()}")
        print("   ✅ Complex return task works")
    except Exception as e:
        print(f"   ❌ Complex return task failed: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 Test completed!")

if __name__ == "__main__":
    test_celery_serialization() 