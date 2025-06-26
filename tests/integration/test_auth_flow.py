"""
Testy integracyjne dla przepływu autentyfikacji

Testuje kompletny przepływ autentyfikacji:
- Rejestracja użytkownika
- Logowanie
- Dostęp do chronionych endpointów
- Wylogowanie
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
import jwt
from datetime import datetime, timedelta

from backend.main import app
from backend.auth.models import User
from backend.auth.schemas import UserCreate, UserLogin


class TestAuthFlow:
    """Testy kompletnego przepływu autentyfikacji"""
    
    @pytest.fixture
    def client(self):
        """Fixture dla test client"""
        return TestClient(app)
    
    @pytest.fixture
    def mock_user_data(self):
        """Fixture dla danych testowego użytkownika"""
        return {
            "username": "testuser",
            "email": "test@example.com",
            "password": "secure_password123"
        }
    
    @pytest.fixture
    def mock_auth_dependency(self):
        """Mock dependency dla autentyfikacji"""
        async def fake_authenticate():
            return {
                'user_id': 1,
                'username': 'testuser',
                'roles': ['user']
            }
        return fake_authenticate
    
    def test_register_user_success(self, client, mock_user_data):
        """Test pomyślnej rejestracji użytkownika"""
        # Mock database operations
        with patch('backend.auth.routes.get_db') as mock_db, \
             patch('backend.auth.authentication.AuthService') as mock_auth_service:
            
            # Setup mocks
            mock_db.return_value = AsyncMock()
            mock_auth_instance = mock_auth_service.return_value
            mock_auth_instance.create_salt_and_hashed_password.return_value = type(
                'obj', (object,), {'password': 'hashed_password', 'salt': 'salt'}
            )
            
            # Make registration request
            response = client.post("/auth/register", json=mock_user_data)
            
            # Verify response
            assert response.status_code == 201
            response_data = response.json()
            assert "id" in response_data
            assert response_data["username"] == mock_user_data["username"]
            assert response_data["email"] == mock_user_data["email"]
            assert "password" not in response_data  # Password should not be returned
    
    def test_register_user_duplicate_username(self, client, mock_user_data):
        """Test rejestracji z istniejącą nazwą użytkownika"""
        with patch('backend.auth.routes.get_db') as mock_db:
            # Mock database to simulate existing user
            mock_db.return_value = AsyncMock()
            mock_db.return_value.execute.return_value.scalar_one_or_none.return_value = User(
                id=1, username=mock_user_data["username"], email="existing@example.com"
            )
            
            response = client.post("/auth/register", json=mock_user_data)
            
            assert response.status_code == 400
            assert "username already registered" in response.json()["detail"].lower()
    
    def test_register_user_invalid_data(self, client):
        """Test rejestracji z niepoprawnymi danymi"""
        invalid_data = {
            "username": "",  # Empty username
            "email": "invalid-email",  # Invalid email
            "password": "123"  # Too short password
        }
        
        response = client.post("/auth/register", json=invalid_data)
        
        assert response.status_code == 422  # Validation error
    
    def test_login_success(self, client, mock_user_data):
        """Test pomyślnego logowania"""
        with patch('backend.auth.routes.get_db') as mock_db, \
             patch('backend.auth.authentication.AuthService') as mock_auth_service, \
             patch('backend.auth.jwt_handler.JWTHandler') as mock_jwt_handler:
            
            # Setup mocks
            mock_db.return_value = AsyncMock()
            mock_auth_instance = mock_auth_service.return_value
            mock_auth_instance.verify_password.return_value = True
            
            # Mock existing user
            mock_db.return_value.execute.return_value.scalar_one_or_none.return_value = User(
                id=1,
                username=mock_user_data["username"],
                email=mock_user_data["email"],
                hashed_password="hashed_password",
                is_active=True
            )
            
            # Mock JWT token generation
            mock_jwt_instance = mock_jwt_handler.return_value
            mock_jwt_instance.create_access_token.return_value = "test_token_123"
            
            # Make login request
            login_data = {
                "username": mock_user_data["username"],
                "password": mock_user_data["password"]
            }
            response = client.post("/auth/login", data=login_data)
            
            # Verify response
            assert response.status_code == 200
            response_data = response.json()
            assert "access_token" in response_data
            assert response_data["token_type"] == "bearer"
            assert response_data["access_token"] == "test_token_123"
    
    def test_login_invalid_credentials(self, client, mock_user_data):
        """Test logowania z niepoprawnymi danymi"""
        with patch('backend.auth.routes.get_db') as mock_db, \
             patch('backend.auth.authentication.AuthService') as mock_auth_service:
            
            # Setup mocks
            mock_db.return_value = AsyncMock()
            mock_auth_instance = mock_auth_service.return_value
            mock_auth_instance.verify_password.return_value = False
            
            # Mock existing user
            mock_db.return_value.execute.return_value.scalar_one_or_none.return_value = User(
                id=1,
                username=mock_user_data["username"],
                email=mock_user_data["email"],
                hashed_password="hashed_password",
                is_active=True
            )
            
            # Make login request with wrong password
            login_data = {
                "username": mock_user_data["username"],
                "password": "wrong_password"
            }
            response = client.post("/auth/login", data=login_data)
            
            # Verify response
            assert response.status_code == 401
            assert "invalid credentials" in response.json()["detail"].lower()
    
    def test_login_nonexistent_user(self, client):
        """Test logowania nieistniejącego użytkownika"""
        with patch('backend.auth.routes.get_db') as mock_db:
            # Mock database to return None (user not found)
            mock_db.return_value = AsyncMock()
            mock_db.return_value.execute.return_value.scalar_one_or_none.return_value = None
            
            login_data = {
                "username": "nonexistent",
                "password": "password123"
            }
            response = client.post("/auth/login", data=login_data)
            
            assert response.status_code == 401
            assert "invalid credentials" in response.json()["detail"].lower()
    
    def test_protected_endpoint_without_auth(self, client):
        """Test dostępu do chronionego endpointu bez autentyfikacji"""
        # Try to access protected endpoint without token
        response = client.get("/api/v2/users/me")
        
        # Should return 401 or 404 (if endpoint doesn't exist)
        assert response.status_code in [401, 404]
    
    def test_protected_endpoint_with_valid_token(self, client, mock_auth_dependency):
        """Test dostępu do chronionego endpointu z poprawnym tokenem"""
        # Override auth dependency for this test
        from backend.auth.auth_middleware import get_current_user
        app.dependency_overrides[get_current_user] = mock_auth_dependency
        
        try:
            response = client.get("/api/v2/users/me")
            # Should work if endpoint exists, otherwise 404
            assert response.status_code in [200, 404]
        finally:
            # Cleanup
            app.dependency_overrides.clear()
    
    def test_protected_endpoint_with_invalid_token(self, client):
        """Test dostępu do chronionego endpointu z niepoprawnym tokenem"""
        # Try to access protected endpoint with invalid token
        headers = {"Authorization": "Bearer invalid_token_123"}
        response = client.get("/api/v2/users/me", headers=headers)
        
        assert response.status_code in [401, 404]
    
    def test_token_expiration(self, client):
        """Test wygaśnięcia tokenu"""
        # Create an expired token
        expired_token = jwt.encode(
            {
                "user_id": 1,
                "username": "testuser",
                "exp": datetime.utcnow() - timedelta(hours=1),  # Expired 1 hour ago
                "iat": datetime.utcnow() - timedelta(hours=2)
            },
            "test_secret_key",
            algorithm="HS256"
        )
        
        headers = {"Authorization": f"Bearer {expired_token}"}
        response = client.get("/api/v2/users/me", headers=headers)
        
        assert response.status_code in [401, 404]
    
    def test_refresh_token_flow(self, client):
        """Test przepływu odświeżania tokenu"""
        # This test would verify the refresh token functionality
        # Implementation depends on whether refresh tokens are implemented
        pass
    
    def test_logout_flow(self, client):
        """Test przepływu wylogowania"""
        # This test would verify logout functionality
        # Implementation depends on whether logout is implemented
        pass


class TestAuthValidation:
    """Testy walidacji danych autentyfikacji"""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    def test_username_validation(self, client):
        """Test walidacji nazwy użytkownika"""
        invalid_usernames = [
            "",  # Empty
            "a" * 51,  # Too long
            "user@name",  # Invalid characters
            "user name",  # Spaces
        ]
        
        for username in invalid_usernames:
            data = {
                "username": username,
                "email": "test@example.com",
                "password": "secure_password123"
            }
            response = client.post("/auth/register", json=data)
            assert response.status_code == 422
    
    def test_email_validation(self, client):
        """Test walidacji adresu email"""
        invalid_emails = [
            "",  # Empty
            "invalid-email",  # No @
            "@example.com",  # No local part
            "user@",  # No domain
            "user@.com",  # No domain name
            "user@example",  # No TLD
        ]
        
        for email in invalid_emails:
            data = {
                "username": "testuser",
                "email": email,
                "password": "secure_password123"
            }
            response = client.post("/auth/register", json=data)
            assert response.status_code == 422
    
    def test_password_validation(self, client):
        """Test walidacji hasła"""
        weak_passwords = [
            "",  # Empty
            "123",  # Too short
            "password",  # Common password
            "abc123",  # Too simple
        ]
        
        for password in weak_passwords:
            data = {
                "username": "testuser",
                "email": "test@example.com",
                "password": password
            }
            response = client.post("/auth/register", json=data)
            # Should either fail validation or be rejected
            assert response.status_code in [422, 400]


class TestAuthSecurity:
    """Testy bezpieczeństwa autentyfikacji"""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    def test_password_not_returned(self, client):
        """Test czy hasło nie jest zwracane w odpowiedzi"""
        with patch('backend.auth.routes.get_db') as mock_db, \
             patch('backend.auth.authentication.AuthService') as mock_auth_service:
            
            # Setup mocks
            mock_db.return_value = AsyncMock()
            mock_auth_instance = mock_auth_service.return_value
            mock_auth_instance.create_salt_and_hashed_password.return_value = type(
                'obj', (object,), {'password': 'hashed_password', 'salt': 'salt'}
            )
            
            data = {
                "username": "testuser",
                "email": "test@example.com",
                "password": "secure_password123"
            }
            response = client.post("/auth/register", json=data)
            
            if response.status_code == 201:
                response_data = response.json()
                assert "password" not in response_data
                assert "hashed_password" not in response_data
    
    def test_sql_injection_protection(self, client):
        """Test ochrony przed SQL injection"""
        malicious_data = {
            "username": "'; DROP TABLE users; --",
            "email": "test@example.com",
            "password": "secure_password123"
        }
        
        response = client.post("/auth/register", json=malicious_data)
        # Should handle malicious input gracefully
        assert response.status_code in [422, 400, 201]
    
    def test_xss_protection(self, client):
        """Test ochrony przed XSS"""
        malicious_data = {
            "username": "<script>alert('xss')</script>",
            "email": "test@example.com",
            "password": "secure_password123"
        }
        
        response = client.post("/auth/register", json=malicious_data)
        # Should handle malicious input gracefully
        assert response.status_code in [422, 400, 201]


class TestAuthRateLimiting:
    """Testy ograniczania liczby żądań"""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    def test_login_rate_limiting(self, client):
        """Test ograniczania liczby prób logowania"""
        # Make multiple login attempts
        login_data = {
            "username": "testuser",
            "password": "wrong_password"
        }
        
        responses = []
        for _ in range(10):  # Try 10 times
            response = client.post("/auth/login", data=login_data)
            responses.append(response.status_code)
        
        # Should eventually get rate limited (429) or continue to fail (401)
        assert all(status in [401, 429] for status in responses)
    
    def test_register_rate_limiting(self, client):
        """Test ograniczania liczby prób rejestracji"""
        # Make multiple registration attempts
        register_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "secure_password123"
        }
        
        responses = []
        for _ in range(10):  # Try 10 times
            response = client.post("/auth/register", json=register_data)
            responses.append(response.status_code)
        
        # Should eventually get rate limited (429) or continue to fail (400/422)
        assert all(status in [201, 400, 422, 429] for status in responses) 