from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, Query
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import hashlib
import asyncio
from datetime import datetime, timedelta

from backend.agents.ocr_agent import OCRAgent, OCRAgentInput
from backend.agents.receipt_analysis_agent import ReceiptAnalysisAgent
from backend.api.v2.exceptions import APIErrorCodes, UnprocessableEntityError
from backend.core.database import get_db
from backend.schemas import shopping_schemas
from backend.services.shopping_service import create_shopping_trip

router = APIRouter(prefix="/receipts", tags=["Receipts"])

# Lista dozwolonych typów plików
ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
ALLOWED_PDF_TYPES = ["application/pdf"]
ALLOWED_FILE_TYPES = ALLOWED_IMAGE_TYPES + ALLOWED_PDF_TYPES


@router.post("/upload", response_model=None)
async def upload_receipt(file: UploadFile = File(...)):
    """Endpoint for uploading and processing receipt images with enhanced OCR.

    Returns:
        JSONResponse: Standardized success or error response
    """
    try:
        # Validate file content type
        if not file.content_type:
            raise HTTPException(
                status_code=400,
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

        # Sprawdzenie czy typ pliku jest dozwolony
        if file.content_type not in ALLOWED_FILE_TYPES:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Unsupported file type",
                    "details": {
                        "content_type": file.content_type,
                        "supported_types": ALLOWED_FILE_TYPES,
                    },
                },
            )

        # Określenie typu pliku dla OCR
        if file.content_type in ALLOWED_IMAGE_TYPES:
            file_type = "image"
        elif file.content_type in ALLOWED_PDF_TYPES:
            file_type = "pdf"
        else:
            # Ten kod nie powinien się wykonać ze względu na wcześniejszą walidację,
            # ale dodajemy go dla pewności
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Unsupported file type",
                    "details": {
                        "content_type": file.content_type,
                        "supported_types": ALLOWED_FILE_TYPES,
                    },
                },
            )

        # Read and process file with enhanced OCR
        file_bytes = await file.read()

        # Sprawdź rozmiar pliku (maksymalnie 10MB)
        if len(file_bytes) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "File too large",
                    "details": {
                        "max_size_mb": 10,
                        "actual_size_mb": len(file_bytes) / (1024 * 1024),
                    },
                },
            )

        agent = OCRAgent()
        input_data = OCRAgentInput(file_bytes=file_bytes, file_type=file_type)
        result = await agent.process(input_data)

        if not result.success:
            raise HTTPException(
                status_code=422,
                detail={
                    "message": "Failed to process receipt",
                    "details": {
                        "error": result.error,
                        "error_code": "RECEIPT_PROCESSING_ERROR",
                    },
                },
            )

        return JSONResponse(
            status_code=200,
            content={
                "status_code": 200,
                "message": "Receipt processed successfully",
                "data": {
                    "text": result.text,
                    "message": result.message,
                    "metadata": result.metadata,
                },
            },
        )

    except HTTPException as he:
        # Re-raise HTTPException to preserve the status code and detail
        raise he
    except Exception as e:
        # For other exceptions, return a 500 error with standardized format
        return JSONResponse(
            status_code=500,
            content={
                "status_code": 500,
                "error_code": "INTERNAL_SERVER_ERROR",
                "message": "Unexpected error processing receipt",
                "details": {"error": str(e)},
            },
        )


@router.post("/analyze", response_model=None)
async def analyze_receipt(ocr_text: str = Form(...)):
    """Analyze OCR text from receipt and extract structured data with enhanced parsing.

    Returns:
        JSONResponse: Structured receipt data
    """
    try:
        # Validate OCR text
        if not ocr_text or not ocr_text.strip():
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "OCR text is required and cannot be empty",
                    "error_code": "BAD_REQUEST",
                },
            )

        # Process OCR text with enhanced ReceiptAnalysisAgent
        analysis_agent = ReceiptAnalysisAgent()
        analysis_result = await analysis_agent.process({"ocr_text": ocr_text})

        if not analysis_result.success:
            raise UnprocessableEntityError(
                message="Failed to analyze receipt data",
                details={
                    "error": analysis_result.error,
                    "error_code": APIErrorCodes.RECEIPT_ANALYSIS_ERROR,
                },
            )

        # Return structured receipt data
        return JSONResponse(
            status_code=200,
            content={
                "status_code": 200,
                "message": "Receipt analyzed successfully",
                "data": analysis_result.data,
            },
        )

    except HTTPException as he:
        raise he
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status_code": 500,
                "error_code": "INTERNAL_SERVER_ERROR",
                "message": "Unexpected error analyzing receipt",
                "details": {"error": str(e)},
            },
        )


