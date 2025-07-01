"""
Receipt Categorization Agent - taguje pozycje z użyciem LLM-a i słownika GUS
Zgodnie z rekomendacjami audytu - single responsibility principle
"""

import logging
from typing import Any, Dict, List, Union
from pydantic import BaseModel, ValidationError

from backend.agents.base_agent import BaseAgent
from backend.agents.interfaces import AgentResponse
from backend.core.hybrid_llm_client import hybrid_llm_client
from backend.core.product_categorizer import ProductCategorizer

logger = logging.getLogger(__name__)


class ReceiptCategorizationInput(BaseModel):
    """Model wejściowy dla ReceiptCategorizationAgent."""
    items: List[Dict[str, Any]]
    store_name: str = ""
    use_llm: bool = True


class CategorizationResult(BaseModel):
    """Wynik kategoryzacji produktów."""
    categorized_items: List[Dict[str, Any]]
    categories_used: List[str]
    confidence_scores: Dict[str, float]
    llm_used: bool


class ReceiptCategorizationAgent(BaseAgent):
    """
    Agent kategoryzacji paragonów - taguje pozycje z użyciem LLM-a + słownika GUS.
    
    Zgodnie z zasadą single responsibility:
    - Kategoryzacja produktów spożywczych
    - Kategoryzacja chemii gospodarczej
    - Użycie LLM-a + słownika GUS
    - Mapowanie na Google Product Taxonomy
    """

    def __init__(
        self,
        name: str = "ReceiptCategorizationAgent",
        error_handler: Any = None,
        fallback_manager: Any = None,
        **kwargs: Any,
    ) -> None:
        """Inicjalizuje ReceiptCategorizationAgent."""
        super().__init__(
            name=name, error_handler=error_handler, fallback_manager=fallback_manager
        )
        self.product_categorizer = ProductCategorizer()
        self.use_llm = kwargs.get("use_llm", True)
        self.fallback_to_dict = kwargs.get("fallback_to_dict", True)

    @handle_exceptions(max_retries=1, retry_delay=0.5)
    async def process(
        self, input_data: Union[ReceiptCategorizationInput, Dict[str, Any]]
    ) -> AgentResponse:
        """
        Kategoryzuje produkty z paragonu.

        Args:
            input_data: Dane wejściowe z produktami do kategoryzacji

        Returns:
            AgentResponse: Odpowiedź z skategoryzowanymi produktami
        """
        try:
            if not isinstance(input_data, ReceiptCategorizationInput):
                input_data = ReceiptCategorizationInput.model_validate(input_data)
        except ValidationError as ve:
            return AgentResponse(
                success=False,
                error=f"Błąd walidacji danych wejściowych: {ve}",
            )

        items: List[Dict[str, Any]] = input_data.items
        store_name: str = input_data.store_name
        use_llm: bool = input_data.use_llm

        try:
            logger.info(f"Rozpoczynam kategoryzację {len(items)} produktów")

            if not items:
                return AgentResponse(
                    success=False,
                    error="Brak produktów do kategoryzacji",
                )

            # Step 1: Przygotuj dane do kategoryzacji
            items_for_categorization = self._prepare_items_for_categorization(items)

            # Step 2: Kategoryzacja z LLM (jeśli włączona)
            categorized_items = []
            llm_used = False
            
            if use_llm:
                try:
                    categorized_items = await self._categorize_with_llm(items_for_categorization, store_name)
                    llm_used = True
                    logger.info("Kategoryzacja z LLM zakończona pomyślnie")
                except Exception as e:
                    logger.warning(f"Błąd kategoryzacji z LLM: {e}, używam fallback")
                    if self.fallback_to_dict:
                        categorized_items = await self._categorize_with_dictionary(items_for_categorization)
                    else:
                        categorized_items = items_for_categorization
            else:
                # Użyj tylko słownika
                categorized_items = await self._categorize_with_dictionary(items_for_categorization)

            # Step 3: Mapowanie na Google Product Taxonomy
            categorized_items = await self._map_to_google_taxonomy(categorized_items)

            # Step 4: Oblicz confidence scores
            confidence_scores = self._calculate_confidence_scores(categorized_items)

            # Step 5: Przygotuj wynik
            categories_used = list(set(item.get("category", "unknown") for item in categorized_items))
            
            categorization_result = CategorizationResult(
                categorized_items=categorized_items,
                categories_used=categories_used,
                confidence_scores=confidence_scores,
                llm_used=llm_used
            )

            logger.info(
                "Kategoryzacja paragonu zakończona",
                extra={
                    "items_count": len(categorized_items),
                    "categories_count": len(categories_used),
                    "llm_used": llm_used,
                    "avg_confidence": sum(confidence_scores.values()) / len(confidence_scores) if confidence_scores else 0
                }
            )

            return AgentResponse(
                success=True,
                text=f"Pomyślnie skategoryzowano {len(categorized_items)} produktów",
                data=categorization_result.dict(),
                message="Kategoryzacja produktów zakończona",
                metadata={
                    "items_categorized": len(categorized_items),
                    "categories_used": len(categories_used),
                    "llm_used": llm_used,
                    "processing_stage": "categorization"
                },
            )

        except Exception as e:
            logger.error(f"Błąd podczas kategoryzacji paragonu: {str(e)}")
            return AgentResponse(
                success=False,
                error=f"Wystąpił błąd podczas kategoryzacji: {str(e)}",
            )

    def _prepare_items_for_categorization(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Przygotowuje produkty do kategoryzacji."""
        prepared_items = []
        
        for item in items:
            prepared_item = {
                "name": item.get("name", "").strip(),
                "original_name": item.get("name", ""),
                "quantity": item.get("quantity", 1),
                "unit": item.get("unit", ""),
                "price": item.get("price", 0.0),
                "category": "unknown",
                "confidence": 0.0
            }
            
            if prepared_item["name"]:
                prepared_items.append(prepared_item)
        
        return prepared_items

    async def _categorize_with_llm(self, items: List[Dict[str, Any]], store_name: str) -> List[Dict[str, Any]]:
        """Kategoryzuje produkty z użyciem LLM."""
        try:
            # Przygotuj prompt dla LLM
            prompt = self._create_categorization_prompt(items, store_name)
            
            # Wywołaj LLM
            response = await hybrid_llm_client.chat(
                model="SpeakLeash/bielik-11b-v2.3-instruct:Q5_K_M",
                messages=[
                    {
                        "role": "system",
                        "content": "Jesteś ekspertem od kategoryzacji produktów spożywczych i chemii gospodarczej. Kategoryzuj produkty zgodnie z polskimi standardami."
                    },
                    {"role": "user", "content": prompt}
                ],
                stream=False,
            )

            if not response or "message" not in response:
                raise Exception("LLM nie zwrócił odpowiedzi")

            # Parsuj odpowiedź LLM
            categorized_items = self._parse_llm_categorization_response(response["message"]["content"], items)
            
            return categorized_items

        except Exception as e:
            logger.error(f"Błąd kategoryzacji z LLM: {e}")
            raise

    def _create_categorization_prompt(self, items: List[Dict[str, Any]], store_name: str) -> str:
        """Tworzy prompt dla LLM do kategoryzacji."""
        items_text = "\n".join([
            f"- {item['name']} (ilość: {item['quantity']}, cena: {item['price']} zł)"
            for item in items
        ])

        prompt = f"""Kategoryzuj poniższe produkty z paragonu ze sklepu "{store_name}".
        
Produkty:
{items_text}

Kategorie do użycia:
- pieczywo (chleb, bułki, ciastka)
- nabiał (mleko, ser, jogurt, masło)
- mięso (wędliny, mięso świeże, konserwy)
- warzywa (świeże warzywa, owoce)
- napoje (woda, soki, napoje gazowane)
- słodycze (cukierki, czekolada, lody)
- chemia (proszki, płyny, kosmetyki)
- alkohol (piwo, wino, wódka)
- inne

Zwróć JSON w formacie:
{{
  "categorized_items": [
    {{
      "name": "nazwa produktu",
      "category": "kategoria",
      "confidence": 0.95
    }}
  ]
}}

Zwróć tylko JSON, bez dodatkowych komentarzy."""

        return prompt

    def _parse_llm_categorization_response(self, response: str, original_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Parsuje odpowiedź LLM z kategoryzacją."""
        try:
            import json
            import re
            
            # Wyciągnij JSON z odpowiedzi
            json_match = re.search(r'\{[\s\S]*\}', response)
            if not json_match:
                raise Exception("Nie znaleziono JSON w odpowiedzi LLM")
            
            data = json.loads(json_match.group(0))
            categorized_items = data.get("categorized_items", [])
            
            # Mapuj wyniki na oryginalne produkty
            result = []
            for original_item in original_items:
                # Znajdź odpowiadający skategoryzowany produkt
                categorized_item = next(
                    (item for item in categorized_items if item.get("name", "").lower() in original_item["name"].lower()),
                    None
                )
                
                if categorized_item:
                    result.append({
                        **original_item,
                        "category": categorized_item.get("category", "unknown"),
                        "confidence": categorized_item.get("confidence", 0.5)
                    })
                else:
                    result.append({
                        **original_item,
                        "category": "unknown",
                        "confidence": 0.0
                    })
            
            return result
            
        except Exception as e:
            logger.warning(f"Błąd parsowania odpowiedzi LLM: {e}")
            # Zwróć oryginalne produkty bez kategoryzacji
            return original_items

    async def _categorize_with_dictionary(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Kategoryzuje produkty z użyciem słownika."""
        try:
            categorized_items = []
            
            for item in items:
                category, confidence = await self.product_categorizer.categorize_product(item["name"])
                
                categorized_items.append({
                    **item,
                    "category": category,
                    "confidence": confidence
                })
            
            return categorized_items
            
        except Exception as e:
            logger.warning(f"Błąd kategoryzacji ze słownikiem: {e}")
            # Zwróć oryginalne produkty bez kategoryzacji
            return items

    async def _map_to_google_taxonomy(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Mapuje kategorie na Google Product Taxonomy."""
        try:
            # Podstawowe mapowanie polskich kategorii na Google Product Taxonomy
            category_mapping = {
                "pieczywo": "Food & Beverage > Food Items > Bread & Baked Goods",
                "nabiał": "Food & Beverage > Food Items > Dairy Products",
                "mięso": "Food & Beverage > Food Items > Meat & Seafood",
                "warzywa": "Food & Beverage > Food Items > Fruits & Vegetables",
                "napoje": "Food & Beverage > Beverages",
                "słodycze": "Food & Beverage > Food Items > Candy & Sweets",
                "chemia": "Home & Garden > Household Supplies > Cleaning Products",
                "alkohol": "Food & Beverage > Beverages > Alcoholic Beverages",
                "inne": "Food & Beverage > Food Items"
            }
            
            for item in items:
                polish_category = item.get("category", "inne")
                google_category = category_mapping.get(polish_category, "Food & Beverage > Food Items")
                item["google_category"] = google_category
            
            return items
            
        except Exception as e:
            logger.warning(f"Błąd mapowania na Google Taxonomy: {e}")
            return items

    def _calculate_confidence_scores(self, items: List[Dict[str, Any]]) -> Dict[str, float]:
        """Oblicza confidence scores dla kategoryzacji."""
        confidence_scores = {}
        
        for item in items:
            item_name = item.get("name", "unknown")
            confidence = item.get("confidence", 0.0)
            confidence_scores[item_name] = confidence
        
        return confidence_scores

    def get_metadata(self) -> Dict[str, Any]:
        """Zwraca metadane agenta."""
        return {
            "name": self.name,
            "type": "ReceiptCategorizationAgent",
            "capabilities": ["product categorization", "LLM integration", "Google taxonomy mapping"],
            "version": "1.0",
            "processing_stage": "categorization",
            "use_llm": self.use_llm
        }

    def get_dependencies(self) -> list:
        """Lista zależności agenta."""
        return []

    def is_healthy(self) -> bool:
        """Sprawdza czy agent jest zdrowy."""
        return True 