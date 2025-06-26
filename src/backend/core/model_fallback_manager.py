import asyncio
import logging
from typing import List, Set, Optional

logger = logging.getLogger(__name__)

class ModelUnavailableError(Exception):
    """Raised when all LLM models are unavailable."""
    pass

class ModelFallbackManager:
    """
    Manages LLM model selection with automatic fallback and health checks.
    Primary: bielik:11b-q4_k_m, Fallbacks: mistral:7b, gemma3:12b
    """
    def __init__(self, health_check_interval: float = 30.0) -> None:
        self.models: List[str] = [
            "bielik:11b-q4_k_m",
            "mistral:7b",
            "gemma3:12b"
        ]
        self.failed_models: Set[str] = set()
        self._lock = asyncio.Lock()
        self.health_check_interval = health_check_interval
        self._health_task: Optional[asyncio.Task] = None

    async def get_working_model(self) -> str:
        """
        Returns the first available model, performing health check if needed.
        Raises ModelUnavailableError if none are available.
        """
        async with self._lock:
            for model in self.models:
                if model not in self.failed_models:
                    try:
                        await self.test_model_health(model)
                        return model
                    except Exception:
                        logger.warning(f"Model {model} failed health check.")
                        self.failed_models.add(model)
            raise ModelUnavailableError("Wszystkie modele LLM niedostępne")

    async def test_model_health(self, model: str) -> None:
        """
        Checks if the model is available. Raises on failure.
        Replace this stub with actual health check logic (e.g. HTTP call).
        """
        # TODO: Replace with real health check (e.g. HTTP/gRPC ping)
        await asyncio.sleep(0.1)  # Simulate network delay
        if model in self.failed_models:
            raise RuntimeError(f"Model {model} is marked as failed.")

    async def periodic_health_check(self) -> None:
        """
        Periodically checks health of all models and updates failed_models set.
        Should be run as a background task.
        """
        while True:
            async with self._lock:
                for model in self.models:
                    try:
                        await self.test_model_health(model)
                        if model in self.failed_models:
                            self.failed_models.remove(model)
                            logger.info(f"Model {model} recovered.")
                    except Exception:
                        self.failed_models.add(model)
                        logger.warning(f"Model {model} is unavailable.")
            await asyncio.sleep(self.health_check_interval)

    def start_health_check_loop(self) -> None:
        """
        Starts the periodic health check in the background.
        """
        if not self._health_task or self._health_task.done():
            self._health_task = asyncio.create_task(self.periodic_health_check())

    def stop_health_check_loop(self) -> None:
        """
        Stops the periodic health check loop.
        """
        if self._health_task:
            self._health_task.cancel() 