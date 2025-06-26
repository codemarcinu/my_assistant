"""
Real LLM End-to-End Tests

Testy z rzeczywistymi modelami Ollama LLM - bez mocków:
- Realne odpowiedzi AI z modeli mistral:7b, llama3.2:3b i bielik-1.5b-v3.0-instruct
- Testowanie jakości odpowiedzi
- Pomiar wydajności i czasów odpowiedzi
- Testowanie różnych typów zapytań
- Sprawdzanie kontekstu i pamięci
"""

import pytest
import asyncio
import json
import os
import time
from pathlib import Path
from typing import Dict, Any, List
from datetime import datetime

import httpx
from fastapi.testclient import TestClient

from backend.models.shopping import Product, ShoppingTrip
from backend.models.rag_document import RAGDocument
from datetime import date


class TestRealLLME2E:
    """Testy E2E z rzeczywistymi modelami LLM"""
    
    @pytest.fixture(autouse=True)
    def setup_ollama_client(self):
        """Konfiguracja klienta Ollama dla testów"""
        import ollama
        from backend.core.llm_client import ollama_client
        
        # Zaktualizuj klienta Ollama dla testów
        test_client = ollama.Client(host="http://localhost:11434")
        
        # Zastąp globalny klient testowym
        import backend.core.llm_client
        backend.core.llm_client.ollama_client = test_client
        
        yield
        
        # Przywróć oryginalny klient po teście
        backend.core.llm_client.ollama_client = ollama.Client(host="http://ollama:11434")
    
    @pytest.fixture
    def test_client(self):
        """Klient testowy FastAPI"""
        from backend.main import app
        return TestClient(app)
    
    @pytest.fixture
    def db_session(self):
        """Sesja bazy danych"""
        from backend.tests.conftest import db_session
        return db_session
    
    @pytest.fixture
    def sample_food_data(self):
        """Przykładowe dane produktów spożywczych"""
        return [
            {
                "name": "Mleko 3.2%",
                "quantity": 2,
                "unit": "l",
                "expiry_date": date(2024, 12, 31),
                "category": "nabiał"
            },
            {
                "name": "Chleb razowy",
                "quantity": 1,
                "unit": "szt",
                "expiry_date": date(2024, 12, 25),
                "category": "pieczywo"
            },
            {
                "name": "Jajka",
                "quantity": 10,
                "unit": "szt",
                "expiry_date": date(2024, 12, 28),
                "category": "nabiał"
            },
            {
                "name": "Pomidory",
                "quantity": 500,
                "unit": "g",
                "expiry_date": date(2024, 12, 20),
                "category": "warzywa"
            },
            {
                "name": "Kurczak piersi",
                "quantity": 1,
                "unit": "kg",
                "expiry_date": date(2024, 12, 22),
                "category": "mięso"
            }
        ]
    
    @pytest.fixture
    def real_receipt_files(self):
        """Prawdziwe pliki paragonów do testów"""
        receipts_dir = Path("../../receipts")
        if receipts_dir.exists():
            return list(receipts_dir.glob("*"))
        return []
    
    def test_ollama_models_availability(self):
        """Test dostępności modeli Ollama"""
        try:
            import httpx
            response = httpx.get("http://localhost:11434/api/tags")
            assert response.status_code == 200
            
            models = response.json()
            model_names = [model["name"] for model in models.get("models", [])]
            
            print(f"Dostępne modele: {model_names}")
            
            # Sprawdź czy mamy wymagane modele
            assert "mistral:7b" in model_names, "Model mistral:7b nie jest dostępny"
            assert "llama3.2:3b" in model_names, "Model llama3.2:3b nie jest dostępny"
            assert "SpeakLeash/bielik-1.5b-v3.0-instruct:FP16" in model_names, "Model bielik nie jest dostępny"
            
            print("✅ Wszystkie wymagane modele są dostępne")
            
        except Exception as e:
            pytest.fail(f"Błąd połączenia z Ollama: {e}")
    
    @pytest.mark.asyncio
    async def test_real_llm_food_questions(self, test_client):
        """Test rzeczywistych odpowiedzi AI na pytania o jedzenie"""
        food_questions = [
            "Jakie produkty są dobre na śniadanie?",
            "Co mogę ugotować z kurczakiem?",
            "Jakie warzywa są sezonowe w grudniu?",
            "Czy mleko jest zdrowe?",
            "Jakie produkty mają dużo białka?"
        ]
        
        responses = []
        
        for i, question in enumerate(food_questions, 1):
            print(f"\n--- Pytanie {i}: {question} ---")
            
            start_time = time.time()
            
            # Debug: sprawdź typ obiektu zwracanego przez LLM client
            from backend.core.llm_client import llm_client
            import inspect
            
            try:
                # Test bezpośrednio LLM client
                print(f"Testing LLM client directly...")
                
                # Sprawdź czy to ten sam obiekt
                print(f"LLM client object: {llm_client}")
                print(f"LLM client type: {type(llm_client)}")
                
                # Test _stream_response bezpośrednio
                print(f"Testing _stream_response directly...")
                messages = [{"role": "user", "content": question}]
                sync_gen = llm_client._stream_response("mistral:7b", messages, {})
                print(f"_stream_response type: {type(sync_gen)}")
                print(f"Is generator: {inspect.isgenerator(sync_gen)}")
                
                # Test pierwszy chunk
                try:
                    first_chunk = next(sync_gen)
                    print(f"First chunk from _stream_response: {first_chunk}")
                except Exception as e:
                    print(f"Error getting first chunk: {e}")
                
                # Test dokładnie tak samo jak w generate_stream_from_prompt_async
                print(f"Testing exact same call as generate_stream_from_prompt_async...")
                messages_async = []
                messages_async.append({"role": "user", "content": question})
                sync_gen_async = llm_client._stream_response("mistral:7b", messages_async, {})
                print(f"_stream_response (async style) type: {type(sync_gen_async)}")
                print(f"Is generator (async style): {inspect.isgenerator(sync_gen_async)}")
                
                # Test generate_stream_from_prompt_async bezpośrednio
                print(f"Testing generate_stream_from_prompt_async directly...")
                async_gen = llm_client.generate_stream_from_prompt_async(
                    model="mistral:7b", 
                    prompt=question
                )
                print(f"Async generator type: {type(async_gen)}")
                print(f"Is async generator: {inspect.isasyncgen(async_gen)}")
                
                # Przetestuj pierwszy chunk
                first_chunk = await anext(async_gen)
                print(f"First chunk: {first_chunk}")
                
                # Jeśli to działa, użyj normalnego endpointu
                response = test_client.post(
                    "/api/chat/chat",
                    json={"prompt": question}
                )
            except Exception as e:
                print(f"Error testing LLM client: {e}")
                response = test_client.post(
                    "/api/chat/chat",
                    json={"prompt": question}
                )
            
            end_time = time.time()
            response_time = end_time - start_time
            
            assert response.status_code == 200, f"Błąd HTTP: {response.status_code}"
            
            response_data = response.json()
            print(f"Odpowiedź: {response_data.get('data', 'Brak odpowiedzi')[:200]}...")
            print(f"Czas odpowiedzi: {response_time:.2f}s")
            
            # Sprawdź jakość odpowiedzi
            assert "data" in response_data, "Brak pola 'data' w odpowiedzi"
            assert len(response_data["data"]) > 10, "Odpowiedź jest za krótka"
            
            responses.append({
                "question": question,
                "response": response_data["data"],
                "response_time": response_time
            })
        
        # Analiza wyników
        avg_response_time = sum(r["response_time"] for r in responses) / len(responses)
        print(f"\n📊 Średni czas odpowiedzi: {avg_response_time:.2f}s")
        
        # Sprawdź czy odpowiedzi są sensowne
        for resp in responses:
            assert len(resp["response"]) > 20, f"Odpowiedź za krótka: {resp['response']}"
            assert resp["response_time"] < 30, f"Odpowiedź za wolna: {resp['response_time']}s"
    
    @pytest.mark.asyncio
    async def test_real_llm_meal_planning(self, test_client):
        """Test rzeczywistego planowania posiłków przez AI"""
        meal_planning_questions = [
            "Zaplanuj posiłki na poniedziałek",
            "Co ugotować na obiad z produktów: kurczak, pomidory, makaron?",
            "Przepis na szybkie śniadanie",
            "Plan posiłków na cały tydzień",
            "Co zrobić z resztkami jedzenia?"
        ]
        
        for i, question in enumerate(meal_planning_questions, 1):
            print(f"\n--- Planowanie posiłków {i}: {question} ---")
            
            start_time = time.time()
            
            response = test_client.post(
                "/api/chat/chat",
                json={"prompt": question}
            )
            
            end_time = time.time()
            response_time = end_time - start_time
            
            assert response.status_code == 200
            response_data = response.json()
            
            print(f"Plan: {response_data.get('data', '')[:300]}...")
            print(f"Czas: {response_time:.2f}s")
            
            # Sprawdź czy odpowiedź zawiera elementy planowania
            response_text = response_data.get("data", "").lower()
            planning_keywords = ["plan", "przepis", "posiłek", "gotować", "ugotować", "menu"]
            has_planning_content = any(keyword in response_text for keyword in planning_keywords)
            
            assert has_planning_content, f"Odpowiedź nie zawiera elementów planowania: {response_text[:100]}"
            assert response_time < 45, f"Planowanie za wolne: {response_time}s"
    
    @pytest.mark.asyncio
    async def test_real_llm_weather_queries(self, test_client):
        """Test zapytań o pogodę z realnym AI"""
        weather_questions = [
            "Jaka jest pogoda w Warszawie?",
            "Czy będzie padać jutro?",
            "Temperatura na weekend",
            "Pogoda na wakacje"
        ]
        
        for question in weather_questions:
            print(f"\n--- Pogoda: {question} ---")
            
            start_time = time.time()
            
            response = test_client.post(
                "/api/chat/chat",
                json={"prompt": question}
            )
            
            end_time = time.time()
            response_time = end_time - start_time
            
            assert response.status_code == 200
            response_data = response.json()
            
            print(f"Odpowiedź: {response_data.get('data', '')[:200]}...")
            print(f"Czas: {response_time:.2f}s")
            
            # Sprawdź czy AI próbuje odpowiedzieć na pytanie o pogodę
            response_text = response_data.get("data", "").lower()
            weather_keywords = ["pogoda", "temperatura", "deszcz", "słońce", "stopnie"]
            has_weather_content = any(keyword in response_text for keyword in weather_keywords)
            
            assert has_weather_content or "nie mogę" in response_text, f"AI nie odpowiedział na pytanie o pogodę"
    
    @pytest.mark.asyncio
    async def test_real_llm_conversation_context(self, test_client):
        """Test kontekstu konwersacji z realnym AI"""
        conversation = [
            "Nazywam się Jan Kowalski",
            "Jakie jest moje imię?",
            "Lubię gotować włoskie dania",
            "Co mogę ugotować zgodnie z moimi preferencjami?",
            "Przypomnij mi moje imię"
        ]
        
        conversation_id = None
        
        for i, message in enumerate(conversation, 1):
            print(f"\n--- Wiadomość {i}: {message} ---")
            
            request_data = {"prompt": message}
            if conversation_id:
                request_data["conversation_id"] = conversation_id
            
            response = test_client.post(
                "/api/chat/chat",
                json=request_data
            )
            
            assert response.status_code == 200
            response_data = response.json()
            
            # Zapisz conversation_id z pierwszej odpowiedzi
            if i == 1 and "conversation_id" in response_data:
                conversation_id = response_data["conversation_id"]
            
            print(f"Odpowiedź: {response_data.get('data', '')[:150]}...")
            
            # Sprawdź czy AI pamięta kontekst
            if i == 2:  # "Jakie jest moje imię?"
                response_text = response_data.get("data", "").lower()
                assert "jan" in response_text or "kowalski" in response_text, "AI nie pamięta imienia"
            
            elif i == 4:  # "Co mogę ugotować zgodnie z moimi preferencjami?"
                response_text = response_data.get("data", "").lower()
                italian_keywords = ["włoskie", "pasta", "pizza", "spaghetti", "włochy"]
                has_italian_content = any(keyword in response_text for keyword in italian_keywords)
                assert has_italian_content, "AI nie pamięta preferencji kulinarnych"
    
    @pytest.mark.asyncio
    async def test_real_llm_performance_benchmark(self, test_client):
        """Benchmark wydajności realnego AI"""
        test_prompts = [
            "Krótkie pytanie",
            "Dłuższe pytanie o gotowanie i przepisy kulinarne",
            "Bardzo szczegółowe pytanie o planowanie posiłków na cały tydzień z uwzględnieniem diety wegetariańskiej"
        ]
        
        performance_results = []
        
        for prompt in test_prompts:
            print(f"\n--- Benchmark: {prompt[:30]}... ---")
            
            # Wykonaj 3 testy dla każdego promptu
            times = []
            for _ in range(3):
                start_time = time.time()
                
                response = test_client.post(
                    "/api/chat/chat",
                    json={"prompt": prompt}
                )
                
                end_time = time.time()
                response_time = end_time - start_time
                times.append(response_time)
                
                assert response.status_code == 200
                
                # Krótka przerwa między testami
                await asyncio.sleep(1)
            
            avg_time = sum(times) / len(times)
            min_time = min(times)
            max_time = max(times)
            
            performance_results.append({
                "prompt_length": len(prompt),
                "avg_time": avg_time,
                "min_time": min_time,
                "max_time": max_time
            })
            
            print(f"Średni czas: {avg_time:.2f}s (min: {min_time:.2f}s, max: {max_time:.2f}s)")
        
        # Analiza wyników
        print(f"\n📊 WYNIKI BENCHMARKU:")
        for i, result in enumerate(performance_results, 1):
            print(f"Test {i}: {result['prompt_length']} znaków - {result['avg_time']:.2f}s")
        
        # Sprawdź czy wydajność jest akceptowalna
        for result in performance_results:
            assert result["avg_time"] < 30, f"Za wolna odpowiedź: {result['avg_time']}s"
            assert result["max_time"] < 45, f"Za wolna maksymalna odpowiedź: {result['max_time']}s"
    
    @pytest.mark.asyncio
    async def test_real_llm_error_handling(self, test_client):
        """Test obsługi błędów z realnym AI"""
        problematic_prompts = [
            "",  # Pusty prompt
            "a" * 10000,  # Bardzo długi prompt
            "🤖🚀🎉" * 100,  # Emoji spam
            "SELECT * FROM users; DROP TABLE users;",  # SQL injection attempt
        ]
        
        for prompt in problematic_prompts:
            print(f"\n--- Test błędu: {prompt[:50]}... ---")
            
            response = test_client.post(
                "/api/chat/chat",
                json={"prompt": prompt}
            )
            
            # System powinien obsłużyć błędy gracefully
            if response.status_code == 200:
                response_data = response.json()
                print(f"Odpowiedź: {response_data.get('data', '')[:100]}...")
                
                # Sprawdź czy AI próbuje odpowiedzieć sensownie
                response_text = response_data.get("data", "")
                assert len(response_text) > 0, "Pusta odpowiedź na problematyczny prompt"
            else:
                print(f"Błąd HTTP: {response.status_code}")
                # Sprawdź czy błąd jest obsłużony gracefully
                assert response.status_code in [400, 422], f"Nieoczekiwany kod błędu: {response.status_code}"
    
    @pytest.mark.asyncio
    async def test_real_llm_rag_integration(self, test_client, db_session):
        """Test integracji RAG z realnym AI"""
        session = await anext(db_session)
        try:
            # Dodaj dokumenty do bazy RAG
            rag_documents = [
                {
                    "content": "Przepis na spaghetti carbonara: makaron, jajka, boczek, parmezan, pieprz. Gotuj makaron, podsmaż boczek, wymieszaj z jajkami i serem.",
                    "doc_metadata": {"type": "recipe", "cuisine": "włoska", "difficulty": "łatwe"}
                },
                {
                    "content": "Właściwości zdrowotne brokułów: witamina C, błonnik, przeciwutleniacze. Brokuły są bogate w sulforafan, który ma właściwości przeciwnowotworowe.",
                    "doc_metadata": {"type": "nutrition", "category": "warzywa", "benefits": "zdrowie"}
                },
                {
                    "content": "Przechowywanie żywności: mleko w lodówce 3-5 dni, jajka 3-5 tygodni, mięso mielone 1-2 dni, warzywa 1-2 tygodnie.",
                    "doc_metadata": {"type": "storage", "category": "porady", "importance": "wysoka"}
                }
            ]
            
            for doc_data in rag_documents:
                rag_doc = RAGDocument(
                    content=doc_data["content"],
                    doc_metadata=doc_data["doc_metadata"]
                )
                session.add(rag_doc)
            await session.commit()
            
            # Test zapytań RAG
            rag_questions = [
                "Jak ugotować spaghetti carbonara?",
                "Jakie są właściwości zdrowotne brokułów?",
                "Jak długo można przechowywać mleko?",
                "Co to jest sulforafan?"
            ]
            
            for question in rag_questions:
                print(f"\n--- RAG: {question} ---")
                
                start_time = time.time()
                
                response = test_client.post(
                    "/api/chat/chat",
                    json={"prompt": question}
                )
                
                end_time = time.time()
                response_time = end_time - start_time
                
                assert response.status_code == 200
                response_data = response.json()
                
                print(f"Odpowiedź: {response_data.get('data', '')[:200]}...")
                print(f"Czas: {response_time:.2f}s")
                
                # Sprawdź czy odpowiedź zawiera informacje z dokumentów RAG
                response_text = response_data.get("data", "").lower()
                
                if "carbonara" in question.lower():
                    carbonara_keywords = ["makaron", "jajka", "boczek", "parmezan", "włoska"]
                    has_carbonara_content = any(keyword in response_text for keyword in carbonara_keywords)
                    assert has_carbonara_content, "AI nie użył informacji o carbonara z RAG"
                
                elif "brokuły" in question.lower():
                    broccoli_keywords = ["witamina", "błonnik", "przeciwutleniacze", "sulforafan"]
                    has_broccoli_content = any(keyword in response_text for keyword in broccoli_keywords)
                    assert has_broccoli_content, "AI nie użył informacji o brokułach z RAG"
                
                elif "mleko" in question.lower():
                    milk_keywords = ["lodówka", "dni", "przechowywanie"]
                    has_milk_content = any(keyword in response_text for keyword in milk_keywords)
                    assert has_milk_content, "AI nie użył informacji o przechowywaniu z RAG"
        
        finally:
            await session.close()
    
    @pytest.mark.asyncio
    async def test_real_llm_complex_scenarios(self, test_client):
        """Test złożonych scenariuszy z realnym AI"""
        complex_scenarios = [
            {
                "name": "Planowanie tygodniowego menu",
                "prompt": "Zaplanuj menu na cały tydzień dla 4-osobowej rodziny z uwzględnieniem budżetu 500 zł, preferencji wegetariańskich i alergii na orzechy. Uwzględnij śniadania, obiady i kolacje."
            },
            {
                "name": "Analiza paragonu i porady",
                "prompt": "Kupiłem: mleko 3.2% 2l, chleb razowy 1szt, jajka 10szt, pomidory 500g, kurczak piersi 1kg. Zaplanuj posiłki na 3 dni i podaj porady dotyczące przechowywania."
            },
            {
                "name": "Dieta i zdrowie",
                "prompt": "Jestem na diecie redukcyjnej, ćwiczę 3x w tygodniu, mam 30 lat. Zaplanuj jadłospis na 7 dni z kalorycznością 1800 kcal dziennie, bogaty w białko."
            }
        ]
        
        for scenario in complex_scenarios:
            print(f"\n--- {scenario['name']} ---")
            print(f"Prompt: {scenario['prompt'][:100]}...")
            
            start_time = time.time()
            
            response = test_client.post(
                "/api/chat/chat",
                json={"prompt": scenario["prompt"]}
            )
            
            end_time = time.time()
            response_time = end_time - start_time
            
            assert response.status_code == 200
            response_data = response.json()
            
            response_text = response_data.get("data", "")
            print(f"Odpowiedź: {response_text[:300]}...")
            print(f"Czas: {response_time:.2f}s")
            print(f"Długość odpowiedzi: {len(response_text)} znaków")
            
            # Sprawdź jakość odpowiedzi
            assert len(response_text) > 100, f"Odpowiedź za krótka dla złożonego scenariusza"
            assert response_time < 60, f"Odpowiedź za wolna: {response_time}s"
            
            # Sprawdź czy AI próbuje odpowiedzieć na wszystkie aspekty pytania
            if "menu" in scenario["name"].lower():
                menu_keywords = ["poniedziałek", "wtorek", "środa", "menu", "plan"]
                has_menu_content = any(keyword in response_text.lower() for keyword in menu_keywords)
                assert has_menu_content, "AI nie zaplanował menu"
            
            elif "paragon" in scenario["name"].lower():
                receipt_keywords = ["mleko", "chleb", "jajka", "przechowywanie", "posiłek"]
                has_receipt_content = any(keyword in response_text.lower() for keyword in receipt_keywords)
                assert has_receipt_content, "AI nie przeanalizował paragonu"
            
            elif "dieta" in scenario["name"].lower():
                diet_keywords = ["kalorie", "białko", "dieta", "1800", "redukcyjna"]
                has_diet_content = any(keyword in response_text.lower() for keyword in diet_keywords)
                assert has_diet_content, "AI nie uwzględnił wymagań diety"
    
    def test_real_llm_system_health_under_load(self, test_client):
        """Test zdrowia systemu pod obciążeniem"""
        print("\n--- Test obciążenia systemu ---")
        
        # Wykonaj 10 równoczesnych zapytań
        import threading
        import queue
        
        results = queue.Queue()
        
        def make_request(request_id):
            try:
                start_time = time.time()
                response = test_client.post(
                    "/api/chat/chat",
                    json={"prompt": f"Krótkie pytanie testowe #{request_id}"}
                )
                end_time = time.time()
                
                results.put({
                    "id": request_id,
                    "status_code": response.status_code,
                    "response_time": end_time - start_time,
                    "success": response.status_code == 200
                })
            except Exception as e:
                results.put({
                    "id": request_id,
                    "error": str(e),
                    "success": False
                })
        
        # Uruchom 10 wątków
        threads = []
        for i in range(10):
            thread = threading.Thread(target=make_request, args=(i,))
            threads.append(thread)
            thread.start()
        
        # Czekaj na zakończenie wszystkich wątków
        for thread in threads:
            thread.join()
        
        # Zbierz wyniki
        test_results = []
        while not results.empty():
            test_results.append(results.get())
        
        # Analiza wyników
        successful_requests = [r for r in test_results if r["success"]]
        failed_requests = [r for r in test_results if not r["success"]]
        
        print(f"✅ Udane zapytania: {len(successful_requests)}/10")
        print(f"❌ Nieudane zapytania: {len(failed_requests)}/10")
        
        if successful_requests:
            avg_response_time = sum(r["response_time"] for r in successful_requests) / len(successful_requests)
            max_response_time = max(r["response_time"] for r in successful_requests)
            min_response_time = min(r["response_time"] for r in successful_requests)
            
            print(f"📊 Średni czas odpowiedzi: {avg_response_time:.2f}s")
            print(f"📊 Min czas: {min_response_time:.2f}s, Max czas: {max_response_time:.2f}s")
        
        # Sprawdź czy system radzi sobie z obciążeniem
        success_rate = len(successful_requests) / len(test_results)
        assert success_rate >= 0.8, f"Za niski współczynnik sukcesu: {success_rate:.2%}"
        
        if successful_requests:
            avg_time = sum(r["response_time"] for r in successful_requests) / len(successful_requests)
            assert avg_time < 30, f"Za wolna średnia odpowiedź pod obciążeniem: {avg_time:.2f}s"
    
    def test_real_llm_final_integration(self, test_client):
        """Finalny test integracji wszystkich komponentów z realnym AI"""
        print("\n--- FINALNY TEST INTEGRACJI ---")
        
        # Kompleksowy scenariusz użytkownika
        user_scenario = [
            "Cześć! Nazywam się Anna i szukam pomocy w zarządzaniu żywnością.",
            "Kupiłem dzisiaj: mleko 2l, chleb, jajka 10szt, pomidory 500g, kurczak 1kg.",
            "Jak długo mogę przechowywać te produkty?",
            "Zaplanuj posiłki na 3 dni z tych produktów.",
            "Czy te produkty są zdrowe?",
            "Dziękuję za pomoc!"
        ]
        
        conversation_id = None
        total_response_time = 0
        responses = []
        
        for i, message in enumerate(user_scenario, 1):
            print(f"\n--- Krok {i}: {message} ---")
            
            request_data = {"prompt": message}
            if conversation_id:
                request_data["conversation_id"] = conversation_id
            
            start_time = time.time()
            
            response = test_client.post(
                "/api/chat/chat",
                json=request_data
            )
            
            end_time = time.time()
            response_time = end_time - start_time
            total_response_time += response_time
            
            assert response.status_code == 200, f"Błąd w kroku {i}: {response.status_code}"
            
            response_data = response.json()
            
            # Zapisz conversation_id
            if i == 1 and "conversation_id" in response_data:
                conversation_id = response_data["conversation_id"]
            
            response_text = response_data.get("data", "")
            responses.append({
                "step": i,
                "user_message": message,
                "ai_response": response_text,
                "response_time": response_time
            })
            
            print(f"AI: {response_text[:150]}...")
            print(f"Czas: {response_time:.2f}s")
        
        # Analiza końcowa
        print(f"\n📊 PODSUMOWANIE INTEGRACJI:")
        print(f"Łączny czas: {total_response_time:.2f}s")
        print(f"Średni czas na krok: {total_response_time/len(user_scenario):.2f}s")
        print(f"Liczba kroków: {len(user_scenario)}")
        
        # Sprawdź jakość całej konwersacji
        assert total_response_time < 300, f"Całkowity czas za długi: {total_response_time}s"
        
        # Sprawdź czy AI pamięta kontekst przez całą konwersację
        final_response = responses[-1]["ai_response"].lower()
        context_keywords = ["anna", "mleko", "chleb", "jajka", "pomidory", "kurczak"]
        has_context = any(keyword in final_response for keyword in context_keywords)
        
        assert has_context, "AI stracił kontekst w końcowej odpowiedzi"
        
        print("✅ FINALNY TEST INTEGRACJI ZAKOŃCZONY SUKCESEM!")
        print("🎉 System AI działa poprawnie z rzeczywistymi modelami LLM!")


if __name__ == "__main__":
    # Uruchom testy z realnymi modelami
    pytest.main([__file__, "-v", "-s"]) 