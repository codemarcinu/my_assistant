import json
import os
from typing import Dict, Optional, Type

from backend.agents.interfaces import BaseAgent


class AgentRegistry:
    def __init__(self, config_file: Optional[str] = None) -> None:
        self._agents: Dict[str, Type[BaseAgent]] = {}
        self._intent_mappings: Dict[str, str] = {}
        
        # Load intent mappings from config file or use defaults
        self.intent_to_agent_mapping = self._load_intent_mappings(config_file)
        
    def _load_intent_mappings(self, config_file: Optional[str] = None) -> Dict[str, str]:
        """Load intent mappings from config file or return defaults"""
        default_mappings = {
            "general_conversation": "GeneralConversation",
            "food_conversation": "GeneralConversation",
            "shopping_conversation": "Categorization",
            "information_query": "Search",
            "cooking": "Chef",
            "weather": "Weather",
            "search": "Search",
            "rag": "RAG",
            "ocr": "OCR",
            "categorization": "Categorization",
            "meal_planning": "MealPlanner",
            "analytics": "Analytics",
            "general": "GeneralConversation",  # Default mapping
        }
        
        if config_file and os.path.exists(config_file):
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    return config.get('intent_mappings', default_mappings)
            except Exception as e:
                print(f"Error loading agent config: {e}, using defaults")
                return default_mappings
        
        return default_mappings

    def register_agent_class(
        self, agent_type: str, agent_class: Type[BaseAgent]
    ) -> None:
        """Rejestruje klasę agenta pod danym typem."""
        self._agents[agent_type] = agent_class

    def register_intent_to_agent_mapping(self, intent: str, agent_type: str) -> None:
        """Mapuje intencję do zarejestrowanego typu agenta."""
        if agent_type not in self._agents:
            raise ValueError(
                f"Agent type '{agent_type}' must be registered before mapping an intent to it."
            )
        self._intent_mappings[intent] = agent_type

    def get_agent_class(self, agent_type: str) -> Optional[Type[BaseAgent]]:
        """Zwraca klasę agenta na podstawie jego typu."""
        return self._agents.get(agent_type)

    def get_agent_type_for_intent(
        self, intent: str, default_agent_type: str = "Chef"
    ) -> str:
        """Zwraca typ agenta dla danej intencji, z domyślnym fallbackiem."""
        return self._intent_mappings.get(intent, default_agent_type)

    def get_all_registered_agent_types(self) -> list[str]:
        """Zwraca listę wszystkich zarejestrowanych typów agentów."""
        return list(self._agents.keys())


agent_registry = AgentRegistry()
