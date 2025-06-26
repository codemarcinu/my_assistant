import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from fastapi import status
from backend.main import app

@pytest.mark.asyncio
async def test_chat_stream_basic():
    """Test basic chat stream functionality with proper mocking"""
    with patch("backend.api.v2.endpoints.chat.chat_response_generator") as mock_generator:
        # Mock the generator to return test response
        async def mock_gen():
            yield "Hello, this is a test response"
        
        mock_generator.return_value = mock_gen()
        
        client = TestClient(app)
        payload = {"message": "Hello, how are you?", "session_id": "test-session"}
        response = client.post("/api/v2/chat/stream", json=payload, timeout=30)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.text
        assert "błąd" not in response.text.lower()

@pytest.mark.asyncio
async def test_chat_endpoint_basic():
    """Test basic chat endpoint"""
    with patch("backend.api.v2.endpoints.chat.chat_response_generator") as mock_generator:
        # Mock the generator to return test response
        async def mock_gen():
            yield "Hello, this is a test response"
        
        mock_generator.return_value = mock_gen()
        
        client = TestClient(app)
        payload = {"message": "Hello, how are you?"}
        response = client.post("/api/v2/chat", json=payload)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert "response" in data

@pytest.mark.asyncio
async def test_chat_endpoint_with_model():
    """Test chat endpoint with specific model"""
    with patch("backend.api.v2.endpoints.chat.chat_response_generator") as mock_generator:
        # Mock the generator to return test response
        async def mock_gen():
            yield "Hello, this is a test response"
        
        mock_generator.return_value = mock_gen()
        
        client = TestClient(app)
        payload = {"message": "Hello, how are you?", "model": "bielik"}
        response = client.post("/api/v2/chat", json=payload)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert "response" in data

@pytest.mark.asyncio
async def test_chat_endpoint_with_context():
    """Test chat endpoint with context"""
    with patch("backend.api.v2.endpoints.chat.chat_response_generator") as mock_generator:
        # Mock the generator to return test response
        async def mock_gen():
            yield "Hello, this is a test response"
        
        mock_generator.return_value = mock_gen()
        
        client = TestClient(app)
        payload = {
            "message": "Hello, how are you?",
            "context": {"user_id": "test_user", "session_id": "test_session"}
        }
        response = client.post("/api/v2/chat", json=payload)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert "response" in data

@pytest.mark.asyncio
async def test_chat_endpoint_empty_message():
    """Test chat endpoint with empty message"""
    client = TestClient(app)
    payload = {"message": ""}
    response = client.post("/api/v2/chat", json=payload)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["success"] is True

@pytest.mark.asyncio
async def test_chat_stream_empty_message():
    """Test chat stream with empty message"""
    client = TestClient(app)
    payload = {"message": ""}
    response = client.post("/api/v2/chat/stream", json=payload)
    
    assert response.status_code == status.HTTP_200_OK
    # Should return error message for empty prompt
    assert "error" in response.text.lower() or "empty" in response.text.lower()

@pytest.mark.asyncio
async def test_chat_endpoint_error_handling():
    """Test chat endpoint error handling"""
    with patch("backend.api.v2.endpoints.chat.chat_response_generator") as mock_generator:
        # Mock the generator to raise an exception
        async def mock_gen():
            raise Exception("Test error")
        
        mock_generator.return_value = mock_gen()
        
        client = TestClient(app)
        payload = {"message": "Hello, how are you?"}
        response = client.post("/api/v2/chat", json=payload)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is False
        assert "error" in data["response"].lower()

@pytest.mark.asyncio
async def test_chat_stream_error_handling():
    """Test chat stream error handling"""
    with patch("backend.api.v2.endpoints.chat.chat_response_generator") as mock_generator:
        # Mock the generator to raise an exception
        async def mock_gen():
            raise Exception("Test error")
        
        mock_generator.return_value = mock_gen()
        
        client = TestClient(app)
        payload = {"message": "Hello, how are you?"}
        response = client.post("/api/v2/chat/stream", json=payload)
        
        assert response.status_code == status.HTTP_200_OK
        assert "błąd" in response.text.lower() or "error" in response.text.lower()

@pytest.mark.asyncio
async def test_get_selected_model():
    """Test get_selected_model function"""
    from backend.api.v2.endpoints.chat import get_selected_model
    
    with patch("os.path.exists", return_value=False):
        model = get_selected_model()
        assert "bielik" in model.lower()

@pytest.mark.asyncio
async def test_memory_chat_request_model():
    """Test MemoryChatRequest model validation"""
    from backend.api.v2.endpoints.chat import MemoryChatRequest
    
    request = MemoryChatRequest(
        message="Hello",
        session_id="test-session",
        usePerplexity=False,
        useBielik=True,
        agent_states={"rag": True, "weather": False}
    )
    
    assert request.message == "Hello"
    assert request.session_id == "test-session"
    assert request.usePerplexity is False
    assert request.useBielik is True
    assert request.agent_states["rag"] is True
    assert request.agent_states["weather"] is False

@pytest.mark.asyncio
async def test_chat_request_model():
    """Test ChatRequest model validation"""
    from backend.api.v2.endpoints.chat import ChatRequest
    
    request = ChatRequest(
        message="Hello",
        context={"user_id": "test"},
        model="bielik"
    )
    
    assert request.message == "Hello"
    assert request.context["user_id"] == "test"
    assert request.model == "bielik"

@pytest.mark.asyncio
async def test_chat_response_model():
    """Test ChatResponse model validation"""
    from backend.api.v2.endpoints.chat import ChatResponse
    
    response = ChatResponse(
        response="Hello back",
        success=True,
        metadata={"model": "bielik"},
        timestamp="2025-01-01T00:00:00"
    )
    
    assert response.response == "Hello back"
    assert response.success is True
    assert response.metadata["model"] == "bielik"
    assert response.timestamp == "2025-01-01T00:00:00" 