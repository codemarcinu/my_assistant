"""
Receipt processing tasks for FoodSave AI
Handles asynchronous OCR and analysis of receipt images.
"""

import os
import time
import shutil
import asyncio
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime

from celery import current_task
from celery.utils.log import get_task_logger

from src.worker import celery_app
from backend.agents.ocr_agent import OCRAgent, OCRAgentInput
from backend.agents.receipt_analysis_agent import ReceiptAnalysisAgent
from backend.core.exceptions import FoodSaveError

logger = get_task_logger(__name__)

# Configuration
UPLOAD_DIR = Path("/app/temp_uploads")
UPLOAD_DIR.mkdir(exist_ok=True, parents=True)

# Cleanup old files (older than 24 hours)
CLEANUP_THRESHOLD = 24 * 60 * 60  # 24 hours in seconds


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def process_receipt_task(self, file_path: str, original_filename: str, user_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Asynchroniczne zadanie przetwarzania paragonu.
    
    Args:
        file_path: Ścieżka do zapisanego pliku
        original_filename: Oryginalna nazwa pliku
        user_id: ID użytkownika (opcjonalne)
    
    Returns:
        Dict zawierający wyniki przetwarzania
    """
    task_id = self.request.id
    logger.info(f"Rozpoczynam przetwarzanie paragonu: {original_filename} (Task ID: {task_id})")
    
    try:
        # Step 1: Update task state to PROCESSING
        self.update_state(
            state='PROGRESS',
            meta={
                'step': 'Initializing',
                'progress': 5,
                'message': 'Inicjalizacja przetwarzania paragonu',
                'filename': original_filename
            }
        )
        
        # Step 2: Validate file exists
        file_path_obj = Path(file_path)
        if not file_path_obj.exists():
            raise FileNotFoundError(f"Plik nie został znaleziony: {file_path}")
        
        # Step 3: Pre-processing validation
        self.update_state(
            state='PROGRESS',
            meta={
                'step': 'Validation',
                'progress': 10,
                'message': 'Walidacja pliku',
                'filename': original_filename
            }
        )
        
        # Check file size
        file_size = file_path_obj.stat().st_size
        if file_size > 10 * 1024 * 1024:  # 10MB limit
            raise ValueError(f"Plik jest zbyt duży: {file_size / (1024*1024):.2f}MB")
        
        # Step 4: OCR Processing
        self.update_state(
            state='PROGRESS',
            meta={
                'step': 'OCR',
                'progress': 25,
                'message': 'Przetwarzanie OCR',
                'filename': original_filename
            }
        )
        
        # Read file and determine type
        with open(file_path, 'rb') as f:
            file_bytes = f.read()
        
        # Determine file type based on extension
        file_extension = file_path_obj.suffix.lower()
        if file_extension in ['.jpg', '.jpeg', '.png', '.webp']:
            file_type = "image"
        elif file_extension == '.pdf':
            file_type = "pdf"
        else:
            raise ValueError(f"Nieobsługiwany typ pliku: {file_extension}")
        
        # Process with OCR Agent
        try:
            ocr_agent = OCRAgent()
            ocr_input = OCRAgentInput(file_bytes=file_bytes, file_type=file_type)
            ocr_result = asyncio.run(ocr_agent.process(ocr_input))
        except FoodSaveError as e:
            # Convert custom exception to standard exception for Celery serialization
            raise RuntimeError(f"OCR processing failed: {str(e)}")
        
        if not ocr_result.success:
            raise RuntimeError(f"Błąd OCR: {ocr_result.error}")
        
        # Step 5: OCR Quality Check
        self.update_state(
            state='PROGRESS',
            meta={
                'step': 'OCR Quality Check',
                'progress': 40,
                'message': 'Sprawdzanie jakości OCR',
                'filename': original_filename
            }
        )
        
        # Basic quality check - ensure we have some meaningful text
        ocr_text = ocr_result.text.strip()
        if len(ocr_text) < 10:
            raise ValueError("Wynik OCR jest zbyt krótki - prawdopodobnie błąd rozpoznawania")
        
        # Check for receipt keywords
        receipt_keywords = ['PLN', 'SUMA', 'PARAGON', 'RACHUNEK', 'SKLEP', 'SKLEP:', 'TOTAL', 'SUBTOTAL']
        has_receipt_keywords = any(keyword.lower() in ocr_text.lower() for keyword in receipt_keywords)
        
        if not has_receipt_keywords:
            logger.warning(f"Brak słów kluczowych paragonu w tekście OCR: {original_filename}")
        
        # Step 6: AI Analysis
        self.update_state(
            state='PROGRESS',
            meta={
                'step': 'AI Analysis',
                'progress': 60,
                'message': 'Analiza AI',
                'filename': original_filename
            }
        )
        
        # Process with Receipt Analysis Agent
        try:
            analysis_agent = ReceiptAnalysisAgent()
            analysis_result = asyncio.run(analysis_agent.process({"ocr_text": ocr_text}))
        except FoodSaveError as e:
            # Convert custom exception to standard exception for Celery serialization
            raise RuntimeError(f"Receipt analysis failed: {str(e)}")
        
        if not analysis_result.success:
            raise RuntimeError(f"Błąd analizy AI: {analysis_result.error}")
        
        # Step 7: Data Validation
        self.update_state(
            state='PROGRESS',
            meta={
                'step': 'Validation',
                'progress': 80,
                'message': 'Walidacja danych',
                'filename': original_filename
            }
        )
        
        # Validate extracted data
        analysis_data = analysis_result.data
        if not analysis_data:
            raise ValueError("Brak danych w wyniku analizy")
        
        # Step 8: Save to Database (if user_id provided)
        self.update_state(
            state='PROGRESS',
            meta={
                'step': 'Saving',
                'progress': 90,
                'message': 'Zapisywanie do bazy danych',
                'filename': original_filename
            }
        )
        
        # TODO: Implement database saving logic here
        # For now, we'll just prepare the data structure
        
        # Step 9: Cleanup temporary file
        try:
            os.remove(file_path)
            logger.info(f"Usunięto plik tymczasowy: {file_path}")
        except Exception as e:
            logger.warning(f"Nie udało się usunąć pliku tymczasowego {file_path}: {e}")
        
        # Step 10: Final result
        result = {
            "status": "SUCCESS",
            "task_id": task_id,
            "filename": original_filename,
            "processing_time": datetime.now().isoformat(),
            "ocr_text": ocr_text,
            "analysis": analysis_data,
            "metadata": {
                "file_size": file_size,
                "file_type": file_type,
                "ocr_confidence": getattr(ocr_result, 'confidence', None),
                "has_receipt_keywords": has_receipt_keywords,
                "user_id": user_id
            }
        }
        
        logger.info(f"Pomyślnie przetworzono paragon: {original_filename} (Task ID: {task_id})")
        
        return result
        
    except Exception as e:
        logger.error(f"Błąd podczas przetwarzania paragonu {original_filename}: {str(e)}")
        
        # Update task state to FAILURE
        self.update_state(
            state='FAILURE',
            meta={
                'error': str(e),
                'filename': original_filename,
                'task_id': task_id
            }
        )
        
        # Retry logic for transient errors
        if self.request.retries < self.max_retries:
            logger.info(f"Ponawiam próbę {self.request.retries + 1}/{self.max_retries} dla {original_filename}")
            # Pass only string, not the exception object, to exc for Celery JSON serialization
            raise self.retry(exc=str(e), countdown=self.default_retry_delay)
        
        # If max retries reached, return error result
        return {
            "status": "FAILURE",
            "task_id": task_id,
            "filename": original_filename,
            "error": str(e),
            "retries": self.request.retries
        }


@celery_app.task
def cleanup_temp_files():
    """
    Zadanie czyszczenia starych plików tymczasowych.
    """
    logger.info("Rozpoczynam czyszczenie starych plików tymczasowych")
    
    try:
        current_time = time.time()
        deleted_count = 0
        
        for file_path in UPLOAD_DIR.glob("*"):
            if file_path.is_file():
                file_age = current_time - file_path.stat().st_mtime
                
                if file_age > CLEANUP_THRESHOLD:
                    try:
                        file_path.unlink()
                        deleted_count += 1
                        logger.debug(f"Usunięto stary plik: {file_path}")
                    except Exception as e:
                        logger.warning(f"Nie udało się usunąć pliku {file_path}: {e}")
        
        logger.info(f"Zakończono czyszczenie. Usunięto {deleted_count} plików.")
        return {"deleted_count": deleted_count, "status": "SUCCESS"}
        
    except Exception as e:
        logger.error(f"Błąd podczas czyszczenia plików: {e}")
        return {"error": str(e), "status": "FAILURE"}


@celery_app.task
def health_check():
    """
    Zadanie sprawdzania stanu workera.
    """
    return {
        "status": "HEALTHY",
        "timestamp": datetime.now().isoformat(),
        "worker_id": os.environ.get("CELERY_WORKER_ID", "unknown")
    }


@celery_app.task
def test_exception_serialization_task():
    """Minimal task to test Celery exception serialization."""
    raise RuntimeError("Test exception for Celery serialization.") 