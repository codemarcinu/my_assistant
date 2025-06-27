import asyncio
import pytest
from backend.core.model_fallback_manager import ModelFallbackManager, ModelUnavailableError

@pytest.mark.asyncio
async def test_model_fallback_and_recovery():
    mgr = ModelFallbackManager()
    # Początkowo wszystkie modele dostępne
    model = await mgr.get_working_model()
    assert model == "bielik:11b-q4_k_m"

    # Symuluj awarię głównego modelu
    mgr.failed_models.add("bielik:11b-q4_k_m")
    model = await mgr.get_working_model()
    assert model == "mistral:7b"

    # Symuluj awarię wszystkich modeli
    mgr.failed_models.update(["mistral:7b", "gemma3:12b"])
    with pytest.raises(ModelUnavailableError):
        await mgr.get_working_model()

    # Recovery: przywróć model
    mgr.failed_models.remove("mistral:7b")
    model = await mgr.get_working_model()
    assert model == "mistral:7b" 