"""
Testy E2E dla modelu Gemma 3 12B - szczegółowe porównanie i analiza
"""

import asyncio
import json
import time
from typing import Dict, List, Any
import pytest
import httpx
from datetime import datetime

# Konfiguracja testów
MODEL_NAME = "gemma3:12b"
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

class TestGemma312BE2E:
    """Testy E2E dla modelu Gemma 3 12B z pełnymi logami i analizą odpowiedzi"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup przed każdym testem"""
        self.results = []
        self.start_time = time.time()
        
    def log_test_result(self, test_name: str, prompt: str, response: str, 
                       response_time: float, response_length: int, 
                       additional_info: Dict[str, Any] = None):
        """Loguje szczegółowe wyniki testu"""
        result = {
            "test_name": test_name,
            "model": MODEL_NAME,
            "timestamp": datetime.now().isoformat(),
            "prompt": prompt,
            "response": response,
            "response_time_seconds": response_time,
            "response_length_chars": response_length,
            "response_length_words": len(response.split()),
            "additional_info": additional_info or {}
        }
        self.results.append(result)
        
        # Wyświetl szczegółowe informacje
        print(f"\n{'='*80}")
        print(f"TEST: {test_name}")
        print(f"MODEL: {MODEL_NAME}")
        print(f"CZAS ODPOWIEDZI: {response_time:.2f}s")
        print(f"DŁUGOŚĆ ODPOWIEDZI: {response_length} znaków ({len(response.split())} słów)")
        print(f"PROMPT: {prompt}")
        print(f"ODPOWIEDŹ: {response}")
        if additional_info:
            print(f"DODATKOWE INFO: {json.dumps(additional_info, indent=2, ensure_ascii=False)}")
        print(f"{'='*80}\n")

    @pytest.mark.asyncio
    @pytest.mark.real_llm
    async def test_gemma3_food_knowledge(self):
        """Test wiedzy o jedzeniu i żywieniu"""
        test_prompts = [
            "Jakie są korzyści zdrowotne jedzenia awokado?",
            "Czy można zamrozić świeże warzywa? Jak to zrobić?",
            "Jakie są najlepsze źródła białka roślinnego?",
            "Jak długo można przechowywać ugotowany ryż w lodówce?",
            "Jakie przyprawy pasują do kurczaka?"
        ]
        
        async with httpx.AsyncClient() as client:
            for i, prompt in enumerate(test_prompts, 1):
                start_time = time.time()
                
                response = await client.post(
                    f"{API_BASE}/chat/chat",
                    json={
                        "message": prompt,
                        "model": MODEL_NAME,
                        "stream": False
                    },
                    timeout=60.0
                )
                
                response_time = time.time() - start_time
                
                assert response.status_code == 200
                data = response.json()
                response_text = data.get("response", "")
                
                self.log_test_result(
                    f"food_knowledge_{i}",
                    prompt,
                    response_text,
                    response_time,
                    len(response_text),
                    {
                        "prompt_number": i,
                        "total_prompts": len(test_prompts),
                        "response_contains_nutrition": "żywienie" in response_text.lower() or "odżywczy" in response_text.lower(),
                        "response_contains_safety": "bezpieczeństwo" in response_text.lower() or "przechowywanie" in response_text.lower()
                    }
                )

    @pytest.mark.asyncio
    @pytest.mark.real_llm
    async def test_gemma3_meal_planning(self):
        """Test planowania posiłków"""
        test_prompts = [
            "Zaplanuj tygodniowe menu dla 2 osób, budżet 200 zł",
            "Przygotuj plan posiłków dla osoby na diecie wegetariańskiej",
            "Jakie dania można przygotować z ziemniaków, marchewki i cebuli?",
            "Zaplanuj obiad na 4 osoby w 30 minut",
            "Jakie śniadanie będzie dobre dla dziecka w wieku 8 lat?"
        ]
        
        async with httpx.AsyncClient() as client:
            for i, prompt in enumerate(test_prompts, 1):
                start_time = time.time()
                
                response = await client.post(
                    f"{API_BASE}/chat/chat",
                    json={
                        "message": prompt,
                        "model": MODEL_NAME,
                        "stream": False
                    },
                    timeout=60.0
                )
                
                response_time = time.time() - start_time
                
                assert response.status_code == 200
                data = response.json()
                response_text = data.get("response", "")
                
                self.log_test_result(
                    f"meal_planning_{i}",
                    prompt,
                    response_text,
                    response_time,
                    len(response_text),
                    {
                        "prompt_number": i,
                        "total_prompts": len(test_prompts),
                        "contains_menu": "menu" in response_text.lower() or "plan" in response_text.lower(),
                        "contains_budget": "budżet" in response_text.lower() or "zł" in response_text.lower(),
                        "contains_time": any(word in response_text.lower() for word in ["minut", "godzin", "czas"])
                    }
                )

    @pytest.mark.asyncio
    @pytest.mark.real_llm
    async def test_gemma3_recipe_generation(self):
        """Test generowania przepisów"""
        test_prompts = [
            "Przepis na domowe ciasto czekoladowe",
            "Jak ugotować idealny ryż basmati?",
            "Przepis na zupę pomidorową",
            "Jak zrobić domowy chleb bez drożdży?",
            "Przepis na sałatkę z tuńczykiem"
        ]
        
        async with httpx.AsyncClient() as client:
            for i, prompt in enumerate(test_prompts, 1):
                start_time = time.time()
                
                response = await client.post(
                    f"{API_BASE}/chat/chat",
                    json={
                        "message": prompt,
                        "model": MODEL_NAME,
                        "stream": False
                    },
                    timeout=60.0
                )
                
                response_time = time.time() - start_time
                
                assert response.status_code == 200
                data = response.json()
                response_text = data.get("response", "")
                
                self.log_test_result(
                    f"recipe_generation_{i}",
                    prompt,
                    response_text,
                    response_time,
                    len(response_text),
                    {
                        "prompt_number": i,
                        "total_prompts": len(test_prompts),
                        "contains_ingredients": "składniki" in response_text.lower() or "potrzebne" in response_text.lower(),
                        "contains_steps": "krok" in response_text.lower() or "sposób" in response_text.lower(),
                        "contains_measurements": any(word in response_text.lower() for word in ["gram", "ml", "łyżka", "szklanka"])
                    }
                )

    @pytest.mark.asyncio
    @pytest.mark.real_llm
    async def test_gemma3_conversation_context(self):
        """Test kontekstu konwersacji"""
        conversation = [
            "Cześć! Nazywam się Anna i szukam pomysłów na obiad.",
            "Lubię włoską kuchnię. Co polecasz?",
            "A co z deserem? Mam ochotę na coś słodkiego.",
            "Dziękuję! A czy możesz mi powiedzieć, co wcześniej polecałeś na obiad?"
        ]
        
        async with httpx.AsyncClient() as client:
            for i, message in enumerate(conversation, 1):
                start_time = time.time()
                
                response = await client.post(
                    f"{API_BASE}/chat/chat",
                    json={
                        "message": message,
                        "model": MODEL_NAME,
                        "stream": False
                    },
                    timeout=60.0
                )
                
                response_time = time.time() - start_time
                
                assert response.status_code == 200
                data = response.json()
                response_text = data.get("response", "")
                
                self.log_test_result(
                    f"conversation_context_{i}",
                    message,
                    response_text,
                    response_time,
                    len(response_text),
                    {
                        "conversation_step": i,
                        "total_steps": len(conversation),
                        "mentions_anna": "anna" in response_text.lower(),
                        "mentions_italian": "włoski" in response_text.lower() or "włoska" in response_text.lower(),
                        "mentions_dessert": "deser" in response_text.lower() or "słodki" in response_text.lower(),
                        "remembers_previous": i > 1 and any(word in response_text.lower() for word in ["wcześniej", "wspomniany", "polecał"])
                    }
                )

    @pytest.mark.asyncio
    @pytest.mark.real_llm
    async def test_gemma3_error_handling(self):
        """Test obsługi błędów i nietypowych zapytań"""
        test_prompts = [
            "",  # Pusty prompt
            "x" * 1000,  # Bardzo długi prompt
            "Jak ugotować nieistniejące warzywo XYZ123?",
            "Przepis na danie z 50 składników w 5 minut",
            "Co to jest 2+2 w kontekście gotowania?"
        ]
        
        async with httpx.AsyncClient() as client:
            for i, prompt in enumerate(test_prompts, 1):
                start_time = time.time()
                
                try:
                    response = await client.post(
                        f"{API_BASE}/chat/chat",
                        json={
                            "message": prompt,
                            "model": MODEL_NAME,
                            "stream": False
                        },
                        timeout=60.0
                    )
                    
                    response_time = time.time() - start_time
                    
                    if response.status_code == 200:
                        data = response.json()
                        response_text = data.get("response", "")
                    else:
                        response_text = f"ERROR: {response.status_code} - {response.text}"
                    
                except Exception as e:
                    response_time = time.time() - start_time
                    response_text = f"EXCEPTION: {str(e)}"
                
                self.log_test_result(
                    f"error_handling_{i}",
                    prompt[:100] + "..." if len(prompt) > 100 else prompt,
                    response_text,
                    response_time,
                    len(response_text),
                    {
                        "prompt_number": i,
                        "total_prompts": len(test_prompts),
                        "prompt_length": len(prompt),
                        "is_empty": len(prompt.strip()) == 0,
                        "is_very_long": len(prompt) > 500,
                        "contains_nonsense": "xyz123" in prompt.lower(),
                        "handled_gracefully": "error" not in response_text.lower() or "exception" not in response_text.lower()
                    }
                )

    @pytest.mark.asyncio
    @pytest.mark.real_llm
    async def test_gemma3_performance_benchmark(self):
        """Test wydajności - szybkie odpowiedzi"""
        test_prompts = [
            "Tak",
            "Nie",
            "Dziękuję",
            "OK",
            "Rozumiem"
        ]
        
        async with httpx.AsyncClient() as client:
            total_time = 0
            total_responses = 0
            
            for i, prompt in enumerate(test_prompts, 1):
                start_time = time.time()
                
                response = await client.post(
                    f"{API_BASE}/chat/chat",
                    json={
                        "message": prompt,
                        "model": MODEL_NAME,
                        "stream": False
                    },
                    timeout=30.0
                )
                
                response_time = time.time() - start_time
                total_time += response_time
                total_responses += 1
                
                assert response.status_code == 200
                data = response.json()
                response_text = data.get("response", "")
                
                self.log_test_result(
                    f"performance_{i}",
                    prompt,
                    response_text,
                    response_time,
                    len(response_text),
                    {
                        "prompt_number": i,
                        "total_prompts": len(test_prompts),
                        "is_fast_response": response_time < 5.0,
                        "response_quality": len(response_text) > 0
                    }
                )
            
            avg_time = total_time / total_responses if total_responses > 0 else 0
            print(f"\n{'='*80}")
            print(f"WYDAJNOŚĆ GEMMA 3 12B:")
            print(f"Średni czas odpowiedzi: {avg_time:.2f}s")
            print(f"Liczba testów: {total_responses}")
            print(f"Całkowity czas: {total_time:.2f}s")
            print(f"{'='*80}\n")

    @pytest.mark.asyncio
    @pytest.mark.real_llm
    async def test_gemma3_streaming_quality(self):
        """Test jakości streamowania"""
        test_prompt = "Opowiedz mi szczegółowo o historii kuchni włoskiej i jej wpływie na światową gastronomię."
        
        async with httpx.AsyncClient() as client:
            start_time = time.time()
            
            async with client.stream(
                "POST",
                f"{API_BASE}/chat/chat",
                json={
                    "message": test_prompt,
                    "model": MODEL_NAME,
                    "stream": True
                },
                timeout=120.0
            ) as response:
                
                assert response.status_code == 200
                
                full_response = ""
                chunks_received = 0
                first_chunk_time = None
                last_chunk_time = None
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        chunk_data = line[6:]  # Remove "data: " prefix
                        if chunk_data.strip() == "[DONE]":
                            break
                        
                        try:
                            chunk = json.loads(chunk_data)
                            chunk_text = chunk.get("response", "")
                            full_response += chunk_text
                            chunks_received += 1
                            
                            if first_chunk_time is None:
                                first_chunk_time = time.time()
                            last_chunk_time = time.time()
                            
                        except json.JSONDecodeError:
                            continue
                
                total_time = time.time() - start_time
                streaming_duration = last_chunk_time - first_chunk_time if first_chunk_time and last_chunk_time else 0
                
                self.log_test_result(
                    "streaming_quality",
                    test_prompt,
                    full_response,
                    total_time,
                    len(full_response),
                    {
                        "chunks_received": chunks_received,
                        "streaming_duration": streaming_duration,
                        "time_to_first_chunk": first_chunk_time - start_time if first_chunk_time else 0,
                        "avg_chunk_size": len(full_response) / chunks_received if chunks_received > 0 else 0,
                        "contains_italian_history": "włoski" in full_response.lower() or "włochy" in full_response.lower(),
                        "contains_gastronomy": "gastronom" in full_response.lower() or "kuchni" in full_response.lower()
                    }
                )

    def teardown_method(self):
        """Zapisuje wyniki testów do pliku"""
        if self.results:
            total_time = time.time() - self.start_time
            
            summary = {
                "model": MODEL_NAME,
                "test_timestamp": datetime.now().isoformat(),
                "total_tests": len(self.results),
                "total_time_seconds": total_time,
                "average_response_time": sum(r["response_time_seconds"] for r in self.results) / len(self.results),
                "total_responses_length": sum(r["response_length_chars"] for r in self.results),
                "average_response_length": sum(r["response_length_chars"] for r in self.results) / len(self.results),
                "results": self.results
            }
            
            # Zapisz do pliku
            filename = f"test_results_gemma3_12b_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(summary, f, indent=2, ensure_ascii=False)
            
            print(f"\n{'='*80}")
            print(f"PODSUMOWANIE TESTÓW GEMMA 3 12B:")
            print(f"Liczba testów: {len(self.results)}")
            print(f"Całkowity czas: {total_time:.2f}s")
            print(f"Średni czas odpowiedzi: {summary['average_response_time']:.2f}s")
            print(f"Średnia długość odpowiedzi: {summary['average_response_length']:.0f} znaków")
            print(f"Wyniki zapisane do: {filename}")
            print(f"{'='*80}\n")
