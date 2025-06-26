import json
import logging
import re
from datetime import datetime
from typing import Any, Dict, List

from backend.agents.base_agent import BaseAgent
from backend.agents.interfaces import AgentResponse
from backend.core.hybrid_llm_client import hybrid_llm_client

logger = logging.getLogger(__name__)


class ReceiptAnalysisAgent(BaseAgent):
    """Agent odpowiedzialny za analizę danych paragonu po przetworzeniu OCR.

    Ten agent analizuje tekst OCR i wyciąga strukturalne informacje:
    - Nazwa sklepu
    - Data zakupów
    - Produkty z znormalizowanymi nazwami
    - Ilości i jednostki miary
    - Ceny jednostkowe
    - Rabaty/promocje
    - Cena całkowita
    - Kategorie produktowe
    """

    def __init__(
        self,
        name: str = "ReceiptAnalysisAgent",
        error_handler=None,
        fallback_manager=None,
        **kwargs,
    ) -> None:
        super().__init__(
            name=name, error_handler=error_handler, fallback_manager=fallback_manager
        )

    async def process(self, context: Dict[str, Any]) -> AgentResponse:
        """Przetwarza tekst OCR i wyciąga strukturalne dane paragonu"""

        ocr_text = context.get("ocr_text", "")
        if not ocr_text:
            return AgentResponse(
                success=False,
                error="Brak tekstu OCR do analizy",
            )

        logger.info(
            "Rozpoczynam analizę paragonu",
            extra={"text_length": len(ocr_text), "agent_name": self.name},
        )

        # Użyj LLM do analizy tekstu paragonu
        use_bielik = context.get("use_bielik", True)
        model = (
            "SpeakLeash/bielik-11b-v2.3-instruct:Q5_K_M"
            if use_bielik
            else "SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0"
        )

        # Utwórz prompt do analizy paragonu
        prompt = self._create_receipt_analysis_prompt(ocr_text)

        # Wywołaj LLM do analizy
        response = await hybrid_llm_client.chat(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": "Jesteś specjalistycznym asystentem do analizy paragonów z polskich sklepów. Wyciągnij strukturalne dane z tekstu paragonu.",
                },
                {"role": "user", "content": prompt},
            ],
            stream=False,
        )

        if not response or "message" not in response:
            logger.warning("LLM nie zwrócił odpowiedzi, używam fallback parser")
            # Fallback do prostszego parsowania
            receipt_data = self._fallback_parse(ocr_text)
        else:
            # Parsuj odpowiedź LLM aby wyciągnąć strukturalne dane
            content = response["message"]["content"]
            receipt_data = self._parse_llm_response(content)
            
            # Jeśli _parse_llm_response zwrócił None, użyj fallback parsera z oryginalnym OCR
            if receipt_data is None:
                logger.warning("LLM odpowiedź nie zawierała JSON, używam fallback parser")
                receipt_data = self._fallback_parse(ocr_text)

        # Waliduj i popraw wyciągnięte dane
        receipt_data = self._validate_and_fix_data(receipt_data)

        # Zastosuj kategoryzację do produktów
        await self._categorize_products(receipt_data["items"])

        logger.info(
            "Analiza paragonu zakończona",
            extra={
                "store_name": receipt_data.get("store_name"),
                "items_count": len(receipt_data.get("items", [])),
                "total_amount": receipt_data.get("total_amount", 0),
            },
        )

        return AgentResponse(
            success=True,
            text="Paragon został pomyślnie przeanalizowany",
            data=receipt_data,
        )

    def _create_receipt_analysis_prompt(self, ocr_text: str) -> str:
        """Tworzy zaawansowany prompt dla LLM do analizy polskich paragonów"""
        return f"""
        Przeanalizuj poniższy tekst paragonu z polskiego sklepu i wyciągnij strukturalne informacje.

        TEKST PARAGONU:
        ```
        {ocr_text}
        ```

        INSTRUKCJE SPECJALNE:
        - Szukaj nazw sklepów: Lidl, Auchan, Kaufland, Biedronka, Tesco, Carrefour
        - Format daty może być: DD.MM.YYYY, DD-MM-YYYY, YYYY-MM-DD
        - Ceny mogą być w formacie: XX,XX PLN lub XX,XX A/C (gdzie A/C oznacza stawkę VAT)
        - Produkty mogą mieć kody (np. 571950C, 492359C)
        - Uwzględnij rabaty i promocje (słowa kluczowe: "Rabat", "PROMOCJA", "-")
        - Zwróć uwagę na produkty sprzedawane na wagę (kg, gram)

        WYMAGANY FORMAT JSON:
        {{
            "store_name": "nazwa sklepu",
            "store_address": "adres jeśli dostępny",
            "date": "YYYY-MM-DD",
            "time": "HH:MM jeśli dostępny",
            "receipt_number": "numer paragonu jeśli dostępny",
            "items": [
                {{
                    "name": "znormalizowana nazwa produktu",
                    "original_name": "oryginalna nazwa z paragonu",
                    "product_code": "kod produktu jeśli dostępny",
                    "quantity": liczba,
                    "unit": "szt/kg/g/l",
                    "unit_price": cena_jednostkowa,
                    "total_price": cena_końcowa,
                    "vat_rate": "A/B/C lub 23%/8%/5%",
                    "discount": kwota_rabatu_lub_0,
                    "category": "sugerowana kategoria produktu"
                }}
            ],
            "subtotals": {{
                "vat_a_amount": kwota_vat_23_procent,
                "vat_b_amount": kwota_vat_8_procent,
                "vat_c_amount": kwota_vat_5_procent,
                "total_discount": łączna_kwota_rabatów
            }},
            "total_amount": łączna_kwota,
            "payment_method": "sposób płatności jeśli dostępny"
        }}

        Odpowiedz TYLKO danymi JSON, bez dodatkowych komentarzy.
        """

    def _parse_llm_response(self, llm_response: str) -> Dict[str, Any]:
        """Parsuje odpowiedź LLM aby wyciągnąć strukturalne dane paragonu"""

        # Wyciągnij JSON z odpowiedzi (na wypadek gdyby LLM dodał inny tekst)
        json_match = re.search(r"({[\s\S]*})", llm_response)
        if json_match:
            try:
                data = json.loads(json_match.group(1))
                logger.info("Pomyślnie sparsowano JSON z LLM")
                return self._normalize_data_structure(data)
            except json.JSONDecodeError as e:
                logger.warning(f"Błąd parsowania JSON z LLM: {e}")
                # Fallback do prostszego parsowania jeśli JSON jest uszkodzony
                # Używamy oryginalnego tekstu OCR, nie odpowiedzi LLM
                return None  # Zwróć None, żeby process() użył oryginalnego OCR
        else:
            logger.warning("Nie znaleziono JSON w odpowiedzi LLM, używam fallback")
            # Używamy oryginalnego tekstu OCR, nie odpowiedzi LLM
            return None  # Zwróć None, żeby process() użył oryginalnego OCR

    def _normalize_data_structure(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalizuje strukturę danych z LLM"""
        return {
            "store_name": data.get("store_name", "Nieznany sklep"),
            "store_address": data.get("store_address", ""),
            "date": data.get("date", ""),
            "time": data.get("time", ""),
            "receipt_number": data.get("receipt_number", ""),
            "items": data.get("items", []),
            "subtotals": data.get(
                "subtotals",
                {
                    "vat_a_amount": 0,
                    "vat_b_amount": 0,
                    "vat_c_amount": 0,
                    "total_discount": 0,
                },
            ),
            "total_amount": data.get("total_amount", 0.0),
            "payment_method": data.get("payment_method", ""),
        }

    def _fallback_parse(self, text: str) -> Dict[str, Any]:
        """Zaawansowany fallback parser dla polskich paragonów"""
        result = {
            "store_name": "Nieznany sklep",
            "store_address": "",
            "date": "",
            "time": "",
            "receipt_number": "",
            "items": [],
            "subtotals": {
                "vat_a_amount": 0,
                "vat_b_amount": 0,
                "vat_c_amount": 0,
                "total_discount": 0,
            },
            "total_amount": 0.0,
            "payment_method": "",
        }

        # Rozpoznawanie sklepów polskich
        store_patterns = {
            r"lidl": "Lidl",
            r"auchan": "Auchan",
            r"kaufland": "Kaufland",
            r"biedronka": "Biedronka",
            r"tesco": "Tesco",
            r"carrefour": "Carrefour",
        }

        for pattern, store_name in store_patterns.items():
            if re.search(pattern, text, re.IGNORECASE):
                result["store_name"] = store_name
                break

        # Rozpoznawanie dat (różne formaty polskie)
        date_patterns = [
            r"data\s*:\s*(\d{2}[-./]?\d{2}[-./]?\d{4})",
            r"data\s*:\s*(\d{4}[-./]?\d{2}[-./]?\d{2})",
            r"(\d{2}[-./]?\d{2}[-./]?\d{4})",
            r"(\d{4}[-./]?\d{2}[-./]?\d{2})",
            r"(\d{1,2}[-./]?\d{1,2}[-./]?\d{4})",
        ]

        for pattern in date_patterns:
            date_match = re.search(pattern, text, re.IGNORECASE)
            if date_match:
                date_str = date_match.group(1)
                result["date"] = self._normalize_date(date_str)
                break

        # Rozpoznawanie produktów z cenami - rozszerzone wzorce
        item_patterns = [
            # Format z myślnikiem: "MLEKO 3.2% 1L - 4.50 PLN"
            r"([A-ZĄĆĘŁŃÓŚŹŻ][A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż\s]+)\s*-\s*(\d+[,.]?\d*)\s*(?:PLN|zł)?",
            # Format z dwukropkiem: "PRODUKT 1: 10.99 zł"
            r"([A-ZĄĆĘŁŃÓŚŹŻ][A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż\s]+)\s*:\s*(\d+[,.]?\d*)\s*(?:PLN|zł)?",
            # Format z ilością: "PRODUKT 2 x2 - 15.50 PLN"
            r"([A-ZĄĆĘŁŃÓŚŹŻ][A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż\s]+)\s+x?(\d+)\s*-\s*(\d+[,.]?\d*)\s*(?:PLN|zł)?",
            # Format z jednostką: "PRODUKT 3 1szt - 5.00"
            r"([A-ZĄĆĘŁŃÓŚŹŻ][A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż\s]+)\s+(\d+)(?:szt|kg|g|l)?\s*-\s*(\d+[,.]?\d*)",
            # Format z listą: "- ITEM 1: 5.50"
            r"[-•]\s*([A-ZĄĆĘŁŃÓŚŹŻ][A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż\s]+)\s*:\s*(\d+[,.]?\d*)",
            # Standardowy format: "Nazwa produktu 1 * 4,99 4,99 A"
            r"([A-ZĄĆĘŁŃÓŚŹŻ][A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż\s]+)\s+(\d+[,.]?\d*)\s*x?\s*(\d+[,.]?\d*)\s*([A-C]?)",
            # Prosty format: "NAZWA PRODUKTU 3,50"
            r"([A-ZĄĆĘŁŃÓŚŹŻ][A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż\s]{3,30})\s+(\d+[,.]?\d*)\s*([A-C]?)",
        ]

        logger.info(f"Parsing text: {repr(text)}")
        
        for i, pattern in enumerate(item_patterns):
            matches = re.findall(pattern, text, re.MULTILINE | re.IGNORECASE)
            logger.info(f"Pattern {i}: {pattern} - found {len(matches)} matches")
            for match in matches:
                logger.info(f"Match: {match}")
                if len(match) >= 2:
                    # Wyciągnij nazwę produktu (pierwszy element)
                    product_name = match[0].strip()
                    
                    # Filtruj nieprawidłowe nazwy produktów
                    if len(product_name) < 3 or product_name.upper() in ['PLN', 'RAZEM', 'SUMA', 'KONIEC']:
                        logger.info(f"Skipping invalid product name: {product_name}")
                        continue
                    
                    # Wyciągnij cenę (ostatni element z liczbą)
                    price_str = None
                    for j in range(len(match) - 1, 0, -1):
                        if re.match(r'\d+[,.]?\d*', str(match[j])):
                            price_str = str(match[j])
                            break
                    
                    if not price_str:
                        logger.info(f"No price found in match: {match}")
                        continue
                    
                    # Wyciągnij ilość (jeśli jest)
                    quantity = 1.0
                    if len(match) >= 3:
                        try:
                            qty_str = str(match[1])
                            if re.match(r'^\d+$', qty_str):
                                quantity = float(qty_str)
                        except (ValueError, IndexError):
                            pass
                    
                    # Wyciągnij stawkę VAT (jeśli jest)
                    vat_rate = "A"
                    for item in match:
                        if str(item) in ["A", "B", "C"]:
                            vat_rate = str(item)
                            break
                    
                    item = {
                        "name": product_name,
                        "original_name": product_name,
                        "product_code": "",
                        "quantity": quantity,
                        "unit": "szt",
                        "unit_price": float(price_str.replace(",", ".")),
                        "total_price": float(price_str.replace(",", ".")) * quantity,
                        "vat_rate": vat_rate,
                        "discount": 0.0,
                        "category": "",
                    }
                    if isinstance(result["items"], list):
                        result["items"].append(item)
                        logger.info(f"Added item: {product_name} - {price_str}")

        # Rozpoznawanie sumy końcowej - rozszerzone wzorce
        total_patterns = [
            r"suma\s*pln\s*(\d+[,.]?\d*)",
            r"razem\s*pln\s*(\d+[,.]?\d*)",
            r"suma\s*:\s*(\d+[,.]?\d*)\s*(?:PLN|zł)?",
            r"razem\s*:\s*(\d+[,.]?\d*)\s*(?:PLN|zł)?",
            r"koniec\s*:\s*(\d+[,.]?\d*)\s*(?:PLN|zł)?",
            r"razem\s*(\d+[,.]?\d*)",
            r"suma\s*(\d+[,.]?\d*)",
            r"(\d+[,.]?\d*)\s*PLN\s*$",
        ]

        for pattern in total_patterns:
            total_match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if total_match:
                result["total_amount"] = float(total_match.group(1).replace(",", "."))
                break

        # Heurystyka: jeśli nie znaleziono sumy, spróbuj zsumować ceny produktów
        if result["total_amount"] == 0.0 and result["items"]:
            calculated_total = sum(item.get("total_price", 0.0) for item in result["items"])
            if calculated_total > 0:
                result["total_amount"] = calculated_total
                logger.info(f"Obliczono sumę z produktów: {calculated_total}")

        # Heurystyka: jeśli nie znaleziono produktów, spróbuj wyciągnąć z linii z cenami
        if not result["items"]:
            # Szukaj linii z cenami w formacie "NAZWA CENA"
            price_lines = re.findall(r'([A-ZĄĆĘŁŃÓŚŹŻ][A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż\s]{3,30})\s+(\d+[,.]?\d*)', text, re.MULTILINE | re.IGNORECASE)
            for name, price in price_lines:
                # Pomiń linie które wyglądają na sumę
                if re.search(r'(suma|razem|koniec|pln|zł)', name, re.IGNORECASE):
                    continue
                
                item = {
                    "name": name.strip(),
                    "original_name": name.strip(),
                    "product_code": "",
                    "quantity": 1.0,
                    "unit": "szt",
                    "unit_price": float(price.replace(",", ".")),
                    "total_price": float(price.replace(",", ".")),
                    "vat_rate": "A",
                    "discount": 0.0,
                    "category": "",
                }
                result["items"].append(item)

        items_val = result.get("items", [])
        items_count = len(items_val) if isinstance(items_val, list) else 0
        logger.info(f"Fallback parser wyciągnął {items_count} produktów")
        return result

    def _normalize_date(self, date_str: str) -> str:
        """Normalizuje format daty."""
        try:
            # Usuń białe znaki
            date_str = date_str.strip()
            
            # Próba parsowania różnych formatów daty
            formats_to_try = [
                "%d.%m.%Y",    # 15.01.2024
                "%d-%m-%Y",    # 15-01-2024
                "%d/%m/%Y",    # 15/01/2024
                "%Y.%m.%d",    # 2024.01.15
                "%Y-%m-%d",    # 2024-01-15
                "%Y/%m/%d",    # 2024/01/15
                "%d.%m.%y",    # 15.01.24
                "%d-%m-%y",    # 15-01-24
                "%d/%m/%y",    # 15/01/24
                "%Y.%m.%d",    # 2024.01.15
            ]
            
            for fmt in formats_to_try:
                try:
                    return datetime.strptime(date_str, fmt).strftime("%Y-%m-%d")
                except ValueError:
                    continue
            
            # Jeśli żaden format nie pasuje, zwróć oryginalny string
            return date_str
        except Exception:
            return date_str

    def _validate_and_fix_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Waliduje i poprawia wyciągnięte dane paragonu."""
        if "store_name" not in data or not data["store_name"].strip():
            data["store_name"] = "Nieznany Sklep"

        # Normalizacja daty
        if "date" in data and data["date"]:
            data["date"] = self._normalize_date(data["date"])

        # Upewnij się, że 'items' jest listą
        if "items" not in data or not isinstance(data["items"], list):
            data["items"] = []

        # Walidacja i poprawa pozycji
        for item in data["items"]:
            if "name" not in item or not item["name"].strip():
                item["name"] = "Nieznany Produkt"
            if "quantity" in item:
                try:
                    item["quantity"] = float(str(item["quantity"]).replace(",", "."))
                except ValueError:
                    item["quantity"] = 0.0
            if "unit_price" in item:
                try:
                    item["unit_price"] = float(
                        str(item["unit_price"]).replace(",", ".")
                    )
                except ValueError:
                    item["unit_price"] = 0.0
            if "total_price" in item:
                try:
                    item["total_price"] = float(
                        str(item["total_price"]).replace(",", ".")
                    )
                except ValueError:
                    item["total_price"] = 0.0

        # Normalizacja sum i rabatów
        if "total_amount" in data:
            try:
                data["total_amount"] = float(
                    str(data["total_amount"]).replace(",", ".")
                )
            except ValueError:
                data["total_amount"] = 0.0

        if "subtotals" in data and isinstance(data["subtotals"], dict):
            for key in [
                "vat_a_amount",
                "vat_b_amount",
                "vat_c_amount",
                "total_discount",
            ]:
                if key in data["subtotals"]:
                    try:
                        data["subtotals"][key] = float(
                            str(data["subtotals"][key]).replace(",", ".")
                        )
                    except ValueError:
                        data["subtotals"][key] = 0.0

        return data

    async def _categorize_products(self, items: List[Dict[str, Any]]) -> None:
        """Kategoryzuje produkty przy użyciu LLM."""
        if not items:
            return

        product_names = [item["name"] for item in items if "name" in item]
        if not product_names:
            return

        products_to_categorize = ", ".join(product_names)

        categorization_prompt = f"""
        Podaj kategorie dla poniższych produktów. Zwróć tylko listę kategorii, po jednej na produkt, w kolejności.
        Przykładowe kategorie: Owoce, Warzywa, Nabiał, Mięso, Pieczywo, Napoje, Słodycze, Chemia domowa, Kosmetyki, Inne.

        Produkty: {products_to_categorize}

        Odpowiedź (tylko lista kategorii oddzielona przecinkami, bez dodatkowego tekstu):
        """
        try:
            response = await hybrid_llm_client.chat(
                model="SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0",
                messages=[
                    {
                        "role": "system",
                        "content": "Jesteś ekspertem od kategoryzacji produktów spożywczych.",
                    },
                    {"role": "user", "content": categorization_prompt},
                ],
                stream=False,
                max_tokens=100,
            )
            categories_str = response.get("message", {}).get("content", "").strip()
            categories = [
                cat.strip() for cat in categories_str.split(",") if cat.strip()
            ]

            for i, item in enumerate(items):
                if i < len(categories):
                    item["category"] = categories[i]
                else:
                    item["category"] = "Inne"
        except Exception as e:
            logger.error(f"Błąd podczas kategoryzacji produktów: {e}")
            for item in items:
                item["category"] = "Nieznana"
