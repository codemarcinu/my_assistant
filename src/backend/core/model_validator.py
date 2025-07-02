"""
Moduł do walidacji dostępności modeli Ollama
"""

import asyncio
import logging
from typing import List, Dict, Optional
import httpx

from backend.settings import settings

logger = logging.getLogger(__name__)


class OllamaModelValidator:
    """Walidator dostępności modeli Ollama"""
    
    def __init__(self, ollama_url: str = None):
        self.ollama_url = ollama_url or settings.OLLAMA_URL
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def check_ollama_connection(self) -> bool:
        """Sprawdza połączenie z Ollama"""
        try:
            response = await self.client.get(f"{self.ollama_url}/api/tags")
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Błąd połączenia z Ollama: {e}")
            return False
    
    async def get_available_models(self) -> List[str]:
        """Zwraca listę dostępnych modeli"""
        try:
            response = await self.client.get(f"{self.ollama_url}/api/tags")
            if response.status_code == 200:
                data = response.json()
                return [model["name"] for model in data.get("models", [])]
            return []
        except Exception as e:
            logger.error(f"Błąd pobierania modeli: {e}")
            return []
    
    async def validate_model(self, model_name: str) -> bool:
        """Sprawdza czy model jest dostępny"""
        try:
            # Sprawdź czy model istnieje
            response = await self.client.post(
                f"{self.ollama_url}/api/show",
                json={"name": model_name}
            )
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Błąd walidacji modelu {model_name}: {e}")
            return False
    
    async def validate_required_models(self) -> Dict[str, bool]:
        """Waliduje wszystkie wymagane modele"""
        results = {}
        
        # Sprawdź połączenie
        if not await self.check_ollama_connection():
            logger.error("Brak połączenia z Ollama")
            return {model: False for model in settings.AVAILABLE_MODELS}
        
        # Sprawdź każdy model
        for model in settings.AVAILABLE_MODELS:
            results[model] = await self.validate_model(model)
            if results[model]:
                logger.info(f"✅ Model {model} jest dostępny")
            else:
                logger.warning(f"❌ Model {model} nie jest dostępny")
        
        return results
    
    async def get_fallback_model(self) -> Optional[str]:
        """Zwraca pierwszy dostępny model jako fallback"""
        available_models = await self.get_available_models()
        
        for model in settings.AVAILABLE_MODELS:
            if model in available_models:
                return model
        
        return None
    
    async def close(self):
        """Zamyka klienta HTTP"""
        await self.client.aclose()


async def validate_ollama_models() -> Dict[str, bool]:
    """Funkcja pomocnicza do walidacji modeli"""
    validator = OllamaModelValidator()
    try:
        return await validator.validate_required_models()
    finally:
        await validator.close()


async def get_working_model() -> Optional[str]:
    """Zwraca pierwszy działający model"""
    validator = OllamaModelValidator()
    try:
        return await validator.get_fallback_model()
    finally:
        await validator.close()


if __name__ == "__main__":
    # Test walidacji modeli
    async def test():
        print("🔍 Sprawdzanie modeli Ollama...")
        results = await validate_ollama_models()
        
        print("\n📊 Wyniki walidacji:")
        for model, available in results.items():
            status = "✅" if available else "❌"
            print(f"{status} {model}")
        
        working_model = await get_working_model()
        if working_model:
            print(f"\n🎯 Działający model: {working_model}")
        else:
            print("\n❌ Brak dostępnych modeli!")
    
    asyncio.run(test()) 