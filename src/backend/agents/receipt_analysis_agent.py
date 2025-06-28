import json
import logging
import re
from datetime import datetime
from typing import Any, Dict, List

from backend.agents.base_agent import BaseAgent
from backend.agents.interfaces import AgentResponse
from backend.core.hybrid_llm_client import hybrid_llm_client
from backend.core.product_categorizer import ProductCategorizer
from backend.core.store_normalizer import StoreNormalizer
from backend.core.product_name_normalizer import ProductNameNormalizer

logger = logging.getLogger(__name__)


class ReceiptAnalysisAgent(BaseAgent):
    """Agent odpowiedzialny za analizę danych paragonu po przetworzeniu OCR.

    Ten agent analizuje tekst OCR i wyciąga strukturalne informacje:
    - Nazwa sklepu (znormalizowana)
    - Data zakupów
    - Produkty z znormalizowanymi nazwami
    - Ilości i jednostki miary
    - Ceny jednostkowe
    - Rabaty/promocje
    - Cena całkowita
    - Kategorie produktowe z Google Product Taxonomy
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
        # Inicjalizuj kategoryzator produktów, normalizator sklepów i normalizator nazw produktów
        self.product_categorizer = ProductCategorizer()
        self.store_normalizer = StoreNormalizer()
        self.product_name_normalizer = ProductNameNormalizer()

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

        # Znormalizuj nazwę sklepu
        self._normalize_store_name(receipt_data)

        # Znormalizuj nazwy produktów
        self._normalize_product_names(receipt_data["items"])

        # Zastosuj zaawansowaną kategoryzację do produktów z Google Product Taxonomy
        await self._categorize_products_advanced(receipt_data["items"])

        logger.info(
            "Analiza paragonu zakończona",
            extra={
                "store_name": receipt_data.get("store_name"),
                "normalized_store": receipt_data.get("normalized_store_name"),
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
        """Tworzy specjalizowany prompt dla LLM do analizy polskich paragonów zgodnie ze specyfikacją"""
        
        system_prompt = """You are ReceiptAnalysisAgent.  
Your task:  
1. Przyjąć jako input oczyszczony tekst z OCRAgent.  
2. Rozpoznać i wyodrębnić następujące pola:  
   - store: nazwa sklepu,  
   - address: pełny adres sklepu,  
   - date: data i godzina zakupu w formacie YYYY-MM-DD HH:MM,  
   - items: lista pozycji (każdy obiekt ma: name, quantity (liczba), unit_price, total_price, tax_category ('A', 'B', 'C' itp.)),  
   - discounts: lista rabatów (description, amount),  
   - coupons: lista kuponów (code, amount),  
   - vat_summary: podsumowanie sprzedaży po stawkach (tax_category, net, tax_amount, gross),  
   - total: suma do zapłaty.  
3. Ujednolicić format waluty na liczbę zmiennoprzecinkową (np. 26.34).  
4. Zwrócić wynik jako czyste JSON z tymi kluczami.  
Nie generuj żadnego dodatkowego komentarza ani tekstu."""

        user_prompt = f"""Analizuj poniższy tekst paragonu i wypisz wynik w JSON:

{ocr_text}

Wyjście ma mieć dokładnie taką strukturę:

