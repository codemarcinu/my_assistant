import pytest
from fastapi.testclient import TestClient
from fastapi import status
from src.backend.main import app

def test_chat_stream_basic():
    client = TestClient(app)
    payload = {"message": "Hello, how are you?", "session_id": "test-session"}
    response = client.post("/api/v2/chat/stream", json=payload, timeout=30)
    assert response.status_code == status.HTTP_200_OK
    assert response.text
    assert "błąd" not in response.text.lower() 