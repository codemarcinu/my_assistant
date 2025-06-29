from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator
from datetime import datetime

import structlog
from fastapi import APIRouter, FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

# Import custom logger to configure logging
from backend.logger import configure_root_logger, setup_logger

from backend.api import agents, chat, food, monitoring, pantry
from backend.api import settings as settings_router
from backend.api import upload
from backend.api.v1.endpoints import receipts
from backend.api.v2.api import api_router as api_v2_router
from backend.api.v2.exceptions import APIErrorDetail, APIException
from src.api.v3 import receipts as receipts_v3  # Import API v3
from backend.settings import settings
from backend.core.cache_manager import CacheManager
from backend.core.database import AsyncSessionLocal, Base, engine, get_db
from backend.core.exceptions import (FoodSaveError, convert_system_exception,
                                     log_error_with_context)
from backend.core.middleware import (ErrorHandlingMiddleware,
                                     RequestLoggingMiddleware,
                                     SecurityHeadersMiddleware)
from backend.core.migrations import run_migrations
from backend.core.seed_data import seed_database
from backend.core.telemetry import setup_telemetry
from backend.orchestrator_management.orchestrator_pool import orchestrator_pool
from backend.agents.orchestrator import Orchestrator
from backend.agents.orchestrator_factory import create_orchestrator
from backend.auth.auth_middleware import AuthMiddleware
from backend.auth.routes import auth_router

# Configure logging before creating the app
configure_root_logger()
logger = structlog.get_logger()
limiter = Limiter(key_func=get_remote_address)


# Exception Handlers
async def custom_exception_handler(request: Request, exc: FoodSaveError) -> None:
    context = {
        "request_path": request.url.path,
        "request_method": request.method,
        "user_agent": request.headers.get("user-agent", "unknown"),
        "client_ip": request.client.host if request.client else "unknown",
    }
    log_error_with_context(exc, context, "custom_exception_handler")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.to_dict()},
    )


async def api_v2_exception_handler(request: Request, exc: APIException) -> None:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": APIErrorDetail(
                error_code=exc.error_code,
                message=exc.message,
                context=exc.context,
            ).model_dump(exclude_none=True)
        },
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handler dla HTTPException - zachowuje domyślny format FastAPI"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


async def generic_exception_handler(request: Request, exc: Exception) -> None:
    system_exc = convert_system_exception(exc)
    context = {
        "request_path": request.url.path,
        "request_method": request.method,
        "user_agent": request.headers.get("user-agent", "unknown"),
        "client_ip": request.client.host if request.client else "unknown",
    }
    log_error_with_context(system_exc, context, "generic_exception_handler")
    return JSONResponse(
        status_code=system_exc.status_code,
        content={"detail": system_exc.detail},
    )


async def not_found_handler(request: Request, exc) -> None:
    return JSONResponse(
        status_code=404,
        content={"detail": "Resource not found."},
    )


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Startup logic
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Skip migrations for SQLite (they use PostgreSQL-specific queries)
    if not settings.DATABASE_URL.startswith("sqlite"):
        await run_migrations()
    else:
        logger.info("Skipping migrations for SQLite database")
    
    logger.info("database.seeding.start")
    async with AsyncSessionLocal() as db:
        try:
            await seed_database(db)
        except Exception as e:
            logger.error("database.seeding.error", error=str(e))
            raise
    logger.info("database.seeding.complete")

    # Initialize cache
    cache_manager = CacheManager()
    await cache_manager.connect()

    # Initialize MMLW embeddings if enabled
    if settings.USE_MMLW_EMBEDDINGS:
        try:
            from backend.core.mmlw_embedding_client import mmlw_client
            logger.info("Initializing MMLW embeddings...")
            await mmlw_client.initialize()
            if mmlw_client.is_available():
                logger.info("MMLW embeddings initialized successfully")
            else:
                logger.warning("MMLW embeddings initialization failed")
        except Exception as e:
            logger.error(f"Failed to initialize MMLW embeddings: {e}")

    logger.info("Initializing orchestrator pool and request queue...")
    # Initialize orchestrator pool with default orchestrator
    async for db in get_db():
        default_orchestrator = create_orchestrator(db)
        await orchestrator_pool.add_instance("default", default_orchestrator)
        await orchestrator_pool.start_health_checks()
        logger.info("Orchestrator pool initialized with default instance")
        break

    yield

    # Shutdown logic
    await cache_manager.disconnect()
    logger.info("Application shutdown.")


def create_app() -> FastAPI:
    """Creates and configures a FastAPI application instance."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        debug=settings.DEBUG,
        lifespan=lifespan,
    )

    # Add middleware
    app.add_middleware(SlowAPIMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"]
    )
    app.add_middleware(AuthMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(ErrorHandlingMiddleware)
    # app.add_middleware(PerformanceMonitoringMiddleware) # Can be noisy

    # Add exception handlers
    app.add_exception_handler(FoodSaveError, custom_exception_handler)
    app.add_exception_handler(APIException, api_v2_exception_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)
    app.add_exception_handler(404, not_found_handler)

    # Add test endpoint for error handling
    @app.get("/raise_error")
    async def raise_error(type: str = "value") -> Any:
        """Test endpoint for error handling scenarios"""
        if type == "value":
            raise ValueError("Test ValueError")
        elif type == "key":
            raise KeyError("Missing required field")
        elif type == "custom":
            raise FoodSaveError("Test custom exception")
        elif type == "http":
            from fastapi import HTTPException

            raise HTTPException(status_code=418, detail="I'm a teapot")
        else:
            raise Exception("Unexpected error")

    # Add simple health check endpoint
    @app.get("/health")
    async def health_check():
        """Simple health check endpoint for Docker healthcheck."""
        return {"status": "healthy", "timestamp": datetime.now().isoformat()}

    # Setup telemetry if enabled
    if settings.TELEMETRY_ENABLED:
        setup_telemetry(app)

    # Include routers
    api_router = APIRouter()
    api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])
    api_router.include_router(food.router, prefix="/food", tags=["Food"])
    api_router.include_router(pantry.router, prefix="/pantry", tags=["Pantry"])
    api_router.include_router(agents.router, prefix="/agents", tags=["Agents"])
    api_router.include_router(
        settings_router.router, prefix="/settings", tags=["Settings"]
    )

    # Versioned API routers
    api_v1_router = APIRouter()
    api_v1_router.include_router(receipts.router, tags=["Receipts V1"])
    api_v1_router.include_router(upload.router, tags=["Upload"])

    app.include_router(monitoring.router)
    app.include_router(auth_router)
    app.include_router(api_router, prefix="/api")
    app.include_router(api_v1_router, prefix="/api/v1")
    app.include_router(api_v2_router, prefix="/api/v2")
    app.include_router(receipts_v3.router, prefix="/api/v3", tags=["Receipts V3 - Async"])

    # Limiter state needs to be attached to the app
    app.state.limiter = limiter

    return app
