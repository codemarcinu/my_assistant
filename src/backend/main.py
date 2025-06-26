from __future__ import annotations

import logging
from datetime import datetime
from typing import (Any, AsyncGenerator, Callable, Coroutine, Dict, List,
                    Optional, Union)

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse

from backend.app_factory import create_app

app = create_app()

logger = logging.getLogger(__name__)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> Any:
    logger.error(f"Unhandled exception on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal Server Error",
            "error_code": "INTERNAL_SERVER_ERROR",
            "path": str(request.url.path),
            "timestamp": datetime.now().isoformat(),
        },
    )
