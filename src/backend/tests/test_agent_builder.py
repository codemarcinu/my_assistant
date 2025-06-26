import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from backend.agents.agent_builder import AgentBuilder
from backend.agents.agent_container import AgentContainer
from backend.agents.interfaces import AgentResponse, AgentType
from backend.agents.base_agent import BaseAgent


class TestAgentBuilder:
    """Test cases for AgentBuilder class"""
    
    @pytest.fixture
    def container(self):
        """Create a test container"""
        return AgentContainer()
    
    @pytest.fixture
    def factory(self):
        """Create a mock factory"""
        mock_factory = MagicMock()
        mock_factory.agent_registry = MagicMock()
        return mock_factory
    
    @pytest.mark.asyncio
    async def test_agent_builder_initialization(self, container, factory):
        """Test AgentBuilder initialization"""
        builder = AgentBuilder(container, factory)
        assert builder is not None
        assert hasattr(builder, 'build_agent')
        assert builder.container == container
        assert builder._factory == factory
    
    @pytest.mark.asyncio
    async def test_build_general_conversation_agent(self, container, factory):
        """Test building GeneralConversationAgent"""
        with patch("backend.agents.general_conversation_agent.GeneralConversationAgent") as mock_agent_class:
            mock_agent = MagicMock()
            mock_agent_class.return_value = mock_agent
            
            builder = AgentBuilder(container, factory)
            agent = builder.build_agent(AgentType.GENERAL)
            
            assert agent is not None
            mock_agent_class.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_build_weather_agent(self, container, factory):
        """Test building WeatherAgent"""
        with patch("backend.agents.weather_agent.WeatherAgent") as mock_agent_class:
            mock_agent = MagicMock()
            mock_agent_class.return_value = mock_agent
            
            builder = AgentBuilder(container, factory)
            agent = builder.build_agent(AgentType.WEATHER)
            
            assert agent is not None
            mock_agent_class.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_build_search_agent(self, container, factory):
        """Test building SearchAgent"""
        with patch("backend.agents.search_agent.SearchAgent") as mock_agent_class:
            mock_agent = MagicMock()
            mock_agent_class.return_value = mock_agent
            
            builder = AgentBuilder(container, factory)
            agent = builder.build_agent(AgentType.SEARCH)
            
            assert agent is not None
            mock_agent_class.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_build_unknown_agent_type(self, container, factory):
        """Test building unknown agent type raises ValueError"""
        builder = AgentBuilder(container, factory)
        
        with pytest.raises(ValueError, match="Unknown agent type"):
            builder.build_agent("unknown_agent_type")
    
    @pytest.mark.asyncio
    async def test_build_agent_with_query(self, container, factory):
        """Test building agent with query for model selection"""
        with patch("backend.agents.general_conversation_agent.GeneralConversationAgent") as mock_agent_class, \
             patch.object(builder, 'language_detector') as mock_detector, \
             patch.object(builder, 'model_selector') as mock_selector:
            
            mock_agent = MagicMock()
            mock_agent_class.return_value = mock_agent
            mock_detector.detect_language.return_value = ("en", 0.9)
            mock_selector.select_model.return_value = "bielik"
            
            builder = AgentBuilder(container, factory)
            agent = builder.build_agent(AgentType.GENERAL, query="Hello world")
            
            assert agent is not None
            mock_agent_class.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_build_agent_with_context(self, container, factory):
        """Test building agent with context"""
        with patch("backend.agents.general_conversation_agent.GeneralConversationAgent") as mock_agent_class:
            mock_agent = MagicMock()
            mock_agent_class.return_value = mock_agent
            
            builder = AgentBuilder(container, factory)
            context = {"user_id": "test_user", "session_id": "test_session"}
            agent = builder.build_agent(AgentType.GENERAL, context=context)
            
            assert agent is not None
            mock_agent_class.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_build_agent_with_model(self, container, factory):
        """Test building agent with specific model"""
        with patch("backend.agents.general_conversation_agent.GeneralConversationAgent") as mock_agent_class:
            mock_agent = MagicMock()
            mock_agent_class.return_value = mock_agent
            
            builder = AgentBuilder(container, factory)
            agent = builder.build_agent(AgentType.GENERAL, model="gemma")
            
            assert agent is not None
            mock_agent_class.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_map_agent_type_to_task(self, container, factory):
        """Test mapping agent types to model tasks"""
        builder = AgentBuilder(container, factory)
        
        from backend.core.model_selector import ModelTask
        
        assert builder._map_agent_type_to_task(AgentType.GENERAL) == ModelTask.TEXT_ONLY
        assert builder._map_agent_type_to_task(AgentType.WEATHER) == ModelTask.TEXT_ONLY
        assert builder._map_agent_type_to_task(AgentType.SEARCH) == ModelTask.TEXT_ONLY
        assert builder._map_agent_type_to_task(AgentType.OCR) == ModelTask.IMAGE_ANALYSIS
        assert builder._map_agent_type_to_task(AgentType.RAG) == ModelTask.RAG
    
    @pytest.mark.asyncio
    async def test_get_agent_complexity(self, container, factory):
        """Test getting agent complexity scores"""
        builder = AgentBuilder(container, factory)
        
        assert builder._get_agent_complexity(AgentType.GENERAL) == 0.5
        assert builder._get_agent_complexity(AgentType.WEATHER) == 0.4
        assert builder._get_agent_complexity(AgentType.SEARCH) == 0.6
        assert builder._get_agent_complexity(AgentType.CODE) == 0.8
        assert builder._get_agent_complexity(AgentType.OCR) == 0.7
    
    @pytest.mark.asyncio
    async def test_may_contain_images(self, container, factory):
        """Test image detection in queries"""
        builder = AgentBuilder(container, factory)
        
        # Test queries that may contain images
        assert builder._may_contain_images("analyze this image", AgentType.OCR) is True
        assert builder._may_contain_images("what's in this photo", AgentType.OCR) is True
        
        # Test queries that don't contain images
        assert builder._may_contain_images("what's the weather", AgentType.WEATHER) is False
        assert builder._may_contain_images("search for recipes", AgentType.SEARCH) is False
    
    @pytest.mark.asyncio
    async def test_get_default_model_for_agent(self, container, factory):
        """Test getting default models for agents"""
        builder = AgentBuilder(container, factory)
        
        # Test default models for different agent types
        assert builder._get_default_model_for_agent(AgentType.GENERAL) in ["bielik", "gemma"]
        assert builder._get_default_model_for_agent(AgentType.WEATHER) in ["bielik", "gemma"]
        assert builder._get_default_model_for_agent(AgentType.SEARCH) in ["bielik", "gemma"]
    
    @pytest.mark.asyncio
    async def test_builder_with_config(self, container, factory):
        """Test builder with configuration"""
        builder = AgentBuilder(container, factory)
        
        # Test configuration methods
        builder.with_config({"temperature": 0.7, "max_tokens": 1000})
        assert builder._config["temperature"] == 0.7
        assert builder._config["max_tokens"] == 1000
    
    @pytest.mark.asyncio
    async def test_builder_of_type(self, container, factory):
        """Test builder type setting"""
        builder = AgentBuilder(container, factory)
        
        builder.of_type("general")
        assert builder._agent_type == "general"
    
    @pytest.mark.asyncio
    async def test_build_method(self, container, factory):
        """Test the build method"""
        with patch.object(builder, '_create_agent_instance') as mock_create:
            mock_agent = MagicMock()
            mock_create.return_value = mock_agent
            
            builder = AgentBuilder(container, factory)
            builder.of_type("general")
            
            agent = builder.build()
            
            assert agent == mock_agent
            mock_create.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_build_method_no_type(self, container, factory):
        """Test build method without setting type"""
        builder = AgentBuilder(container, factory)
        
        with pytest.raises(ValueError, match="Agent type must be specified"):
            builder.build()
    
    @pytest.mark.asyncio
    async def test_create_agent_instance(self, container, factory):
        """Test agent instance creation"""
        with patch("backend.agents.general_conversation_agent.GeneralConversationAgent") as mock_agent_class:
            mock_agent = MagicMock()
            mock_agent_class.return_value = mock_agent
            factory.agent_registry.get_agent_class.return_value = mock_agent_class
            
            builder = AgentBuilder(container, factory)
            builder._agent_type = "general"
            
            agent = builder._create_agent_instance()
            
            assert agent == mock_agent
            factory.agent_registry.get_agent_class.assert_called_once_with("general")
    
    @pytest.mark.asyncio
    async def test_create_agent_instance_unknown_type(self, container, factory):
        """Test agent instance creation with unknown type"""
        factory.agent_registry.get_agent_class.return_value = None
        
        builder = AgentBuilder(container, factory)
        builder._agent_type = "unknown"
        
        with pytest.raises(ValueError, match="Unsupported agent type"):
            builder._create_agent_instance() 