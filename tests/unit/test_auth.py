import pytest
from unittest.mock import Mock, patch, AsyncMock
from fastapi import HTTPException
from fastapi.testclient import TestClient
import jwt
from datetime import datetime, timedelta

from backend.auth.jwt_handler import JWTHandler, jwt_handler
from backend.auth.models import User
from backend.auth.schemas import UserCreate, UserLogin, TokenResponse

# ... existing code ...

# Replace all usages of AuthService with JWTHandler or jwt_handler
# For password hashing and verification, use jwt_handler.get_password_hash and jwt_handler.verify_password
# For token creation and verification, use jwt_handler.create_access_token, jwt_handler.verify_token, etc.
# Remove or adapt any tests that reference methods not present in JWTHandler 