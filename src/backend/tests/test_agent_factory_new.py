from __future__ import annotations
from typing import Any, Dict, List, Optional, Union, Callable
from typing import AsyncGenerator, Coroutine
"""
Tests for updated Agent Factory with new agent types

Tests the enhanced agent factory that supports:
- GeneralConversationAgent
- Updated agent creation with model selection
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.agents.agent_factory import AgentFactory
from backend.agents.analytics_agent import AnalyticsAgent
from backend.agents.categorization_agent import CategorizationAgent
from backend.agents.chef_agent import ChefAgent
from backend.agents.general_conversation_agent import GeneralConversationAgent
from backend.agents.meal_planner_agent import MealPlannerAgent
from backend.agents.ocr_agent import OCRAgent
from backend.agents.rag_agent import RAGAgent
from backend.agents.search_agent import SearchAgent
from backend.agents.weather_agent import WeatherAgent


class TestAgentFactoryNew:
    """Test suite for updated Agent Factory"""

    @pytest.fixture
    def factory(self) -> None:
        """Create an AgentFactory instance for testing"""
        return AgentFactory()

    def test_create_general_conversation_agent(self, factory) -> None:
        """Test creation of GeneralConversationAgent"""
        agent = factory.create_agent("general_conversation")
        assert isinstance(agent, GeneralConversationAgent)
        assert agent.name == "GeneralConversationAgent"
        assert (
            agent.description
            == "Agent do obsługi swobodnych konwersacji z wykorzystaniem RAG i wyszukiwania internetowego"
        )

    def test_create_shopping_conversation_agent(self, factory) -> None:
        """Test creation of agent for shopping conversations"""
        agent = factory.create_agent("shopping_conversation")
        assert isinstance(agent, GeneralConversationAgent)
        assert agent.name == "GeneralConversationAgent"

    def test_create_food_conversation_agent(self, factory) -> None:
        """Test creation of agent for food conversations"""
        agent = factory.create_agent("food_conversation")
        assert isinstance(agent, GeneralConversationAgent)
        assert agent.name == "GeneralConversationAgent"

    def test_create_information_query_agent(self, factory) -> None:
        """Test creation of agent for information queries"""
        agent = factory.create_agent("information_query")
        assert isinstance(agent, GeneralConversationAgent)
        assert agent.name == "GeneralConversationAgent"

    def test_create_cooking_agent(self, factory) -> None:
        """Test creation of ChefAgent"""
        agent = factory.create_agent("cooking")
        assert isinstance(agent, ChefAgent)
        assert agent.name == "ChefAgent"

    def test_create_search_agent(self, factory) -> None:
        """Test creation of SearchAgent"""
        agent = factory.create_agent("search")
        assert isinstance(agent, SearchAgent)
        assert agent.name == "SearchAgent"

    def test_create_weather_agent(self, factory) -> None:
        """Test creation of WeatherAgent"""
        agent = factory.create_agent("weather")
        assert isinstance(agent, WeatherAgent)
        assert agent.name == "WeatherAgent"

    def test_create_rag_agent(self, factory) -> None:
        """Test creation of RAGAgent"""
        agent = factory.create_agent("rag")
        assert isinstance(agent, RAGAgent)
        assert agent.name == "RAGAgent"

    def test_create_categorization_agent(self, factory) -> None:
        """Test creation of CategorizationAgent"""
        agent = factory.create_agent("categorization")
        assert isinstance(agent, CategorizationAgent)
        assert agent.name == "CategorizationAgent"

    def test_create_meal_planner_agent(self, factory) -> None:
        """Test creation of MealPlannerAgent"""
        agent = factory.create_agent("meal_planning")
        assert isinstance(agent, GeneralConversationAgent)
        assert agent.name == "GeneralConversationAgent"

    def test_create_ocr_agent(self, factory) -> None:
        """Test creation of OCRAgent"""
        agent = factory.create_agent("ocr")
        assert isinstance(agent, OCRAgent)
        assert agent.name == "OCRAgent"

    def test_create_analytics_agent(self, factory) -> None:
        """Test creation of AnalyticsAgent"""
        agent = factory.create_agent("analytics")
        assert isinstance(agent, AnalyticsAgent)
        assert agent.name == "AnalyticsAgent"

    def test_create_unknown_agent_type(self, factory) -> None:
        """Test creation of unknown agent type"""
        agent = factory.create_agent("unknown_type")
        assert isinstance(agent, GeneralConversationAgent)

    def test_get_available_agents(self, factory) -> None:
        """Test getting list of available agent types"""
        agents = factory.get_available_agents()

        assert isinstance(agents, dict)
        assert "general_conversation" in agents
        assert "chef" in agents
        assert "search" in agents
        assert "weather" in agents

    def test_agent_registry_integration(self, factory) -> None:
        """Test that created agents are properly registered"""
        agent = factory.create_agent("general_conversation")

        assert agent.name in factory._registry
        assert factory._registry[agent.name] == agent

    def test_agent_singleton_behavior(self, factory) -> None:
        """Test that agents are created as singletons"""
        agent1 = factory.create_agent("general_conversation")
        agent2 = factory.create_agent("general_conversation")

        assert agent1 is agent2
        assert id(agent1) == id(agent2)

    def test_agent_initialization_with_dependencies(self, factory) -> None:
        """Test that agents are properly initialized with dependencies"""
        agent = factory.create_agent("general_conversation")

        assert hasattr(agent, "rag_processor")
        assert hasattr(agent, "rag_integration")

    def test_agent_factory_cleanup(self, factory) -> None:
        """Test agent factory cleanup"""
        factory.create_agent("general_conversation")
        factory.create_agent("cooking")

        assert len(factory._registry) >= 2

        factory.cleanup()

        assert len(factory._registry) == 0

    def test_agent_factory_reset(self, factory) -> None:
        """Test agent factory reset functionality"""
        agent1 = factory.create_agent("general_conversation")
        agent2 = factory.create_agent("cooking")

        factory.reset()

        agent3 = factory.create_agent("general_conversation")
        agent4 = factory.create_agent("cooking")

        assert agent1 is not agent3
        assert agent2 is not agent4

    def test_agent_factory_error_handling(self, factory) -> None:
        """Test error handling in agent creation"""
        with patch(
            "src.backend.agents.agent_factory.GeneralConversationAgent",
            side_effect=Exception("Init error"),
        ):
            with pytest.raises(Exception, match="Init error"):
                factory.create_agent("general_conversation")

    def test_agent_factory_concurrent_access(self, factory) -> None:
        """Test concurrent access to agent factory"""
        agent1 = factory.create_agent("general_conversation")
        agent2 = factory.create_agent("cooking")
        agent3 = factory.create_agent("search")
        agent4 = factory.create_agent("weather")

        assert agent1 is not None
        assert agent2 is not None
        assert agent3 is not None
        assert agent4 is not None

        assert isinstance(agent1, GeneralConversationAgent)
        assert isinstance(agent2, ChefAgent)
        assert isinstance(agent3, SearchAgent)
        assert isinstance(agent4, WeatherAgent)
