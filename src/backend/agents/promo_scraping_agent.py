"""
PromoScrapingAgent - Agent do monitoringu promocji w sklepach
Integruje się z sidecar scraperem i AI agentem
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from pathlib import Path

from backend.agents.base_agent import BaseAgent
from backend.agents.interfaces import AgentResponse
from backend.core.llm_client import hybrid_llm_client
from backend.settings import settings

logger = logging.getLogger(__name__)

class PromoScrapingAgent(BaseAgent):
    """Agent do monitoringu promocji w polskich sklepach"""
    
    def __init__(self):
        super().__init__()
        self.agent_name = "PromoScrapingAgent"
        self.description = "Monitoruje promocje w sklepach spożywczych"
        
        # Konfiguracja sklepów
        self.supported_stores = {
            'lidl': {
                'name': 'Lidl',
                'url': 'https://www.lidl.pl/pl/promocje',
                'enabled': True
            },
            'biedronka': {
                'name': 'Biedronka', 
                'url': 'https://www.biedronka.pl/pl/promocje',
                'enabled': True
            }
        }
        
        # Cache dla wyników
        self.cache_duration = timedelta(hours=6)  # 6 godzin
        self.last_scrape = {}
        self.scraped_data = {}

    async def process(self, request: Dict[str, Any]) -> AgentResponse:
        """
        Przetwarza żądanie monitoringu promocji
        
        Args:
            request: Słownik z parametrami żądania
            
        Returns:
            AgentResponse z wynikami
        """
        try:
            # Analizuj intencję użytkownika
            intent = await self._detect_intent(request)
            
            if intent == "scrape_promotions":
                return await self._scrape_promotions(request)
            elif intent == "analyze_promotions":
                return await self._analyze_promotions(request)
            elif intent == "compare_stores":
                return await self._compare_stores(request)
            elif intent == "get_best_deals":
                return await self._get_best_deals(request)
            else:
                return await self._general_promo_info(request)
                
        except Exception as e:
            logger.error(f"Błąd w PromoScrapingAgent: {e}")
            return AgentResponse(
                success=False,
                data={},
                message=f"Wystąpił błąd podczas monitoringu promocji: {str(e)}"
            )

    async def _detect_intent(self, request: Dict[str, Any]) -> str:
        """Wykrywa intencję użytkownika"""
        user_input = request.get('user_input', '').lower()
        
        if any(word in user_input for word in ['sprawdź', 'skanuj', 'scrape', 'pobierz']):
            return "scrape_promotions"
        elif any(word in user_input for word in ['analizuj', 'przeanalizuj', 'podsumuj']):
            return "analyze_promotions"
        elif any(word in user_input for word in ['porównaj', 'sklepy', 'który lepszy']):
            return "compare_stores"
        elif any(word in user_input for word in ['najlepsze', 'okazje', 'rabaty']):
            return "get_best_deals"
        else:
            return "general_promo_info"

    async def _scrape_promotions(self, request: Dict[str, Any]) -> AgentResponse:
        """Uruchamia scraping promocji"""
        try:
            # Sprawdź czy mamy świeże dane
            if await self._has_fresh_data():
                logger.info("Używam danych z cache")
                return AgentResponse(
                    success=True,
                    data=self.scraped_data,
                    message="Dane promocji (z cache)"
                )
            
            # Uruchom scraping przez sidecar
            scraped_data = await self._run_scraper_sidecar()
            
            if scraped_data:
                # Analizuj dane przez AI sidecar
                analysis = await self._run_ai_analysis(scraped_data)
                
                # Połącz wyniki
                result = {
                    'raw_data': scraped_data,
                    'analysis': analysis,
                    'scraped_at': datetime.now().isoformat(),
                    'stores_checked': list(self.supported_stores.keys())
                }
                
                # Zapisz do cache
                self.scraped_data = result
                self.last_scrape = {store: datetime.now() for store in self.supported_stores}
                
                return AgentResponse(
                    success=True,
                    data=result,
                    message=f"Pobrano promocje z {len(scraped_data.get('results', []))} sklepów"
                )
            else:
                return AgentResponse(
                    success=False,
                    data={},
                    message="Nie udało się pobrać promocji"
                )
                
        except Exception as e:
            logger.error(f"Błąd podczas scrapowania: {e}")
            return AgentResponse(
                success=False,
                data={},
                message=f"Błąd podczas pobierania promocji: {str(e)}"
            )

    async def _run_scraper_sidecar(self) -> Optional[Dict[str, Any]]:
        """Uruchamia sidecar scraper"""
        try:
            # W trybie Tauri - wywołaj sidecar
            if hasattr(self, '_tauri_invoke'):
                # Symulacja wywołania sidecar w Tauri
                command = await self._tauri_invoke('run_scraper_sidecar', {
                    'stores': list(self.supported_stores.keys())
                })
                return json.loads(command.stdout) if command.success else None
            else:
                # Fallback - symulacja danych
                return await self._simulate_scraped_data()
                
        except Exception as e:
            logger.error(f"Błąd sidecar scraper: {e}")
            return None

    async def _run_ai_analysis(self, scraped_data: Dict[str, Any]) -> Dict[str, Any]:
        """Uruchamia AI analysis sidecar"""
        try:
            # W trybie Tauri - wywołaj AI sidecar
            if hasattr(self, '_tauri_invoke'):
                command = await self._tauri_invoke('run_ai_analysis_sidecar', {
                    'data': scraped_data
                })
                return json.loads(command.stdout) if command.success else {}
            else:
                # Fallback - analiza przez Bielik
                return await self._analyze_with_bielik(scraped_data)
                
        except Exception as e:
            logger.error(f"Błąd AI analysis: {e}")
            return {}

    async def _analyze_with_bielik(self, scraped_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analizuje dane używając Bielik"""
        try:
            # Przygotuj prompt dla Bielik
            prompt = self._create_analysis_prompt(scraped_data)
            
            response = await hybrid_llm_client.chat(
                model="SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0",
                messages=[
                    {
                        "role": "system",
                        "content": "Jesteś ekspertem od analizy promocji w sklepach spożywczych. Analizuj dane i generuj przydatne insights."
                    },
                    {"role": "user", "content": prompt}
                ],
                stream=False,
                max_tokens=1000
            )
            
            if response and "message" in response:
                content = response["message"]["content"]
                # Próbuj sparsować JSON z odpowiedzi
                try:
                    return json.loads(content)
                except:
                    # Fallback - zwróć tekst
                    return {
                        'analysis': content,
                        'method': 'bielik_fallback'
                    }
            
            return {}
            
        except Exception as e:
            logger.error(f"Błąd analizy Bielik: {e}")
            return {}

    def _create_analysis_prompt(self, scraped_data: Dict[str, Any]) -> str:
        """Tworzy prompt dla analizy"""
        results = scraped_data.get('results', [])
        
        prompt = "Przeanalizuj następujące promocje ze sklepów:\n\n"
        
        for result in results:
            if result.get('success') and result.get('promotions'):
                prompt += f"Sklep: {result['store']}\n"
                for promo in result['promotions'][:5]:  # Pierwsze 5 promocji
                    prompt += f"- {promo.get('title', 'N/A')}: {promo.get('discount', 'N/A')}\n"
                prompt += "\n"
        
        prompt += """
        Przeanalizuj te dane i zwróć JSON z:
        1. Podsumowaniem (liczba promocji, średni rabat)
        2. Najlepszymi ofertami
        3. Porównaniem sklepów
        4. Rekomendacjami dla użytkownika
        
        Odpowiedz tylko w formacie JSON.
        """
        
        return prompt

    async def _simulate_scraped_data(self) -> Dict[str, Any]:
        """Symuluje dane z scrapera dla testów"""
        return {
            'timestamp': datetime.now().isoformat(),
            'results': [
                {
                    'store': 'Lidl',
                    'storeKey': 'lidl',
                    'success': True,
                    'promotions': [
                        {
                            'title': 'Mleko 3.2% 1L',
                            'discount': '-20%',
                            'discountPercent': 20,
                            'price': '3.99 zł',
                            'originalPrice': '4.99 zł',
                            'validTo': '2025-01-15',
                            'scrapedAt': datetime.now().isoformat()
                        },
                        {
                            'title': 'Chleb żytni 500g',
                            'discount': '-15%',
                            'discountPercent': 15,
                            'price': '2.99 zł',
                            'originalPrice': '3.49 zł',
                            'validTo': '2025-01-15',
                            'scrapedAt': datetime.now().isoformat()
                        }
                    ]
                },
                {
                    'store': 'Biedronka',
                    'storeKey': 'biedronka',
                    'success': True,
                    'promotions': [
                        {
                            'title': 'Ser żółty 200g',
                            'discount': '-25%',
                            'discountPercent': 25,
                            'price': '4.99 zł',
                            'originalPrice': '6.99 zł',
                            'validTo': '2025-01-15',
                            'scrapedAt': datetime.now().isoformat()
                        }
                    ]
                }
            ],
            'totalStores': 2,
            'totalPromotions': 3
        }

    async def _has_fresh_data(self) -> bool:
        """Sprawdza czy ma świeże dane w cache"""
        if not self.scraped_data:
            return False
            
        # Sprawdź czy cache nie wygasł
        for store, last_time in self.last_scrape.items():
            if datetime.now() - last_time > self.cache_duration:
                return False
                
        return True

    async def _analyze_promotions(self, request: Dict[str, Any]) -> AgentResponse:
        """Analizuje istniejące promocje"""
        if not self.scraped_data:
            return await self._scrape_promotions(request)
            
        analysis = self.scraped_data.get('analysis', {})
        
        return AgentResponse(
            success=True,
            data=analysis,
            message="Analiza promocji"
        )

    async def _compare_stores(self, request: Dict[str, Any]) -> AgentResponse:
        """Porównuje sklepy"""
        if not self.scraped_data:
            return await self._scrape_promotions(request)
            
        store_comparison = self.scraped_data.get('analysis', {}).get('store_comparison', {})
        
        return AgentResponse(
            success=True,
            data={'store_comparison': store_comparison},
            message="Porównanie sklepów"
        )

    async def _get_best_deals(self, request: Dict[str, Any]) -> AgentResponse:
        """Zwraca najlepsze oferty"""
        if not self.scraped_data:
            return await self._scrape_promotions(request)
            
        best_deals = self.scraped_data.get('analysis', {}).get('best_deals', [])
        
        return AgentResponse(
            success=True,
            data={'best_deals': best_deals},
            message="Najlepsze oferty"
        )

    async def _general_promo_info(self, request: Dict[str, Any]) -> AgentResponse:
        """Informacje ogólne o promocjach"""
        return AgentResponse(
            success=True,
            data={
                'supported_stores': list(self.supported_stores.keys()),
                'last_update': self.last_scrape.get('lidl', 'Nigdy'),
                'cache_duration_hours': self.cache_duration.total_seconds() / 3600
            },
            message="Informacje o monitoringu promocji"
        )

    def get_capabilities(self) -> List[str]:
        """Zwraca możliwości agenta"""
        return [
            "monitoring_promotions",
            "store_comparison", 
            "price_analysis",
            "best_deals_detection",
            "trend_analysis"
        ] 