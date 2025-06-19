from typing import Any, Dict, Optional, Type

from pydantic import BaseModel

from .agent_builder import AgentBuilder
from .agent_container import AgentContainer
from .enhanced_base_agent import ImprovedBaseAgent
from .agent_registry import AgentRegistry

# Module-level configuration
config = {}
llm_client = None


class AgentConfig(BaseModel):
    """Basic configuration model for agents"""

    agent_type: str
    dependencies: Dict[str, str] = {}
    settings: Dict[str, Any] = {}
    cache_enabled: bool = True


class AgentFactory:
    """Factory for creating agent instances with DI support."""

    def __init__(self, container: Optional[AgentContainer] = None, agent_registry: Optional[AgentRegistry] = None):
        self.container = container or AgentContainer()
        self.config = {}
        self.agent_config = {
            "ocr": {"module": "ocr_agent"},
            "weather": {"module": "enhanced_weather_agent"},
            "search": {"module": "search_agent"},
            "chef": {"module": "chef_agent"},
            "meal_planner": {"module": "meal_planner_agent"},
            "categorization": {"module": "categorization_agent"},
            "analytics": {"module": "analytics_agent"},
            "rag": {"module": "enhanced_rag_agent"},
            "orchestrator": {"module": "orchestrator"},
        }
        self.agent_registry = agent_registry or AgentRegistry()
        
        # Register agent classes with the registry
        self.agent_registry.register_agent_class("OCR", self._get_agent_class("OCRAgent"))
        self.agent_registry.register_agent_class("Weather", self._get_agent_class("EnhancedWeatherAgent"))
        self.agent_registry.register_agent_class("Search", self._get_agent_class("SearchAgent"))
        self.agent_registry.register_agent_class("Chef", self._get_agent_class("ChefAgent"))
        self.agent_registry.register_agent_class("MealPlanner", self._get_agent_class("MealPlannerAgent"))
        self.agent_registry.register_agent_class("Categorization", self._get_agent_class("CategorizationAgent"))
        self.agent_registry.register_agent_class("Analytics", self._get_agent_class("AnalyticsAgent"))
        self.agent_registry.register_agent_class("RAG", self._get_agent_class("EnhancedRAGAgent"))
        self.agent_registry.register_agent_class("Orchestrator", self._get_agent_class("Orchestrator"))
        self.agent_registry.register_agent_class("CustomAgent", self._get_agent_class("EnhancedBaseAgent"))

    def register_agent(
        self, agent_type: str, agent_class: Type[ImprovedBaseAgent]
    ) -> None:
        """
        Register an agent class with the factory and registry.

        Args:
            agent_type (str): Type of agent (e.g., 'enhanced_orchestrator')
            agent_class (Type[ImprovedBaseAgent]): Agent class to register
        """
        self.agent_registry.register_agent_class(agent_type, agent_class)

    def create_agent(
        self, agent_type: str, config: Optional[Dict] = None, **kwargs
    ) -> ImprovedBaseAgent:
        """
        Creates and configures an agent instance using AgentBuilder.

        Args:
            agent_type (str): Type of agent (e.g., 'ocr', 'weather')
            config (Optional[Dict]): Additional configuration for the agent

        Returns:
            ImprovedBaseAgent: Configured agent instance

        Raises:
            ValueError: If the agent type is not found in the registry.
        """
        agent_class = self.agent_registry.get_agent_class(agent_type)
        if not agent_class:
            if "Invalid configuration" in str(self.agent_config.get(agent_type, "")):
                raise ValueError(f"Invalid configuration for agent type: {agent_type}")
            raise ValueError(f"Unsupported agent type: {agent_type}")

        builder = AgentBuilder(self.container, self)
        builder.of_type(agent_type)

        if config:
            builder.with_config(config)

        return builder.build()

    def _get_agent_class(self, class_name: str) -> Type[ImprovedBaseAgent]:
        """Dynamically import agent class to avoid circular imports"""
        import importlib
        import os
        import sys

        # Get the project root path (relative to this file)
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
        if project_root not in sys.path:
            sys.path.insert(0, project_root)

        # Map class names to actual module files (relative imports)
        module_map = {
            "OCRAgent": "ocr_agent",
            "EnhancedWeatherAgent": "enhanced_weather_agent",
            "SearchAgent": "search_agent",
            "ChefAgent": "chef_agent",
            "MealPlannerAgent": "meal_planner_agent",
            "CategorizationAgent": "categorization_agent",
            "AnalyticsAgent": "analytics_agent",
            "EnhancedRAGAgent": "enhanced_rag_agent",
            "Orchestrator": "orchestrator",
            "EnhancedBaseAgent": "enhanced_base_agent",
        }

        if class_name not in module_map:
            raise ValueError(f"No module mapping for agent class: {class_name}")

        module_name = module_map[class_name]
        full_module_path = f"backend.agents.{module_name}"

        try:
            module = importlib.import_module(full_module_path)
            return getattr(module, class_name)
        except ImportError as e:
            # Check if file actually exists
            file_path = os.path.join(os.path.dirname(__file__), f"{module_name}.py")
            if not os.path.exists(file_path):
                raise FileNotFoundError(
                    f"Agent module file not found: {file_path}"
                ) from e
            else:
                raise ImportError(
                    f"Failed to import {class_name} from {full_module_path}: {str(e)}\n"
                    f"Current sys.path: {sys.path}"
                ) from e
