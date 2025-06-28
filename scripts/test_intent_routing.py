#!/usr/bin/env python3
"""
🧠 Test rozdzielania zadań dla agentów na podstawie intencji użytkownika
Autor: AI Assistant
Data: 26.06.2025

Ten skrypt testuje, jak system rozpoznaje intencje użytkownika w języku naturalnym
i kieruje je do odpowiednich agentów.
"""

import asyncio
import json
import sys
import time
from typing import Dict, List, Tuple

# Dodaj ścieżkę do modułów backend
sys.path.append('src')

from backend.agents.intent_detector import SimpleIntentDetector
from backend.agents.orchestrator import Orchestrator
from backend.agents.interfaces import MemoryContext
from backend.settings import settings


class IntentRoutingTester:
    """Tester rozdzielania intencji do agentów"""
    
    def __init__(self):
        self.intent_detector = SimpleIntentDetector()
        self.orchestrator = None
        self.test_results = []
        
    async def setup_orchestrator(self):
        """Inicjalizacja orchestratora"""
        try:
            self.orchestrator = Orchestrator()
            print("✅ Orchestrator zainicjalizowany")
        except Exception as e:
            print(f"❌ Błąd inicjalizacji orchestratora: {e}")
            return False
        return True
    
    async def test_intent_detection(self, text: str, expected_intent: str) -> Dict:
        """Test wykrywania intencji dla pojedynczego tekstu"""
        print(f"\n🔍 Test intencji: '{text}'")
        print(f"   Oczekiwana intencja: {expected_intent}")
        
        start_time = time.time()
        
        try:
            # Utwórz kontekst pamięci
            context = MemoryContext(
                session_id="test_session",
                history=[],
                last_command=text,
                request_id="test_request"
            )
            
            # Wykryj intencję
            intent_data = await self.intent_detector.detect_intent(text, context)
            
            end_time = time.time()
            detection_time = end_time - start_time
            
            # Sprawdź wynik
            success = intent_data.type == expected_intent
            confidence = intent_data.confidence
            
            result = {
                "text": text,
                "expected_intent": expected_intent,
                "detected_intent": intent_data.type,
                "confidence": confidence,
                "success": success,
                "detection_time": detection_time,
                "entities": intent_data.entities
            }
            
            if success:
                print(f"   ✅ SUKCES: Wykryto '{intent_data.type}' (pewność: {confidence:.2f})")
            else:
                print(f"   ❌ BŁĄD: Oczekiwano '{expected_intent}', wykryto '{intent_data.type}'")
            
            print(f"   ⏱️  Czas wykrywania: {detection_time:.3f}s")
            
            return result
            
        except Exception as e:
            print(f"   💥 BŁĄD: {e}")
            return {
                "text": text,
                "expected_intent": expected_intent,
                "detected_intent": "error",
                "confidence": 0.0,
                "success": False,
                "detection_time": time.time() - start_time,
                "error": str(e)
            }
    
    async def test_full_routing(self, text: str, expected_agent: str) -> Dict:
        """Test pełnego routingu od tekstu do agenta"""
        print(f"\n🔄 Test routingu: '{text}'")
        print(f"   Oczekiwany agent: {expected_agent}")
        
        if not self.orchestrator:
            print("   ❌ Orchestrator nie zainicjalizowany")
            return {"error": "Orchestrator not initialized"}
        
        start_time = time.time()
        
        try:
            # Przetwórz komendę przez orchestrator
            response = await self.orchestrator.process_command(
                user_command=text,
                session_id="test_session"
            )
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            result = {
                "text": text,
                "expected_agent": expected_agent,
                "success": response.success,
                "processing_time": processing_time,
                "response_text": response.text[:200] + "..." if len(response.text) > 200 else response.text,
                "error": response.error if not response.success else None
            }
            
            if response.success:
                print(f"   ✅ SUKCES: Przetworzono przez orchestrator")
                print(f"   📝 Odpowiedź: {result['response_text']}")
            else:
                print(f"   ❌ BŁĄD: {response.error}")
            
            print(f"   ⏱️  Czas przetwarzania: {processing_time:.3f}s")
            
            return result
            
        except Exception as e:
            print(f"   💥 BŁĄD: {e}")
            return {
                "text": text,
                "expected_agent": expected_agent,
                "success": False,
                "processing_time": time.time() - start_time,
                "error": str(e)
            }
    
    def print_summary(self):
        """Wyświetl podsumowanie testów"""
        print("\n" + "="*60)
        print("📊 PODSUMOWANIE TESTÓW ROZDZIELANIA INTENCJI")
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
        
        # Średni czas wykrywania
        detection_times = [r.get('detection_time', 0) for r in self.test_results if 'detection_time' in r]
        if detection_times:
            avg_detection_time = sum(detection_times) / len(detection_times)
            print(f"   Średni czas wykrywania: {avg_detection_time:.3f}s")
        
        # Szczegółowe wyniki
        print(f"\n📋 Szczegółowe wyniki:")
        for i, result in enumerate(self.test_results, 1):
            status = "✅" if result.get('success', False) else "❌"
            detected = result.get('detected_intent', 'BŁĄD')
            confidence = result.get('confidence', 0.0)
            print(f"   {i:2d}. {status} '{result['text'][:50]}...' → {detected} ({confidence:.2f})")


