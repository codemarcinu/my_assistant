import logging
from typing import Any, Dict, Optional

from backend.agents.agent_factory import AgentFactory
from backend.agents.agent_registry import AgentRegistry
from backend.agents.error_types import AgentError, AgentProcessingError
from backend.agents.interfaces import AgentResponse, IntentData, MemoryContext, IAgentRouter

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


class AgentRouter(IAgentRouter):
    def __init__(
        self, agent_factory: AgentFactory, agent_registry: AgentRegistry
    ) -> None:
        self.agent_factory = agent_factory
        self.agent_registry = agent_registry

        # Check if agent classes are registered
        registered_types = self.agent_registry.get_all_registered_agent_types()
        logger.info(f"Registered agent types: {registered_types}")

        # Register intent mappings with the registry
        self.agent_registry.register_intent_to_agent_mapping("cooking", "Chef")
        self.agent_registry.register_intent_to_agent_mapping("weather", "Weather")
        self.agent_registry.register_intent_to_agent_mapping("document", "RAG")
        self.agent_registry.register_intent_to_agent_mapping("image", "OCR")
        self.agent_registry.register_intent_to_agent_mapping(
            "shopping", "Categorization"
        )
        self.agent_registry.register_intent_to_agent_mapping("meal_plan", "MealPlanner")
        self.agent_registry.register_intent_to_agent_mapping("search", "Search")
        self.agent_registry.register_intent_to_agent_mapping("analytics", "Analytics")
        self.agent_registry.register_intent_to_agent_mapping("general", "Chef")

    def register_agent(self, agent_type: str, agent: Any) -> None:
        """Register an agent implementation for a specific type"""
        # This method is required by the orchestrator but not used in this implementation
        # as agents are created dynamically by the factory
        logger.info(f"Agent registration requested for type: {agent_type}")
        pass

    def get_agent(self, agent_type: str) -> None:
        """Get registered agent by type"""
        # This method is required by the orchestrator but not used in this implementation
        # as agents are created dynamically by the factory
        logger.info(f"Agent retrieval requested for type: {agent_type}")
        return None

    def set_fallback_agent(self, agent: Any) -> None:
        """Set fallback agent for unknown intents"""
        # This method is required by the orchestrator but not used in this implementation
        # as agents are created dynamically by the factory
        logger.info("Fallback agent set")
        pass

    async def route_to_agent(
        self, intent: IntentData, context: MemoryContext, user_command: str = ""
    ) -> AgentResponse:
        intent_type = intent.type
        agent_type = self.agent_registry.get_agent_type_for_intent(intent_type)

        try:
            # Walidacja przed utworzeniem agenta
            if agent_type not in self.agent_registry.get_all_registered_agent_types():
                logger.warning(
                    f"Agent type '{agent_type}' not found in factory registry for intent '{intent_type}'. "
                    f"Falling back to default agent 'Chef'."
                )
                agent_type = "Chef"  # Fallback na zawsze dostępny agent

            logger.debug(f"Creating agent: {agent_type}")
            agent = self.agent_factory.create_agent(agent_type)

            if agent is None:
                logger.error(f"Agent factory returned None for type: {agent_type}")
                return AgentResponse(
                    success=False,
                    error="Agent creation failed",
                    text="Przepraszam, wystąpił problem podczas tworzenia agenta."
                )

            logger.debug(f"Agent created successfully: {type(agent)}")

            # Przygotuj dane wejściowe dla agenta
            input_data = {
                "query": user_command,
                "intent": intent.type,
                "entities": intent.entities,
                "confidence": intent.confidence,
                "session_id": context.session_id,
                "context": context.history[-10:] if context.history else [],
            }
            
            logger.debug(f"Processing with agent: {agent_type}")
            response = await agent.process(input_data)

            logger.debug(f"Agent response: {type(response)} - {response}")

            # Upewnij się, że AgentResponse jest właściwie obsługiwany
            if isinstance(response, AgentResponse):
                return response
            else:
                # Jeśli agent zwróci inny typ, opakuj w AgentResponse
                return AgentResponse(
                    success=True,
                    text=str(response) if response else "Brak odpowiedzi",
                    data={"original_response": response}
                )

        except AgentError as e:
            logger.error(
                f"AgentError during processing with agent {agent_type}: {str(e)}",
                exc_info=True,
            )
            return AgentResponse(
                success=False,
                error=f"Error processing request: {str(e)}",
                text="Przepraszam, wystąpił błąd podczas przetwarzania żądania."
            )
        except Exception as e:
            logger.error(
                f"Unexpected error processing request with agent {agent_type}: {str(e)}",
                exc_info=True,
            )
            return AgentResponse(
                success=False,
                error="Przepraszam, wystąpił nieoczekiwany błąd podczas przetwarzania żądania.",
                text="Przepraszam, wystąpił nieoczekiwany błąd podczas przetwarzania żądania."
            )


