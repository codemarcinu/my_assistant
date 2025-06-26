import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from backend.agents.agent_container import AgentContainer
from backend.agents.interfaces import AgentResponse


class TestAgentContainer:
    """Test cases for AgentContainer class"""
    
    @pytest.mark.asyncio
    async def test_agent_container_initialization(self):
        """Test AgentContainer initialization"""
        container = AgentContainer()
        assert container is not None
        assert hasattr(container, '_services')
        assert hasattr(container, 'register')
        assert hasattr(container, 'get')
        assert hasattr(container, 'register_core_services')
    
    @pytest.mark.asyncio
    async def test_register_service(self):
        """Test registering service in container"""
        container = AgentContainer()
        mock_service = MagicMock()
        
        container.register("test_service", mock_service)
        
        assert "test_service" in container._services
        assert container._services["test_service"] == mock_service
    
    @pytest.mark.asyncio
    async def test_get_service_existing(self):
        """Test getting existing service from container"""
        container = AgentContainer()
        mock_service = MagicMock()
        
        container.register("test_service", mock_service)
        retrieved_service = container.get("test_service")
        
        assert retrieved_service == mock_service
    
    @pytest.mark.asyncio
    async def test_get_service_nonexistent(self):
        """Test getting non-existent service from container"""
        container = AgentContainer()
        retrieved_service = container.get("nonexistent_service")
        
        assert retrieved_service is None
    
    @pytest.mark.asyncio
    async def test_register_service_overwrite(self):
        """Test registering service overwrites existing"""
        container = AgentContainer()
        mock_service1 = MagicMock()
        mock_service2 = MagicMock()
        
        container.register("test_service", mock_service1)
        assert container._services["test_service"] == mock_service1
        
        container.register("test_service", mock_service2)
        assert container._services["test_service"] == mock_service2
        assert container._services["test_service"] != mock_service1
    
    @pytest.mark.asyncio
    async def test_register_core_services(self):
        """Test registering core services"""
        with patch("backend.agents.adapters.alert_service.AlertService") as mock_alert, \
             patch("backend.agents.adapters.error_handler.ErrorHandler") as mock_error, \
             patch("backend.agents.adapters.fallback_manager.FallbackManager") as mock_fallback, \
             patch("backend.core.hybrid_llm_client.hybrid_llm_client") as mock_llm, \
             patch("backend.core.profile_manager.ProfileManager") as mock_profile, \
             patch("backend.core.vector_store.VectorStore") as mock_vector:
            
            mock_db = MagicMock()
            mock_alert_instance = MagicMock()
            mock_error_instance = MagicMock()
            mock_fallback_instance = MagicMock()
            mock_profile_instance = MagicMock()
            mock_vector_instance = MagicMock()
            
            mock_alert.return_value = mock_alert_instance
            mock_error.return_value = mock_error_instance
            mock_fallback.return_value = mock_fallback_instance
            mock_profile.return_value = mock_profile_instance
            mock_vector.return_value = mock_vector_instance
            
            container = AgentContainer()
            container.register_core_services(mock_db)
            
            # Check that core services are registered
            assert container.get("db") == mock_db
            assert container.get("profile_manager") == mock_profile_instance
            assert container.get("llm_client") == mock_llm
            assert container.get("vector_store") == mock_vector_instance
    
    @pytest.mark.asyncio
    async def test_container_services_dict(self):
        """Test container services dictionary access"""
        container = AgentContainer()
        mock_service1 = MagicMock()
        mock_service2 = MagicMock()
        
        container.register("service1", mock_service1)
        container.register("service2", mock_service2)
        
        assert len(container._services) == 2
        assert "service1" in container._services
        assert "service2" in container._services
        assert container._services["service1"] == mock_service1
        assert container._services["service2"] == mock_service2
    
    @pytest.mark.asyncio
    async def test_container_multiple_registrations(self):
        """Test multiple service registrations"""
        container = AgentContainer()
        services = {
            "service1": MagicMock(),
            "service2": MagicMock(),
            "service3": MagicMock()
        }
        
        for name, service in services.items():
            container.register(name, service)
        
        assert len(container._services) == 3
        
        for name, service in services.items():
            assert container.get(name) == service
    
    @pytest.mark.asyncio
    async def test_container_get_none_key(self):
        """Test getting service with None key"""
        container = AgentContainer()
        result = container.get(None)
        
        assert result is None
    
    @pytest.mark.asyncio
    async def test_container_get_empty_key(self):
        """Test getting service with empty key"""
        container = AgentContainer()
        result = container.get("")
        
        assert result is None
    
    @pytest.mark.asyncio
    async def test_container_register_none_service(self):
        """Test registering None service"""
        container = AgentContainer()
        
        # Should not raise exception
        container.register("test", None)
        assert container.get("test") is None
    
    @pytest.mark.asyncio
    async def test_container_register_empty_key(self):
        """Test registering service with empty key"""
        container = AgentContainer()
        mock_service = MagicMock()
        
        container.register("", mock_service)
        assert container.get("") == mock_service
    
    @pytest.mark.asyncio
    async def test_container_services_isolation(self):
        """Test that different containers have isolated services"""
        container1 = AgentContainer()
        container2 = AgentContainer()
        mock_service = MagicMock()
        
        container1.register("test", mock_service)
        
        assert container1.get("test") == mock_service
        assert container2.get("test") is None
    
    @pytest.mark.asyncio
    async def test_container_services_persistence(self):
        """Test that services persist after registration"""
        container = AgentContainer()
        mock_service = MagicMock()
        
        container.register("test", mock_service)
        
        # Get service multiple times
        service1 = container.get("test")
        service2 = container.get("test")
        service3 = container.get("test")
        
        assert service1 == mock_service
        assert service2 == mock_service
        assert service3 == mock_service
        assert service1 is service2 is service3
    
    @pytest.mark.asyncio
    async def test_container_register_core_services_with_mocks(self):
        """Test registering core services with mocked dependencies"""
        with patch("backend.agents.adapters.alert_service.AlertService") as mock_alert_class, \
             patch("backend.agents.adapters.error_handler.ErrorHandler") as mock_error_class, \
             patch("backend.agents.adapters.fallback_manager.FallbackManager") as mock_fallback_class, \
             patch("backend.core.profile_manager.ProfileManager") as mock_profile_class, \
             patch("backend.core.vector_store.VectorStore") as mock_vector_class:
            
            # Create mock instances
            mock_alert_instance = MagicMock()
            mock_error_instance = MagicMock()
            mock_fallback_instance = MagicMock()
            mock_profile_instance = MagicMock()
            mock_vector_instance = MagicMock()
            
            # Configure mock classes to return instances
            mock_alert_class.return_value = mock_alert_instance
            mock_error_class.return_value = mock_error_instance
            mock_fallback_class.return_value = mock_fallback_instance
            mock_profile_class.return_value = mock_profile_instance
            mock_vector_class.return_value = mock_vector_instance
            
            # Mock database session
            mock_db = MagicMock()
            
            container = AgentContainer()
            container.register_core_services(mock_db)
            
            # Verify services are registered
            assert container.get("db") == mock_db
            assert container.get("profile_manager") == mock_profile_instance
            assert container.get("vector_store") == mock_vector_instance
            
            # Verify service constructors were called
            mock_profile_class.assert_called_once_with(mock_db)
            mock_vector_class.assert_called_once()
            mock_alert_class.assert_called_once_with("global")
            mock_error_class.assert_called_once_with("global")
            mock_fallback_class.assert_called_once() 