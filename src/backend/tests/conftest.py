"""
Test configuration and fixtures for the backend tests.
"""

import os
os.environ["TESTING"] = "true"
os.environ["ENVIRONMENT"] = "testing"
os.environ["TESTING_MODE"] = "true"

# Use in-memory SQLite for tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

import pytest
import asyncio
from typing import AsyncGenerator
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from backend.main import app
from backend.core.database import Base

# Import all models to ensure they are registered with Base
from backend.models.shopping import Product
from backend.models.rag_document import RAGDocument
from backend.models.conversation import Conversation


# Create test database engine
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_reset_on_return='commit',
)

# Create test session factory
test_session_factory = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide a database session for tests with tables created."""
    # Create all tables for this session
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with test_session_factory() as session:
        yield session
    
    # Clean up tables after test
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
def test_client() -> TestClient:
    """Provide a test client for the FastAPI app."""
    return TestClient(app)


# Mock external services for tests
@pytest.fixture(autouse=True)
def mock_external_services():
    """Mock external services to avoid real API calls during tests."""
    with patch("backend.core.llm_client.llm_client.generate_stream_from_prompt_async") as mock_llm:
        mock_llm.return_value = iter([{"response": "Test response from LLM"}])
        
        with patch("backend.core.perplexity_client.perplexity_client.search") as mock_search:
            mock_search.return_value = {
                "results": [{"title": "Test news", "snippet": "Test news content"}]
            }
            
            with patch("backend.core.ocr._extract_text_from_image_obj") as mock_ocr:
                mock_ocr.return_value = "FAKE_OCR_TEXT_FROM_RECEIPT"
                
                yield


@pytest.fixture
def sample_food_data():
    """Sample food data for testing."""
    return [
        {
            "name": "Mleko 3.2%",
            "quantity": 2,
            "unit": "l",
            "expiry_date": "2024-12-31",
            "category": "nabiał"
        },
        {
            "name": "Chleb razowy",
            "quantity": 1,
            "unit": "szt",
            "expiry_date": "2024-12-25",
            "category": "pieczywo"
        },
        {
            "name": "Jajka",
            "quantity": 10,
            "unit": "szt",
            "expiry_date": "2024-12-28",
            "category": "nabiał"
        }
    ]


@pytest.fixture
def real_receipt_files():
    """Get real receipt files for testing."""
    from pathlib import Path
    receipts_dir = Path("../../receipts")
    receipt_files = []
    
    if receipts_dir.exists():
        for file_path in receipts_dir.glob("*"):
            if file_path.suffix.lower() in ['.png', '.jpg', '.jpeg', '.pdf']:
                receipt_files.append(file_path)
    
    return receipt_files


# Override the database dependency for tests
@pytest.fixture(autouse=True)
def override_database_dependency():
    """Override the database dependency to use test database."""
    from backend.core.database import get_db
    
    async def override_get_db():
        async with test_session_factory() as session:
            yield session
    
    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.clear() 