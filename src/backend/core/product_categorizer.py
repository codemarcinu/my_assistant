import json
import logging
import re
from typing import Dict, List, Optional, Tuple, Any
from difflib import SequenceMatcher

from backend.core.hybrid_llm_client import hybrid_llm_client

logger = logging.getLogger(__name__)


class ProductCategorizer:
    """Kategoryzator produktów z integracją modelu Bielik i Google Product Taxonomy"""

    def __init__(self, categories_file: str = "data/config/filtered_gpt_categories.json"):
        """Inicjalizuje kategoryzator z plikiem kategorii"""
        self.categories_file = categories_file
        self.categories = self._load_categories()
        self.category_keywords = self._build_keyword_index()
        logger.info(f"Załadowano {len(self.categories)} kategorii produktów")

    def _load_categories(self) -> List[Dict]:
        """Ładuje kategorie z pliku JSON"""
        try:
            with open(self.categories_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('categories', [])
        except FileNotFoundError:
            logger.warning(f"Plik kategorii {self.categories_file} nie znaleziony, używam domyślnych")
            return self._get_default_categories()
        except json.JSONDecodeError as e:
            logger.error(f"Błąd parsowania pliku kategorii: {e}")
            return self._get_default_categories()

    def _build_keyword_index(self) -> Dict[str, List[str]]:
        """Buduje indeks słów kluczowych dla szybkiego wyszukiwania"""
        keyword_index = {}
        for category in self.categories:
            category_id = category['id']
            keywords = category.get('keywords', [])
            for keyword in keywords:
                keyword_lower = keyword.lower()
                if keyword_lower not in keyword_index:
                    keyword_index[keyword_lower] = []
                keyword_index[keyword_lower].append(category_id)
        return keyword_index

    def _get_default_categories(self) -> List[Dict]:
        """Zwraca domyślne kategorie jeśli plik nie jest dostępny"""
        return [
            {
                "id": "1",
                "name_pl": "Nabiał",
                "name_en": "Dairy Products",
                "keywords": ["mleko", "ser", "jogurt", "masło", "śmietana"],
                "parent_id": None
            },
            {
                "id": "2", 
                "name_pl": "Pieczywo",
                "name_en": "Bread & Bakery",
                "keywords": ["chleb", "bułka", "ciasto", "rogal"],
                "parent_id": None
            },
            {
                "id": "3",
                "name_pl": "Mięso",
                "name_en": "Meat",
                "keywords": ["mięso", "wędlina", "kiełbasa", "szynka"],
                "parent_id": None
            },
            {
                "id": "4",
                "name_pl": "Owoce i warzywa",
                "name_en": "Fruits & Vegetables", 
                "keywords": ["jabłko", "pomidor", "ogórek", "marchew"],
                "parent_id": None
            },
            {
                "id": "5",
                "name_pl": "Inne",
                "name_en": "Other",
                "keywords": ["inne", "nieznane"],
                "parent_id": None
            }
        ]

    async def categorize_product_with_bielik(self, product_name: str) -> Dict[str, str]:
        """
        Kategoryzuje produkt używając modelu Bielik
        
        Args:
            product_name: Nazwa produktu z paragonu
            
        Returns:
            Dict z informacjami o kategorii
        """
        try:
            # Najpierw spróbuj słownik słów kluczowych
            keyword_match = self._categorize_by_keywords(product_name)
            if keyword_match and keyword_match['confidence'] > 0.8:
                logger.info(f"Kategoryzacja słownikowa: {product_name} -> {keyword_match['name_pl']}")
                return keyword_match

            # Jeśli słownik nie pomógł, użyj Bielika
            bielik_category = await self._categorize_with_bielik(product_name)
            if bielik_category:
                logger.info(f"Kategoryzacja Bielik: {product_name} -> {bielik_category['name_pl']}")
                return bielik_category

            # Fallback do kategorii "Inne"
            return self._get_other_category()

        except Exception as e:
            logger.error(f"Błąd podczas kategoryzacji produktu '{product_name}': {e}")
            return self._get_other_category()

    def _categorize_by_keywords(self, product_name: str) -> Optional[Dict[str, str]]:
        """
        Kategoryzuje produkt na podstawie słów kluczowych
        
        Args:
            product_name: Nazwa produktu
            
        Returns:
            Dict z informacjami o kategorii lub None
        """
        product_lower = product_name.lower()
        best_match = None
        best_score = 0.0

        for category in self.categories:
            keywords = category.get('keywords', [])
            for keyword in keywords:
                keyword_lower = keyword.lower()
                
                # Sprawdź czy słowo kluczowe jest zawarte w nazwie produktu
                if keyword_lower in product_lower:
                    score = len(keyword_lower) / len(product_lower)
                    if score > best_score:
                        best_score = score
                        best_match = {
                            'id': category['id'],
                            'name_pl': category['name_pl'],
                            'name_en': category['name_en'],
                            'gpt_path': category.get('gpt_path', ''),
                            'confidence': score,
                            'method': 'keyword_match'
                        }

        return best_match if best_score > 0.3 else None

    async def _categorize_with_bielik(self, product_name: str) -> Optional[Dict[str, str]]:
        """
        Kategoryzuje produkt używając modelu Bielik
        
        Args:
            product_name: Nazwa produktu
            
        Returns:
            Dict z informacjami o kategorii lub None
        """
        try:
            # Przygotuj prompt dla Bielika
            prompt = self._create_categorization_prompt(product_name)
            
            # Wywołaj model Bielik
            response = await hybrid_llm_client.chat(
                model="SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0",
                messages=[
                    {
                        "role": "system",
                        "content": "Jesteś ekspertem od kategoryzacji produktów spożywczych. Przypisz każdy produkt do odpowiedniej kategorii."
                    },
                    {"role": "user", "content": prompt}
                ],
                stream=False,
            )

            if response and "message" in response:
                content = response["message"]["content"]
                category_id = self._extract_category_from_bielik_response(content)
                if category_id:
                    category = self._get_category_by_id(category_id)
                    if category:
                        return {
                            'id': category['id'],
                            'name_pl': category['name_pl'],
                            'name_en': category['name_en'],
                            'gpt_path': category.get('gpt_path', ''),
                            'confidence': 0.9,
                            'method': 'bielik_ai'
                        }

            return None

        except Exception as e:
            logger.error(f"Błąd podczas kategoryzacji Bielik dla '{product_name}': {e}")
            return None

    def _create_categorization_prompt(self, product_name: str) -> str:
        """Tworzy prompt dla modelu Bielik do kategoryzacji"""
        
        # Przygotuj listę dostępnych kategorii
        categories_text = "\n".join([
            f"{cat['id']}. {cat['name_pl']} ({cat['name_en']})"
            for cat in self.categories
        ])

        return f"""Przypisz produkt do odpowiedniej kategorii.

Dostępne kategorie:
{categories_text}

Produkt: "{product_name}"

Odpowiedz tylko numerem kategorii (np. "1" dla Nabiał, "5" dla Inne).
Jeśli nie jesteś pewny, wybierz kategorię "Inne" (5)."""

    def _extract_category_from_bielik_response(self, response: str) -> Optional[str]:
        """Wyciąga ID kategorii z odpowiedzi Bielika"""
        # Szukaj liczby w odpowiedzi
        numbers = re.findall(r'\d+', response)
        if numbers:
            category_id = numbers[0]
            # Sprawdź czy ID jest w zakresie dostępnych kategorii
            if any(cat['id'] == category_id for cat in self.categories):
                return category_id
        return None

    def _get_category_by_id(self, category_id: str) -> Optional[Dict]:
        """Znajduje kategorię po ID"""
        for category in self.categories:
            if category['id'] == category_id:
                return category
        return None

    def _get_other_category(self) -> Dict[str, str]:
        """Zwraca kategorię "Inne" jako fallback"""
        other_category = self._get_category_by_id("35") or self._get_category_by_id("5")
        if other_category:
            return {
                'id': other_category['id'],
                'name_pl': other_category['name_pl'],
                'name_en': other_category['name_en'],
                'gpt_path': other_category.get('gpt_path', ''),
                'confidence': 0.1,
                'method': 'fallback'
            }
        else:
            return {
                'id': '999',
                'name_pl': 'Inne',
                'name_en': 'Other',
                'gpt_path': 'Other',
                'confidence': 0.1,
                'method': 'fallback'
            }

    async def categorize_products_batch(self, products: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Kategoryzuje listę produktów w trybie wsadowym dla optymalizacji
        
        Args:
            products: Lista produktów z paragonu
            
        Returns:
            Lista produktów z dodanymi kategoriami
        """
        if not products:
            return []
            
        categorized_products = []
        
        # Najpierw spróbuj kategoryzacji słownikowej dla wszystkich produktów
        for product in products:
            product_name = product.get('name', '')
            if product_name:
                keyword_match = self._categorize_by_keywords(product_name)
                if keyword_match and keyword_match['confidence'] > 0.8:
                    product['category'] = keyword_match['name_pl']
                    product['category_en'] = keyword_match['name_en']
                    product['gpt_category'] = keyword_match['gpt_path']
                    product['category_confidence'] = keyword_match['confidence']
                    product['category_method'] = keyword_match['method']
                else:
                    # Oznacz do kategoryzacji AI
                    product['_needs_ai_categorization'] = True
            else:
                # Domyślna kategoria dla produktów bez nazwy
                product['category'] = 'Inne'
                product['category_en'] = 'Other'
                product['gpt_category'] = 'Other'
                product['category_confidence'] = 0.0
                product['category_method'] = 'no_name'
            
            categorized_products.append(product)
        
        # Kategoryzuj pozostałe produkty w jednym wywołaniu AI
        products_needing_ai = [p for p in categorized_products if p.get('_needs_ai_categorization')]
        if products_needing_ai:
            await self._categorize_products_with_ai_batch(products_needing_ai)
        
        # Usuń tymczasowe flagi
        for product in categorized_products:
            product.pop('_needs_ai_categorization', None)
        
        return categorized_products

    async def _categorize_products_with_ai_batch(self, products: List[Dict[str, Any]]) -> None:
        """
        Kategoryzuje listę produktów w jednym wywołaniu AI dla optymalizacji
        
        Args:
            products: Lista produktów do kategoryzacji
        """
        try:
            # Przygotuj listę produktów do kategoryzacji
            product_names = [p.get('name', '') for p in products if p.get('name')]
            if not product_names:
                return
                
            # Przygotuj prompt dla batch kategoryzacji
            prompt = self._create_batch_categorization_prompt(product_names)
            
            # Wywołaj model Bielik dla wszystkich produktów na raz
            response = await hybrid_llm_client.chat(
                model="SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0",
                messages=[
                    {
                        "role": "system",
                        "content": "Jesteś ekspertem od kategoryzacji produktów spożywczych. Przypisz każdy produkt do odpowiedniej kategorii."
                    },
                    {"role": "user", "content": prompt}
                ],
                stream=False,
            )

            if response and "message" in response:
                content = response["message"]["content"]
                category_ids = self._extract_batch_categories_from_response(content)
                
                # Przypisz kategorie do produktów
                for i, product in enumerate(products):
                    if i < len(category_ids) and category_ids[i]:
                        category = self._get_category_by_id(category_ids[i])
                        if category:
                            product['category'] = category['name_pl']
                            product['category_en'] = category['name_en']
                            product['gpt_category'] = category.get('gpt_path', '')
                            product['category_confidence'] = 0.9
                            product['category_method'] = 'bielik_ai_batch'
                        else:
                            # Fallback do kategorii "Inne"
                            product['category'] = 'Inne'
                            product['category_en'] = 'Other'
                            product['gpt_category'] = 'Other'
                            product['category_confidence'] = 0.1
                            product['category_method'] = 'fallback'
                    else:
                        # Fallback do kategorii "Inne"
                        product['category'] = 'Inne'
                        product['category_en'] = 'Other'
                        product['gpt_category'] = 'Other'
                        product['category_confidence'] = 0.1
                        product['category_method'] = 'fallback'

        except Exception as e:
            logger.error(f"Błąd podczas batch kategoryzacji AI: {e}")
            # Fallback - przypisz kategorię "Inne" do wszystkich produktów
            for product in products:
                product['category'] = 'Inne'
                product['category_en'] = 'Other'
                product['gpt_category'] = 'Other'
                product['category_confidence'] = 0.0
                product['category_method'] = 'error'

    def _create_batch_categorization_prompt(self, product_names: List[str]) -> str:
        """Tworzy prompt dla batch kategoryzacji produktów"""
        
        # Przygotuj listę dostępnych kategorii
        categories_text = "\n".join([
            f"{cat['id']}. {cat['name_pl']} ({cat['name_en']})"
            for cat in self.categories
        ])

        # Przygotuj listę produktów
        products_text = "\n".join([
            f"{i+1}. {name}"
            for i, name in enumerate(product_names)
        ])

        return f"""Przypisz każdy produkt do odpowiedniej kategorii.

Dostępne kategorie:
{categories_text}

Produkty do kategoryzacji:
{products_text}

Odpowiedz tylko listą numerów kategorii oddzielonych przecinkami, w kolejności produktów.
Przykład: "1,5,2,3,1" (dla 5 produktów)

Jeśli nie jesteś pewny kategorii, użyj "5" (Inne)."""

    def _extract_batch_categories_from_response(self, response: str) -> List[str]:
        """Wyciąga listę ID kategorii z odpowiedzi batch kategoryzacji"""
        try:
            # Szukaj liczb oddzielonych przecinkami
            numbers = re.findall(r'\d+', response)
            return numbers
        except Exception as e:
            logger.error(f"Błąd podczas parsowania batch odpowiedzi: {e}")
            return []

    def get_category_statistics(self, products: List[Dict[str, Any]]) -> Dict[str, int]:
        """Zwraca statystyki kategoryzacji produktów"""
        stats = {}
        for product in products:
            category = product.get('category', 'Inne')
            stats[category] = stats.get(category, 0) + 1
        return stats 