@router.post("/process", response_model=None)
async def process_receipt_complete(file: UploadFile = File(...)):
    """Complete receipt processing workflow: OCR + Analysis in one endpoint with optimizations.

    Returns:
        JSONResponse: Complete structured receipt data
    """
    # Cache dla wyników analizy paragonów (w pamięci)
    _receipt_cache = {}
    _cache_ttl = 3600  # 1 godzina
    
    try:
        # Validate file content type
        if not file.content_type:
            raise HTTPException(
                status_code=400,
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

        # Sprawdzenie czy typ pliku jest dozwolony
        if file.content_type not in ALLOWED_FILE_TYPES:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Unsupported file type",
                    "details": {
                        "content_type": file.content_type,
                        "supported_types": ALLOWED_FILE_TYPES,
                    },
                },
            )

        # Read file content
        file_bytes = await file.read()

        # Sprawdź rozmiar pliku (maksymalnie 10MB)
        if len(file_bytes) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "File too large",
                    "details": {
                        "max_size_mb": 10,
                        "actual_size_mb": len(file_bytes) / (1024 * 1024),
                    },
                },
            )

        # Generuj hash pliku dla cache
        file_hash = hashlib.md5(file_bytes).hexdigest()
        
        # Sprawdź cache
        if file_hash in _receipt_cache:
            cache_entry = _receipt_cache[file_hash]
            if datetime.now() - cache_entry["timestamp"] < timedelta(seconds=_cache_ttl):
                return JSONResponse(
                    status_code=200,
                    content={
                        "status_code": 200,
                        "message": "Receipt processed successfully (cached)",
                        "data": cache_entry["data"],
                        "cached": True,
                    },
                )

        # Określenie typu pliku dla OCR
        if file.content_type in ALLOWED_IMAGE_TYPES:
            file_type = "image"
        elif file.content_type in ALLOWED_PDF_TYPES:
            file_type = "pdf"
        else:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Unsupported file type",
                    "details": {
                        "content_type": file.content_type,
                        "supported_types": ALLOWED_FILE_TYPES,
                    },
                },
            )

        # OCR Processing z timeout
        try:
            ocr_agent = OCRAgent()
            input_data = OCRAgentInput(file_bytes=file_bytes, file_type=file_type)
            # Timeout dla OCR: 90 sekund
            ocr_result = await asyncio.wait_for(
                ocr_agent.process(input_data),
                timeout=90.0
            )
            if not ocr_result.success:
                raise HTTPException(
                    status_code=422,
                    detail={
                        "message": "Failed to extract text from receipt",
                        "details": {
                            "error": ocr_result.error,
                            "error_code": "OCR_PROCESSING_ERROR",
                        },
                    },
                )
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=408,
                detail={
                    "message": "OCR processing timeout",
                    "details": {
                        "error": "OCR processing took too long",
                        "error_code": "OCR_TIMEOUT",
                    },
                },
            )

        # Receipt Analysis z timeout
        try:
            analysis_agent = ReceiptAnalysisAgent()
            # Timeout dla analizy: 60 sekund
            analysis_result = await asyncio.wait_for(
                analysis_agent.process({"ocr_text": ocr_result.text}),
                timeout=60.0
            )
            if not analysis_result.success:
                raise HTTPException(
                    status_code=422,
                    detail={
                        "message": "Failed to analyze receipt data",
                        "details": {
                            "error": analysis_result.error,
                            "error_code": "RECEIPT_ANALYSIS_ERROR",
                        },
                    },
                )
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=408,
                detail={
                    "message": "Receipt analysis timeout",
                    "details": {
                        "error": "Receipt analysis took too long",
                        "error_code": "ANALYSIS_TIMEOUT",
                    },
                },
            )

        # Przygotuj kompletny wynik
        complete_result = {
            "ocr_text": ocr_result.text,
            "analysis": analysis_result.data,
            "metadata": {
                "processing_time": datetime.now().isoformat(),
                "file_size": len(file_bytes),
                "file_type": file_type,
                "cached": False,
            },
        }

        # Zapisz w cache
        _receipt_cache[file_hash] = {
            "data": complete_result,
            "timestamp": datetime.now(),
        }

        # Wyczyść stary cache (zachowaj tylko ostatnie 100 wpisów)
        if len(_receipt_cache) > 100:
            # Usuń najstarsze wpisy
            sorted_cache = sorted(_receipt_cache.items(), key=lambda x: x[1]["timestamp"])
            for key, _ in sorted_cache[:-100]:
                del _receipt_cache[key]

        return JSONResponse(
            status_code=200,
            content={
                "status_code": 200,
                "message": "Receipt processed successfully",
                "data": complete_result,
            },
        )

    except HTTPException as he:
        raise he
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status_code": 500,
                "error_code": "INTERNAL_SERVER_ERROR",
                "message": "Unexpected error processing receipt",
                "details": {"error": str(e)},
            },
        )


@router.post("/save", response_model=None)
async def save_receipt_data(
    receipt_data: shopping_schemas.ShoppingTripCreate,
    db: AsyncSession = Depends(get_db),
):
    """Save analyzed receipt data to database.

    Returns:
        JSONResponse: Result of saving receipt data
    """
    try:
        # Create shopping trip with products in database
        created_trip = await create_shopping_trip(db, receipt_data)

        # Return success response with created trip ID
        return JSONResponse(
            status_code=200,
            content={
                "status_code": 200,
                "message": "Receipt data saved successfully",
                "data": {
                    "trip_id": created_trip.id,
                    "products_count": len(created_trip.products),
                },
            },
        )

    except HTTPException as he:
        raise he
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status_code": 500,
                "error_code": "INTERNAL_SERVER_ERROR",
                "message": "Unexpected error saving receipt data",
                "details": {"error": str(e)},
            },
        )


@router.get("", response_model=dict)
async def list_receipts():
    """Stub: Zwraca przykładową listę paragonów zgodną ze schematem kontraktowym"""
    receipts_data = [
        {"id": "1", "filename": "receipt1.jpg", "upload_date": "2024-06-25", "status": "processed"},
        {"id": "2", "filename": "receipt2.jpg", "upload_date": "2024-06-24", "status": "processed"}
    ]
    
    return {
        "receipts": receipts_data,
        "total": len(receipts_data),
        "page": 1,
        "per_page": 10
    }