async def main():
    """Główna funkcja testowa"""
    print("🧠 TEST ROZDZIELANIA ZADAŃ DLA AGENTÓW")
    print("="*50)
    print("Testowanie wykrywania intencji w języku naturalnym")
    print("i kierowania ich do odpowiednich agentów")
    print()
    
    # Inicjalizacja testera
    tester = IntentRoutingTester()
    
    # Sprawdź czy backend działa
    try:
        import httpx
        response = httpx.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend działa na http://localhost:8000")
        else:
            print("⚠️  Backend odpowiada, ale status nie jest 200")
    except Exception as e:
        print(f"❌ Backend nie odpowiada: {e}")
        print("   Uruchom backend: uvicorn src.backend.main:app --host 0.0.0.0 --port 8000")
        return
    
    # Inicjalizacja orchestratora
    if not await tester.setup_orchestrator():
        print("❌ Nie można zainicjalizować orchestratora")
        return
    
    # Testy intencji w języku naturalnym
    test_cases = [
        # Konwersacja ogólna
        ("Cześć, jak się masz?", "general_conversation"),
        ("Dzień dobry! Co słychać?", "general_conversation"),
        ("Opowiedz mi żart", "general_conversation"),
        ("Kim jesteś?", "general_conversation"),
        
        # Zakupy i paragony
        ("Wczoraj wydałem 150 zł w Biedronce", "shopping_conversation"),
        ("Mam paragon z Lidla, chcesz go przeanalizować?", "shopping_conversation"),
        ("Ile wydałem w tym miesiącu na jedzenie?", "shopping_conversation"),
        ("Dodaj ten produkt do listy zakupów", "shopping_conversation"),
        
        # Jedzenie i gotowanie
        ("Jak ugotować spaghetti?", "food_conversation"),
        ("Mam awokado i jajka, co mogę z tego ugotować?", "food_conversation"),
        ("Czy awokado jest zdrowe?", "food_conversation"),
        ("Podaj mi przepis na pizzę", "food_conversation"),
        
        # Planowanie posiłków
        ("Zaplanuj mi posiłki na cały tydzień", "meal_planning"),
        ("Co powinienem jeść na śniadanie?", "meal_planning"),
        ("Stwórz plan żywieniowy dla diety wegetariańskiej", "meal_planning"),
        
        # Pogoda
        ("Jaka jest pogoda w Warszawie?", "weather"),
        ("Czy będzie jutro padać?", "weather"),
        ("Prognoza pogody na weekend", "weather"),
        
        # Wyszukiwanie informacji
        ("Co to jest sztuczna inteligencja?", "information_query"),
        ("Kto wynalazł komputer?", "information_query"),
        ("Jak działa blockchain?", "information_query"),
        
        # Kategoryzacja
        ("Kategoryzuj moje wydatki z ostatniego miesiąca", "categorization"),
        ("Przypisz kategorię do tego produktu", "categorization"),
        ("Pogrupuj moje zakupy według kategorii", "categorization"),
        
        # OCR i analiza obrazów
        ("Przeanalizuj ten paragon", "ocr"),
        ("Skanuj ten obraz", "ocr"),
        ("Wyciągnij tekst z tego zdjęcia", "ocr"),
        
        # RAG i dokumenty
        ("Przeczytaj ten dokument", "rag"),
        ("Analizuj ten plik PDF", "rag"),
        ("Znajdź informacje w tym tekście", "rag"),
        
        # Złożone zapytania
        ("Mam paragon z wczoraj i chcę wiedzieć, czy wydałem za dużo na jedzenie", "shopping_conversation"),
        ("Zaplanuj mi posiłki na tydzień, ale uwzględnij, że jestem wegetarianinem", "meal_planning"),
        ("Jaka jest pogoda w Krakowie i czy powinienem wziąć parasol?", "weather"),
    ]
    
    print(f"🧪 Uruchamiam {len(test_cases)} testów intencji...")
    
    # Wykonaj testy intencji
    for text, expected_intent in test_cases:
        result = await tester.test_intent_detection(text, expected_intent)
        tester.test_results.append(result)
        
        # Krótka przerwa między testami
        await asyncio.sleep(0.1)
    
    # Testy pełnego routingu (wybrane przypadki)
    routing_test_cases = [
        ("Cześć, jak się masz?", "general_conversation"),
        ("Jaka jest pogoda w Warszawie?", "weather"),
        ("Jak ugotować spaghetti?", "food_conversation"),
        ("Wczoraj wydałem 150 zł w Biedronce", "shopping_conversation"),
    ]
    
    print(f"\n🔄 Uruchamiam {len(routing_test_cases)} testów pełnego routingu...")
    
    for text, expected_agent in routing_test_cases:
        result = await tester.test_full_routing(text, expected_agent)
        # Dodaj do wyników jako routing test
        result['test_type'] = 'routing'
        tester.test_results.append(result)
        
        await asyncio.sleep(0.5)  # Dłuższa przerwa dla routingu
    
    # Wyświetl podsumowanie
    tester.print_summary()
    
    # Zapisz wyniki do pliku
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    filename = f"intent_routing_test_results_{timestamp}.json"
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump({
            "test_info": {
                "timestamp": timestamp,
                "total_tests": len(tester.test_results),
                "successful_tests": sum(1 for r in tester.test_results if r.get('success', False)),
                "test_type": "intent_routing"
            },
            "results": tester.test_results
        }, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Wyniki zapisane do: {filename}")
    print("\n✅ Test rozdzielania intencji zakończony!")


if __name__ == "__main__":
    asyncio.run(main()) 