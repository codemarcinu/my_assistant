"""
Global test configuration and fixtures
"""
import os
import pytest

# Set testing mode before any imports that might create the app
os.environ["TESTING_MODE"] = "true"

@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Setup test environment variables"""
    # Ensure TESTING_MODE is set for all tests
    os.environ["TESTING_MODE"] = "true"
    yield
    # Cleanup if needed
    pass

class MockAuthHandler:
    """Mock authentication handler for testing"""
    
    def __init__(self, default_user_id: str = "1"):
        self.default_user_id = default_user_id
    
    async def authenticate(self, token: str = None, user_id: str = None):
        """Mock authentication method"""
        if user_id:
            return self._create_mock_user(user_id)
        return self._create_mock_user(self.default_user_id)
    
    def _create_mock_user(self, user_id: str):
        from backend.auth.models import User
        return User(
            id=int(user_id),
            username=f"user_{user_id}",
            email=f"user_{user_id}@test.com",
            roles=["user"]
        )

@pytest.fixture
def mock_auth_handler():
    """Fixture dla mock authentication handler"""
    return MockAuthHandler()

@pytest.fixture
def mock_auth_dependency():
    """Mock dependency dla autentyfikacji w testach"""
    async def fake_authenticate():
        return {
            'user_id': 1,
            'username': 'testuser',
            'roles': ['user']
        }
    return fake_authenticate 