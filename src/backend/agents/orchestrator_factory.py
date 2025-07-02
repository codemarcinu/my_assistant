import logging
import os
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from backend.agents.router_service import AgentRouter
from backend.agents.intent_detector import SimpleIntentDetector
from backend.agents.memory_manager import MemoryManager
from backend.agents.orchestrator import Orchestrator
from backend.agents.response_generator import ResponseGenerator
from backend.core.profile_manager import ProfileManager

from backend.agents.agent_factory import AgentFactory
from backend.agents.agent_registry import AgentRegistry
from backend.agents.receipt_analysis_agent import ReceiptAnalysisAgent
from backend.agents.interfaces import AgentType


def create_orchestrator(db: AsyncSession) -> Orchestrator:
    """
    Fabryka tworząca instancję Orchestrator z wymaganymi zależnościami.

    Args:
        db: Sesja bazy danych (AsyncSession)

    Returns:
        Instancja Orchestrator
    """
    logger = logging.getLogger(__name__)

    # Utwórz menedżer profilów
    profile_manager = ProfileManager(db)
    logger.debug("ProfileManager created")

    # Utwórz detektor intencji
    intent_detector = SimpleIntentDetector()
    logger.debug("SimpleIntentDetector created")

    # Utwórz rejestr agentów i fabrykę
    config_file = os.path.join(os.path.dirname(__file__), "../data/config/agent_config.json")
    agent_registry = AgentRegistry(config_file=config_file)
    agent_factory = AgentFactory(agent_registry=agent_registry)
    logger.debug("AgentRegistry and AgentFactory created")

    # Utwórz router agentów z fabryką
    agent_router = AgentRouter(agent_factory, agent_registry)
    logger.debug("AgentRouter created with factory")

    # Utwórz menedżera pamięci
    memory_manager = MemoryManager()
    logger.debug("MemoryManager created")

    # Utwórz generator odpowiedzi
    response_generator = ResponseGenerator()
    logger.debug("ResponseGenerator created")

    # Utwórz i zwróć orchestrator
    orchestrator = Orchestrator(
        db_session=db,
        profile_manager=profile_manager,
        intent_detector=intent_detector,
        agent_router=agent_router,
        memory_manager=memory_manager,
        response_generator=response_generator,
    )
    logger.debug("Orchestrator created successfully")

    return orchestrator
