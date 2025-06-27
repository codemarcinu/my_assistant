from typing import Any, Dict

from backend.core.crud import get_summary
from backend.agents.base_agent import BaseAgent
from backend.agents.interfaces import AgentResponse


class AnalyticsAgent(BaseAgent):
    def __init__(
        self,
        name: str = "AnalyticsAgent",
        error_handler: Any = None,
        fallback_manager: Any = None,
        **kwargs: Any
    ) -> None:
        super().__init__(
            name=name, error_handler=error_handler, fallback_manager=fallback_manager
        )

    async def process(self, context: Dict[str, Any]) -> AgentResponse:
        db = context["db"]
        query_params = context["query_params"]

        summary = await get_summary(db, query_params)

        return AgentResponse(
            text="Analytics generated.",
            data={"summary": summary},
            success=True,
        )
