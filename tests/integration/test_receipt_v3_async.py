"""
Integration tests for Receipt API v3 - Asynchronous Processing
Tests the new async receipt processing endpoints with Celery tasks.
"""

import pytest
import asyncio
from unittest.mock import patch, MagicMock
from io import BytesIO
from pathlib import Path

from fastapi.testclient import TestClient
from celery.result import AsyncResult

from src.worker import celery_app


class TestReceiptV3Async:
    """Test suite for Receipt API v3 async processing."""

    @pytest.fixture
    def sample_image_bytes(self):
        """Sample image bytes for testing."""
        return b"fake_image_data_for_testing"

    @pytest.fixture
    def mock_celery_task(self):
        """Mock Celery task result."""
        mock_task = MagicMock()
        mock_task.id = "test-task-id-123"
        return mock_task

    @pytest.fixture
    def mock_async_result(self):
        """Mock AsyncResult for task status checking."""
        mock_result = MagicMock(spec=AsyncResult)
        mock_result.status = "PENDING"
        mock_result.info = None
        return mock_result

    def test_process_receipt_async_success(self, client, sample_image_bytes, mock_celery_task):
        """Test successful async receipt processing."""
        with patch('src.api.v3.receipts.process_receipt_task.delay', return_value=mock_celery_task):
            files = {"file": ("receipt.jpg", sample_image_bytes, "image/jpeg")}
            response = client.post("/api/v3/receipts/process", files=files)

            assert response.status_code == 202
            data = response.json()
            
            assert data["status_code"] == 202
            assert data["message"] == "Receipt processing started"
            assert data["data"]["job_id"] == "test-task-id-123"
            assert data["data"]["status"] == "PENDING"
            assert data["data"]["filename"] == "receipt.jpg"
            assert "file_size" in data["data"]
            assert "submitted_at" in data["data"]

    def test_process_receipt_async_with_user_id(self, client, sample_image_bytes, mock_celery_task):
        """Test async receipt processing with user ID."""
        with patch('src.api.v3.receipts.process_receipt_task.delay', return_value=mock_celery_task):
            files = {"file": ("receipt.jpg", sample_image_bytes, "image/jpeg")}
            response = client.post("/api/v3/receipts/process?user_id=test_user_123", files=files)

            assert response.status_code == 202
            data = response.json()
            assert data["data"]["job_id"] == "test-task-id-123"

    def test_process_receipt_async_invalid_file_type(self, client):
        """Test async receipt processing with invalid file type."""
        files = {"file": ("receipt.txt", b"text data", "text/plain")}
        response = client.post("/api/v3/receipts/process", files=files)

        assert response.status_code == 400
        data = response.json()
        assert data["error_code"] == "BAD_REQUEST"
        assert "Unsupported file type" in data["message"]

    def test_process_receipt_async_missing_content_type(self, client, sample_image_bytes):
        """Test async receipt processing with missing content type."""
        files = {"file": ("receipt.jpg", sample_image_bytes, None)}
        response = client.post("/api/v3/receipts/process", files=files)

        assert response.status_code == 400
        data = response.json()
        assert data["error_code"] == "BAD_REQUEST"
        assert "Missing content type header" in data["message"]

    def test_process_receipt_async_file_too_large(self, client):
        """Test async receipt processing with file too large."""
        # Create a file larger than 10MB
        large_file = b"x" * (11 * 1024 * 1024)  # 11MB
        files = {"file": ("receipt.jpg", large_file, "image/jpeg")}
        response = client.post("/api/v3/receipts/process", files=files)

        assert response.status_code == 413
        data = response.json()
        assert data["error_code"] == "FILE_TOO_LARGE"
        assert "File too large" in data["message"]

    def test_get_receipt_status_pending(self, client, mock_async_result):
        """Test getting status of pending task."""
        with patch('src.api.v3.receipts.AsyncResult', return_value=mock_async_result):
            response = client.get("/api/v3/receipts/status/test-task-id-123")

            assert response.status_code == 200
            data = response.json()
            assert data["status_code"] == 200
            assert data["data"]["job_id"] == "test-task-id-123"
            assert data["data"]["status"] == "PENDING"
            assert data["data"]["message"] == "Task is waiting for execution"

    def test_get_receipt_status_progress(self, client):
        """Test getting status of task in progress."""
        mock_result = MagicMock(spec=AsyncResult)
        mock_result.status = "PROGRESS"
        mock_result.info = {
            "step": "OCR",
            "progress": 25,
            "message": "Przetwarzanie OCR",
            "filename": "receipt.jpg"
        }

        with patch('src.api.v3.receipts.AsyncResult', return_value=mock_result):
            response = client.get("/api/v3/receipts/status/test-task-id-123")

            assert response.status_code == 200
            data = response.json()
            assert data["data"]["status"] == "PROGRESS"
            assert data["data"]["step"] == "OCR"
            assert data["data"]["progress"] == 25

    def test_get_receipt_status_success(self, client):
        """Test getting status of completed task."""
        mock_result = MagicMock(spec=AsyncResult)
        mock_result.status = "SUCCESS"
        mock_result.result = {
            "status": "SUCCESS",
            "filename": "receipt.jpg",
            "ocr_text": "Sample receipt text",
            "analysis": {"store_name": "Test Store", "total_amount": 25.50}
        }

        with patch('src.api.v3.receipts.AsyncResult', return_value=mock_result):
            response = client.get("/api/v3/receipts/status/test-task-id-123")

            assert response.status_code == 200
            data = response.json()
            assert data["data"]["status"] == "SUCCESS"
            assert data["data"]["message"] == "Task completed successfully"
            assert "result" in data["data"]

    def test_get_receipt_status_failure(self, client):
        """Test getting status of failed task."""
        mock_result = MagicMock(spec=AsyncResult)
        mock_result.status = "FAILURE"
        mock_result.info = {"error": "OCR processing failed"}

        with patch('src.api.v3.receipts.AsyncResult', return_value=mock_result):
            response = client.get("/api/v3/receipts/status/test-task-id-123")

            assert response.status_code == 200
            data = response.json()
            assert data["data"]["status"] == "FAILURE"
            assert data["data"]["message"] == "Task failed"
            assert "error" in data["data"]

    def test_cancel_receipt_processing(self, client):
        """Test cancelling receipt processing task."""
        with patch('src.api.v3.receipts.celery_app.control.revoke') as mock_revoke:
            response = client.delete("/api/v3/receipts/cancel/test-task-id-123")

            assert response.status_code == 200
            data = response.json()
            assert data["status_code"] == 200
            assert data["message"] == "Task cancellation requested"
            assert data["data"]["job_id"] == "test-task-id-123"
            
            mock_revoke.assert_called_once_with("test-task-id-123", terminate=True)

    def test_receipt_processing_health(self, client):
        """Test receipt processing system health check."""
        mock_inspect = MagicMock()
        mock_inspect.active.return_value = {
            "worker1": [
                {"name": "src.tasks.receipt_tasks.process_receipt_task", "id": "task1"},
                {"name": "other.task", "id": "task2"}
            ]
        }
        mock_inspect.registered.return_value = {
            "worker1": ["src.tasks.receipt_tasks.process_receipt_task", "other.task"]
        }

        with patch('src.api.v3.receipts.celery_app.control.inspect', return_value=mock_inspect):
            response = client.get("/api/v3/receipts/health")

            assert response.status_code == 200
            data = response.json()
            assert data["status_code"] == 200
            assert data["data"]["status"] == "healthy"
            assert data["data"]["active_receipt_tasks"] == 1
            assert data["data"]["workers_available"] is True
            assert data["data"]["tasks_registered"] is True

    def test_receipt_processing_health_no_workers(self, client):
        """Test health check when no workers are available."""
        mock_inspect = MagicMock()
        mock_inspect.active.return_value = None
        mock_inspect.registered.return_value = None

        with patch('src.api.v3.receipts.celery_app.control.inspect', return_value=mock_inspect):
            response = client.get("/api/v3/receipts/health")

            assert response.status_code == 200
            data = response.json()
            assert data["data"]["workers_available"] is False
            assert data["data"]["tasks_registered"] is False

    @pytest.mark.asyncio
    async def test_celery_task_process_receipt_success(self):
        """Test the actual Celery task processing."""
        # This test would require a more complex setup with actual Celery worker
        # For now, we'll test the task function directly
        from src.tasks.receipt_tasks import process_receipt_task
        
        # Mock the file operations and agent calls
        with patch('builtins.open', create=True), \
             patch('os.remove'), \
             patch('src.tasks.receipt_tasks.OCRAgent') as mock_ocr_agent, \
             patch('src.tasks.receipt_tasks.ReceiptAnalysisAgent') as mock_analysis_agent:
            
            # Mock OCR agent
            mock_ocr_instance = MagicMock()
            mock_ocr_result = MagicMock()
            mock_ocr_result.success = True
            mock_ocr_result.text = "Sample receipt text from OCR"
            mock_ocr_instance.process.return_value = mock_ocr_result
            mock_ocr_agent.return_value = mock_ocr_instance
            
            # Mock analysis agent
            mock_analysis_instance = MagicMock()
            mock_analysis_result = MagicMock()
            mock_analysis_result.success = True
            mock_analysis_result.data = {
                "store_name": "Test Store",
                "total_amount": 25.50,
                "items": [{"name": "Milk", "price": 5.50}]
            }
            mock_analysis_instance.process.return_value = mock_analysis_result
            mock_analysis_agent.return_value = mock_analysis_instance
            
            # Mock file operations
            with patch('pathlib.Path.exists', return_value=True), \
                 patch('pathlib.Path.stat') as mock_stat:
                mock_stat.return_value.st_size = 1024  # 1KB file
                
                # Call the task function
                result = process_receipt_task.apply(
                    args=["/tmp/test_file.jpg", "test_receipt.jpg", "test_user"]
                ).get()
                
                # Verify the result
                assert result["status"] == "SUCCESS"
                assert result["filename"] == "test_receipt.jpg"
                assert "ocr_text" in result
                assert "analysis" in result 