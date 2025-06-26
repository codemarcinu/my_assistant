#!/usr/bin/env python3
"""
🧠 Test rozdzielania intencji przez API
Autor: AI Assistant
Data: 26.06.2025

Prosty test wykrywania intencji przez endpoint API.
"""

import asyncio
import json
import time
from typing import Dict, List

import httpx


class IntentAPITester:
    """Tester intencji przez API"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.test_results = []
    
    async def test_intent_via_api(self, text: str, expected_intent: str) -> Dict:
        """Test intencji przez API endpoint"""
        print(f"\n🔍 Test API: '{text}'")
        print(f"   Oczekiwana intencja: {expected_intent}")
        
        start_time = time.time()
        
        try:
            # Wyślij żądanie do API
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/api/chat/chat",
                    json={
                        "prompt": text,
                        "session_id": "test_session",
                        "model": "SpeakLeash/bielik-11b-v2.3-instruct:Q4_K_M"
                    },
                    timeout=30.0
                )
            
            end_time = time.time()
            response_time = end_time - start_time
            
            if response.status_code == 200:
                data = response.json()
                response_text = data.get("data", "")
                
                # Analiza odpowiedzi - sprawdź czy zawiera słowa kluczowe
                success = self._analyze_response_for_intent(response_text, expected_intent)
                
                result = {
                    "text": text,
                    "expected_intent": expected_intent,
                    "success": success,
                    "response_time": response_time,
                    "response_text": response_text[:200] + "..." if len(response_text) > 200 else response_text,
                    "status_code": response.status_code
                }
                
                if success:
                    print(f"   ✅ SUKCES: Odpowiedź pasuje do intencji '{expected_intent}'")
                else:
                    print(f"   ⚠️  ODPOWIEDŹ: Nie rozpoznano intencji '{expected_intent}'")
                
                print(f"   📝 Odpowiedź: {result['response_text']}")
                print(f"   ⏱️  Czas odpowiedzi: {response_time:.3f}s")
                
            else:
                result = {
                    "text": text,
                    "expected_intent": expected_intent,
                    "success": False,
                    "response_time": response_time,
                    "error": f"HTTP {response.status_code}",
                    "status_code": response.status_code
                }
                print(f"   ❌ BŁĄD HTTP: {response.status_code}")
            
            return result
            
        except Exception as e:
            result = {
                "text": text,
                "expected_intent": expected_intent,
                "success": False,
                "response_time": time.time() - start_time,
                "error": str(e)
            }
            print(f"   💥 BŁĄD: {e}")
            return result
    
    def _analyze_response_for_intent(self, response_text: str, expected_intent: str) -> bool:
        """Analizuje odpowiedź pod kątem oczekiwanej intencji"""
        response_lower = response_text.lower()
        
        # Słowa kluczowe dla różnych intencji
        intent_keywords = {
            "general_conversation": [
                "cześć", "witam", "dzień dobry", "jak się masz", "żart", "opowiem"
            ],
            "shopping_conversation": [
                "zakupy", "paragon", "wydatki", "cena", "sklep", "biedronka", "lidl"
            ],
            "food_conversation": [
                "jedzenie", "przepis", "gotowanie", "składniki", "ugotować", "kuchnia"
            ],
            "weather": [
                "pogoda", "temperatura", "prognoza", "deszcz", "słońce", "stopnie"
            ],
            "meal_planning": [
                "plan", "posiłki", "dieta", "śniadanie", "obiad", "kolacja", "tydzień"
            ],
            "information_query": [
                "informacje", "dane", "fakty", "historia", "nauka", "technologia"
            ],
            "categorization": [
                "kategoria", "grupuj", "sortuj", "organizuj", "klasyfikuj"
            ],
            "ocr": [
                "paragon", "obraz", "zdjęcie", "skan", "tekst", "analiza"
            ],
            "rag": [
                "dokument", "plik", "analizuj", "przeczytaj", "informacje"
            ]
        }
        
        if expected_intent in intent_keywords:
            keywords = intent_keywords[expected_intent]
            return any(keyword in response_lower for keyword in keywords)
        
        return True  # Jeśli nie ma słów kluczowych, uznaj za sukces
    
    def print_summary(self):
        """Wyświetl podsumowanie testów"""
        print("\n" + "="*60)
        print("📊 PODSUMOWANIE TESTÓW INTENCJI PRZEZ API")
        print("="*60)
        
        if not self.test_results:
            print("❌ Brak wyników testów")
            return
        
        total_tests = len(self.test_results)
        successful_tests = sum(1 for r in self.test_results if r.get('success', False))
        failed_tests = total_tests - successful_tests
        
        print(f"📈 Statystyki:")
        print(f"   Łącznie testów: {total_tests}")
        print(f"   Sukces: {successful_tests} ({successful_tests/total_tests*100:.1f}%)")
        print(f"   Błędy: {failed_tests} ({failed_tests/total_tests*100:.1f}%)")
        
        # Średni czas odpowiedzi
        response_times = [r.get('response_time', 0) for r in self.test_results if 'response_time' in r]
        if response_times:
            avg_response_time = sum(response_times) / len(response_times)
            print(f"   Średni czas odpowiedzi: {avg_response_time:.3f}s")
        
        # Szczegółowe wyniki
        print(f"\n📋 Szczegółowe wyniki:")
        for i, result in enumerate(self.test_results, 1):
            status = "✅" if result.get('success', False) else "❌"
            text = result['text'][:40] + "..." if len(result['text']) > 40 else result['text']
            response_time = result.get('response_time', 0)
            print(f"   {i:2d}. {status} '{text}' ({response_time:.3f}s)")


async def main():
    """Główna funkcja testowa"""
    print("🧠 TEST ROZDZIELANIA INTENCJI PRZEZ API")
    print("="*50)
    print("Testowanie wykrywania intencji przez endpoint API")
    print()
    
    # Inicjalizacja testera
    tester = IntentAPITester()
    
    # Sprawdź czy backend działa
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{tester.base_url}/health", timeout=5)
            if response.status_code == 200:
                print("✅ Backend działa")
            else:
                print("⚠️  Backend odpowiada, ale status nie jest 200")
    except Exception as e:
        print(f"❌ Backend nie odpowiada: {e}")
        print("   Uruchom backend: uvicorn src.backend.main:app --host 0.0.0.0 --port 8000")
        return
    
    # Testy intencji w języku naturalnym
    test_cases = [
        # Konwersacja ogólna
        ("Cześć, jak się masz?", "general_conversation"),
        ("Opowiedz mi żart", "general_conversation"),
        ("Kim jesteś?", "general_conversation"),
        
        # Zakupy i paragony
        ("Wczoraj wydałem 150 zł w Biedronce", "shopping_conversation"),
        ("Mam paragon z Lidla", "shopping_conversation"),
        ("Ile wydałem w tym miesiącu na jedzenie?", "shopping_conversation"),
        
        # Jedzenie i gotowanie
        ("Jak ugotować spaghetti?", "food_conversation"),
        ("Czy awokado jest zdrowe?", "food_conversation"),
        ("Podaj mi przepis na pizzę", "food_conversation"),
        
        # Planowanie posiłków
        ("Zaplanuj mi posiłki na cały tydzień", "meal_planning"),
        ("Co powinienem jeść na śniadanie?", "meal_planning"),
        
        # Pogoda
        ("Jaka jest pogoda w Warszawie?", "weather"),
        ("Czy będzie jutro padać?", "weather"),
        
        # Wyszukiwanie informacji
        ("Co to jest sztuczna inteligencja?", "information_query"),
        ("Kto wynalazł komputer?", "information_query"),
        
        # Kategoryzacja
        ("Kategoryzuj moje wydatki", "categorization"),
        ("Przypisz kategorię do tego produktu", "categorization"),
        
        # OCR i analiza obrazów
        ("Przeanalizuj ten paragon", "ocr"),
        ("Skanuj ten obraz", "ocr"),
        
        # RAG i dokumenty
        ("Przeczytaj ten dokument", "rag"),
        ("Analizuj ten plik PDF", "rag"),
    ]
    
    print(f"🧪 Uruchamiam {len(test_cases)} testów przez API...")
    
    # Wykonaj testy
    for text, expected_intent in test_cases:
        result = await tester.test_intent_via_api(text, expected_intent)
        tester.test_results.append(result)
        
        # Krótka przerwa między testami
        await asyncio.sleep(1)
    
    # Wyświetl podsumowanie
    tester.print_summary()
    
    # Zapisz wyniki do pliku
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    filename = f"intent_api_test_results_{timestamp}.json"
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump({
            "test_info": {
                "timestamp": timestamp,
                "total_tests": len(tester.test_results),
                "successful_tests": sum(1 for r in tester.test_results if r.get('success', False)),
                "test_type": "intent_api"
            },
            "results": tester.test_results
        }, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Wyniki zapisane do: {filename}")
    print("\n✅ Test intencji przez API zakończony!")


if __name__ == "__main__":
    asyncio.run(main()) 