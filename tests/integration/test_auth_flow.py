import pytest
from fastapi.testclient import TestClient
from backend.auth.jwt_handler import jwt_handler
from backend.auth.auth_middleware import AuthMiddleware
from backend.auth.routes import auth_router
# ... existing code ... 