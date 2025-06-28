from __future__ import annotations

import logging
from typing import AsyncGenerator
import re

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import (AsyncSession, async_sessionmaker,
                                    create_async_engine)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import StaticPool
from sqlalchemy import text

from backend.settings import settings

DATABASE_URL = settings.DATABASE_URL

# Create async SQLAlchemy engine with optimized connection pooling
if DATABASE_URL.startswith("sqlite"):  # SQLite does not support pool_size, max_overflow, pool_timeout
    engine = create_async_engine(
        DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
        pool_reset_on_return='commit',
    )
else:
    engine = create_async_engine(
        DATABASE_URL,
        echo=False,  # Disable SQL logging in production
        pool_pre_ping=True,  # Verify connections before use
        pool_recycle=3600,  # Recycle connections after 1 hour
        pool_size=20,  # Increased connection pool size (was 10)
        max_overflow=40,  # Increased maximum overflow connections (was 20)
        pool_timeout=30,  # Connection timeout in seconds
        pool_reset_on_return='commit',  # Reset connections on return
    )

AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)

# TODO MDC-AUDIT: brak retry mechanizmu i monitoringu poolingu – potencjalne connection leaks przy błędach DB


class Base(DeclarativeBase):
    """Unified Base class for all SQLAlchemy models"""

    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


async def get_db_with_error_handling() -> AsyncGenerator[AsyncSession, None]:
    """Database dependency with proper error handling"""
    try:
        async for session in get_db():
            yield session
    except Exception as e:
        logging.error(f"Database connection failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Database connection failed",
                "error_code": "INTERNAL_SERVER_ERROR",
            },
        )


async def init_db():
    """Initialize database with all tables and migrations"""
    try:
        from backend.core.database_migrations import run_all_migrations
        from backend.models.conversation import Base as ConversationBase
        
        # Create all tables
        async with engine.begin() as conn:
            await conn.run_sync(ConversationBase.metadata.create_all)
        
        # Run migrations
        await run_all_migrations()
        
        logging.info("Database initialized successfully")
        
    except Exception as e:
        logging.error(f"Database initialization failed: {e}")
        raise


async def check_db_connection():
    """Check if database connection is working"""
    try:
        async for db in get_db():
            result = await db.execute(text("SELECT 1"))
            result.fetchone()
            return True
    except Exception as e:
        logging.error(f"Database connection check failed: {e}")
        return False


async def get_db_info():
    """Get database information"""
    try:
        async for db in get_db():
            # Get table information
            result = await db.execute(text("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name NOT LIKE 'sqlite_%'
                ORDER BY name
            """))
            tables = [row[0] for row in result.fetchall()]
            
            return {
                "database_url": DATABASE_URL,
                "tables": tables,
                "connection_status": "connected"
            }
    except Exception as e:
        logging.error(f"Error getting database info: {e}")
        return {
            "database_url": DATABASE_URL,
            "tables": [],
            "connection_status": "error",
            "error": str(e)
        }