{{
  "store": "",
  "address": "",
  "date": "",
  "items": [
    {{
      "name": "",
      "quantity": 0.0,
      "unit_price": 0.0,
      "total_price": 0.0,
      "tax_category": ""
    }}
  ],
  "discounts": [
    {{
      "description": "",
      "amount": 0.0
    }}
  ],
  "coupons": [
    {{
      "code": "",
      "amount": 0.0
    }}
  ],
  "vat_summary": [
    {{
      "tax_category": "",
      "net": 0.0,
      "tax_amount": 0.0,
      "gross": 0.0
    }}
  ],
  "total": 0.0
}}"""

        return f"{system_prompt}\n\n{user_prompt}"

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
        """Normalizuje strukturę danych z LLM zgodnie z nowym formatem JSON"""
        return {
            "store_name": data.get("store", "Nieznany sklep"),
            "store_address": data.get("address", ""),
            "date": data.get("date", ""),
            "time": data.get("time", ""),
            "receipt_number": data.get("receipt_number", ""),
            "items": self._normalize_items(data.get("items", [])),
            "discounts": data.get("discounts", []),
            "coupons": data.get("coupons", []),
            "vat_summary": data.get("vat_summary", []),
            "subtotals": self._calculate_subtotals(data.get("vat_summary", [])),
            "total_amount": data.get("total", 0.0),
            "payment_method": data.get("payment_method", ""),
        }

    def _normalize_items(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Normalizuje strukturę produktów z nowego formatu na stary"""
        normalized_items = []
        for item in items:
            normalized_item = {
                "name": item.get("name", ""),
                "original_name": item.get("name", ""),
                "product_code": item.get("product_code", ""),
                "quantity": item.get("quantity", 1.0),
                "unit": item.get("unit", "szt"),
                "unit_price": item.get("unit_price", 0.0),
                "total_price": item.get("total_price", 0.0),
                "vat_rate": item.get("tax_category", "A"),
                "discount": item.get("discount", 0.0),
                "category": item.get("category", ""),
            }
            normalized_items.append(normalized_item)
        return normalized_items

    def _calculate_subtotals(self, vat_summary: List[Dict[str, Any]]) -> Dict[str, float]:
        """Oblicza subtotals na podstawie vat_summary"""
        subtotals = {
            "vat_a_amount": 0.0,
            "vat_b_amount": 0.0,
            "vat_c_amount": 0.0,
            "total_discount": 0.0,
        }
        
        for vat_item in vat_summary:
            tax_category = vat_item.get("tax_category", "").upper()
            tax_amount = vat_item.get("tax_amount", 0.0)
            
            if tax_category == "A":
                subtotals["vat_a_amount"] += tax_amount
            elif tax_category == "B":
                subtotals["vat_b_amount"] += tax_amount
            elif tax_category == "C":
                subtotals["vat_c_amount"] += tax_amount
        
        return subtotals

    def _fallback_parse(self, text: str) -> Dict[str, Any]:
        """Zaawansowany fallback parser dla polskich paragonów (ulepszony)"""
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

        # Rozpoznawanie adresu sklepu (NIP, adres, kod pocztowy)
        address_patterns = [
            r"NIP[:\s]+([0-9\-]+)",
            r"Adres[:\s]+([A-Za-z0-9\s\.,\-]+)",
            r"([0-9]{2}-[0-9]{3}\s+[A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż\s]+)",
            r"ul\.\s*[A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż\s]+\d+[A-Za-z]?",
        ]
        for pattern in address_patterns:
            address_match = re.search(pattern, text, re.IGNORECASE)
            if address_match:
                result["store_address"] = address_match.group(0).strip()
                break

        # Rozpoznawanie dat (różne formaty polskie)
        date_patterns = [
            r"data\s*[:\-]?\s*(\d{2}[-./]?\d{2}[-./]?\d{4})",
            r"data\s*[:\-]?\s*(\d{4}[-./]?\d{2}[-./]?\d{2})",
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

        # Rozpoznawanie sekcji rabatów/kuponów
        coupon_patterns = [
            r"wykorzystane kupony[\s\S]{0,100}",
            r"rabat[\s\S]{0,100}",
            r"kupon[\s\S]{0,100}",
        ]
        coupons = []
        for pattern in coupon_patterns:
            for match in re.findall(pattern, text, re.IGNORECASE):
                coupons.append(match.strip())
        if coupons:
            result["coupons"] = coupons

        # Rozpoznawanie produktów z cenami - rozszerzone wzorce
        item_patterns = [
            r"([A-ZĄĆĘŁŃÓŚŹŻ][A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż\s]+)\s*-\s*(\d+[,.]?\d*)\s*(?:PLN|zł)?",
            r"([A-ZĄĆĘŁŃÓŚŹŻ][A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż\s]+)\s*:\s*(\d+[,.]?\d*)\s*(?:PLN|zł)?",
            r"([A-ZĄĆĘŁŃÓŚŹŻ][A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż\s]+)\s+x?(\d+)\s*-\s*(\d+[,.]?\d*)\s*(?:PLN|zł)?",
            r"([A-ZĄĆĘŁŃÓŚŹŻ][A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż\s]+)\s+(\d+)(?:szt|kg|g|l)?\s*-\s*(\d+[,.]?\d*)",
            r"[-•]\s*([A-ZĄĆĘŁŃÓŚŹŻ][A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż\s]+)\s*:\s*(\d+[,.]?\d*)",
            r"([A-ZĄĆĘŁŃÓŚŹŻ][A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż\s]+)\s+(\d+[,.]?\d*)\s*x?\s*(\d+[,.]?\d*)\s*([A-C]?)",
            r"([A-ZĄĆĘŁŃÓŚŹŻ][A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż\s]{3,30})\s+(\d+[,.]?\d*)\s*([A-C]?)",
        ]
        logger.info(f"Parsing text: {repr(text)}")
        for i, pattern in enumerate(item_patterns):
            matches = re.findall(pattern, text, re.MULTILINE | re.IGNORECASE)
            logger.info(f"Pattern {i}: {pattern} - found {len(matches)} matches")
            for match in matches:
                logger.info(f"Match: {match}")
                if len(match) >= 2:
                    product_name = match[0].strip()
                    if len(product_name) < 3 or product_name.upper() in ['PLN', 'RAZEM', 'SUMA', 'KONIEC']:
                        logger.info(f"Skipping invalid product name: {product_name}")
                        continue
                    price_str = None
                    for j in range(len(match) - 1, 0, -1):
                        if re.match(r'\d+[,.]?\d*', str(match[j])):
                            price_str = str(match[j])
                            break
                    if not price_str:
                        logger.info(f"No price found in match: {match}")
                        continue
                    quantity = 1.0
                    if len(match) >= 3:
                        try:
                            qty_str = str(match[1])
                            if re.match(r'^\d+$', qty_str):
                                quantity = float(qty_str)
                        except (ValueError, IndexError):
                            pass
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
            r"razem\s*:\s*(\d+[,.]?\d*)\s*(?:PLN|zł)?",
            r"suma\s*:\s*(\d+[,.]?\d*)\s*(?:PLN|zł)?",
            r"razem\s*pln\s*(\d+[,.]?\d*)",
            r"suma\s*pln\s*(\d+[,.]?\d*)",
            r"koniec\s*:\s*(\d+[,.]?\d*)\s*(?:PLN|zł)?",
            r"razem\s*(\d+[,.]?\d*)",
            r"suma\s*(\d+[,.]?\d*)",
            r"(\d+[,.]?\d*)\s*PLN\s*$",
            r"RAZEM\s*[-:]?\s*(\d+[,.]?\d*)",
            r"SUMA\s*[-:]?\s*(\d+[,.]?\d*)",
        ]
        for pattern in total_patterns:
            total_match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if total_match:
                result["total_amount"] = float(total_match.group(1).replace(",", "."))
                break
        if result["total_amount"] == 0.0 and result["items"]:
            calculated_total = sum(item.get("total_price", 0.0) for item in result["items"])
            if calculated_total > 0:
                result["total_amount"] = calculated_total
                logger.info(f"Obliczono sumę z produktów: {calculated_total}")
        if not result["items"]:
            price_lines = re.findall(r'([A-ZĄĆĘŁŃÓŚŹŻ][A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż\s]{3,30})\s+(\d+[,.]?\d*)', text, re.MULTILINE | re.IGNORECASE)
            for name, price in price_lines:
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

    async def _categorize_products_advanced(self, items: List[Dict[str, Any]]) -> None:
        """Kategoryzuje produkty używając zaawansowanego kategoryzatora z Google Product Taxonomy i Bielik."""
        if not items:
            return

        try:
            # Użyj nowego kategoryzatora do kategoryzacji wsadowej
            categorized_items = await self.product_categorizer.categorize_products_batch(items)
            
            # Zastąp oryginalne elementy skategoryzowanymi
            items.clear()
            items.extend(categorized_items)
            
            # Pokaż statystyki kategoryzacji
            stats = self.product_categorizer.get_category_statistics(items)
            logger.info(f"Statystyki kategoryzacji: {stats}")
            
        except Exception as e:
            logger.error(f"Błąd podczas zaawansowanej kategoryzacji produktów: {e}")
            # Fallback do prostszej kategoryzacji
            await self._categorize_products_simple(items)

    async def _categorize_products_simple(self, items: List[Dict[str, Any]]) -> None:
        """Prosta kategoryzacja produktów jako fallback."""
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
                    item["category_en"] = categories[i]  # Dla kompatybilności
                    item["gpt_category"] = "Simple categorization"
                    item["category_confidence"] = 0.7
                    item["category_method"] = "simple_llm"
                else:
                    item["category"] = "Inne"
                    item["category_en"] = "Other"
                    item["gpt_category"] = "Other"
                    item["category_confidence"] = 0.1
                    item["category_method"] = "fallback"
        except Exception as e:
            logger.error(f"Błąd podczas prostej kategoryzacji produktów: {e}")
            for item in items:
                item["category"] = "Nieznana"
                item["category_en"] = "Unknown"
                item["gpt_category"] = "Unknown"
                item["category_confidence"] = 0.0
                item["category_method"] = "error"

    def _normalize_store_name(self, receipt_data: Dict[str, Any]) -> None:
        """Normalizuje nazwę sklepu z paragonu"""
        store_name = receipt_data.get("store_name", "")
        if store_name:
            normalized_store = self.store_normalizer.normalize_store_name(store_name)
            
            # Dodaj znormalizowane informacje o sklepie
            receipt_data["normalized_store_name"] = normalized_store["normalized_name"]
            receipt_data["normalized_store_name_en"] = normalized_store["normalized_name_en"]
            receipt_data["store_chain"] = normalized_store["chain"]
            receipt_data["store_type"] = normalized_store["type"]
            receipt_data["store_confidence"] = normalized_store["confidence"]
            receipt_data["store_normalization_method"] = normalized_store["method"]
            
            logger.info(f"Znormalizowano nazwę sklepu: {store_name} -> {normalized_store['normalized_name']} (confidence: {normalized_store['confidence']})")
        else:
            # Domyślne wartości dla nieznanego sklepu
            receipt_data["normalized_store_name"] = "Nieznany sklep"
            receipt_data["normalized_store_name_en"] = "Unknown store"
            receipt_data["store_chain"] = "Unknown"
            receipt_data["store_type"] = "unknown"
            receipt_data["store_confidence"] = 0.0
            receipt_data["store_normalization_method"] = "no_store_name"

    def _normalize_product_names(self, items: List[Dict[str, Any]]) -> None:
        """Normalizuje nazwy produktów z paragonu"""
        if not items:
            return

        try:
            # Użyj normalizatora do normalizacji wsadowej
            normalized_items = self.product_name_normalizer.normalize_products_batch(items)
            
            # Zastąp oryginalne elementy znormalizowanymi
            items.clear()
            items.extend(normalized_items)
            
            # Pokaż statystyki normalizacji
            stats = self.product_name_normalizer.get_normalization_statistics(items)
            logger.info(f"Statystyki normalizacji nazw produktów: {stats}")
            
        except Exception as e:
            logger.error(f"Błąd podczas normalizacji nazw produktów: {e}")
            # Fallback - zachowaj oryginalne nazwy
            for item in items:
                if 'name' in item:
                    item['original_name'] = item['name']
                    item['normalized_name'] = item['name']
                    item['product_category'] = 'unknown'
                    item['normalization_confidence'] = 0.0
                    item['normalization_method'] = 'error'
