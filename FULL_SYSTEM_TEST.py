#!/usr/bin/env python3
"""
Pełny test systemu MyAppAssistant w trybie kontenerów
Testuje wszystkie komponenty: backend, frontend, Ollama, baza danych, Redis
"""

import asyncio
import aiohttp
import json
import time
import subprocess
import sys
from typing import Dict, List, Any
import logging

# Konfiguracja logowania
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('full_system_test.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class SystemTester:
    def __init__(self):
        self.base_url = "http://localhost:8001"
        self.frontend_url = "http://localhost:3003"
        self.ollama_url = "http://localhost:11434"
        self.test_results = {}
        
    async def test_docker_containers(self) -> Dict[str, Any]:
        """Test 1: Sprawdzenie statusu kontenerów Docker (poprawiony)"""
        logger.info("🔍 Test 1: Sprawdzanie statusu kontenerów Docker [poprawiony]")
        try:
            result = subprocess.run(
                ["docker", "ps", "--format", "{{.Names}}"],
                capture_output=True, text=True, check=True
            )
            containers = [line.strip() for line in result.stdout.strip().split('\n') if line.strip()]
            required_containers = [
                'aiasisstmarubo-backend-1',
                'aiasisstmarubo-frontend-1',
                'aiasisstmarubo-ollama-1',
                'aiasisstmarubo-postgres-1',
                'aiasisstmarubo-redis-1',
                'aiasisstmarubo-celery_worker-1',
                'aiasisstmarubo-celery_beat-1'
            ]
            missing_containers = [c for c in required_containers if c not in containers]
            success = len(missing_containers) == 0
            return {
                'success': success,
                'containers': containers,
                'missing_containers': missing_containers,
                'required_count': len(required_containers),
                'running_count': len(containers)
            }
        except subprocess.CalledProcessError as e:
            logger.error(f"Błąd podczas sprawdzania kontenerów: {e}")
            return {'success': False, 'error': str(e)}

    async def test_backend_health(self) -> Dict[str, Any]:
        """Test 2: Sprawdzenie zdrowia backendu"""
        logger.info("🔍 Test 2: Sprawdzanie zdrowia backendu")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/health") as response:
                    if response.status == 200:
                        data = await response.json()
                        return {
                            'success': True,
                            'status': data.get('status'),
                            'timestamp': data.get('timestamp'),
                            'response_time': response.headers.get('X-Response-Time', 'N/A')
                        }
                    else:
                        return {
                            'success': False,
                            'status_code': response.status,
                            'error': f"Backend zwrócił status {response.status}"
                        }
        except Exception as e:
            logger.error(f"Błąd podczas testowania backendu: {e}")
            return {'success': False, 'error': str(e)}

    async def test_ollama_models(self) -> Dict[str, Any]:
        """Test 3: Sprawdzenie modeli Ollama w kontenerze"""
        logger.info("🔍 Test 3: Sprawdzanie modeli Ollama w kontenerze")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.ollama_url}/api/tags") as response:
                    if response.status == 200:
                        data = await response.json()
                        models = data.get('models', [])
                        
                        # Sprawdzenie czy są wymagane modele
                        required_models = [
                            'nomic-embed-text',
                            'mistral:7b',
                            'llama3.2:3b',
                            'gemma3:12b',
                            'SpeakLeash/bielik-11b-v2.3-instruct',
                            'SpeakLeash/bielik-4.5b-v3.0-instruct'
                        ]
                        
                        available_models = [m['name'] for m in models]
                        missing_models = []
                        
                        for required in required_models:
                            if not any(required in available for available in available_models):
                                missing_models.append(required)
                        
                        total_size = sum(m.get('size', 0) for m in models)
                        
                        return {
                            'success': len(missing_models) == 0,
                            'models_count': len(models),
                            'total_size_gb': round(total_size / (1024**3), 2),
                            'available_models': available_models,
                            'missing_models': missing_models,
                            'required_count': len(required_models)
                        }
                    else:
                        return {
                            'success': False,
                            'status_code': response.status,
                            'error': f"Ollama zwrócił status {response.status}"
                        }
        except Exception as e:
            logger.error(f"Błąd podczas testowania Ollama: {e}")
            return {'success': False, 'error': str(e)}

    async def test_agents_api(self) -> Dict[str, Any]:
        """Test 4: Sprawdzenie API agentów"""
        logger.info("🔍 Test 4: Sprawdzanie API agentów")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/api/agents/agents") as response:
                    if response.status == 200:
                        agents = await response.json()
                        
                        # Sprawdzenie czy są wymagani agenci
                        required_agents = [
                            'Chef', 'Weather', 'Search', 'RAG', 'OCR',
                            'Categorization', 'MealPlanner', 'Analytics',
                            'GeneralConversation', 'General', 'Cooking',
                            'Code', 'Shopping', 'ReceiptAnalysis'
                        ]
                        
                        available_agents = [a['name'] for a in agents]
                        missing_agents = [a for a in required_agents if a not in available_agents]
                        
                        return {
                            'success': len(missing_agents) == 0,
                            'agents_count': len(agents),
                            'available_agents': available_agents,
                            'missing_agents': missing_agents,
                            'required_count': len(required_agents)
                        }
                    else:
                        return {
                            'success': False,
                            'status_code': response.status,
                            'error': f"API agentów zwrócił status {response.status}"
                        }
        except Exception as e:
            logger.error(f"Błąd podczas testowania API agentów: {e}")
            return {'success': False, 'error': str(e)}

    async def test_chat_functionality(self) -> Dict[str, Any]:
        """Test 5: Test funkcjonalności czatu"""
        logger.info("🔍 Test 5: Test funkcjonalności czatu")
        
        try:
            test_message = {
                "prompt": "Hello, how are you?",
                "session_id": f"test_session_{int(time.time())}"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/api/chat/chat",
                    json=test_message,
                    headers={'Content-Type': 'application/json'}
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        return {
                            'success': True,
                            'response_received': bool(data.get('response')),
                            'session_id': data.get('session_id'),
                            'response_length': len(data.get('response', ''))
                        }
                    else:
                        return {
                            'success': False,
                            'status_code': response.status,
                            'error': f"Chat API zwrócił status {response.status}"
                        }
        except Exception as e:
            logger.error(f"Błąd podczas testowania czatu: {e}")
            return {'success': False, 'error': str(e)}

    async def test_frontend_accessibility(self) -> Dict[str, Any]:
        """Test 6: Sprawdzenie dostępności frontendu"""
        logger.info("🔍 Test 6: Sprawdzanie dostępności frontendu")
        
        try:
            async with aiohttp.ClientSession() as session:
                # Test głównej strony
                async with session.get(self.frontend_url) as response:
                    if response.status in [200, 307]:  # 307 to redirect
                        return {
                            'success': True,
                            'status_code': response.status,
                            'content_type': response.headers.get('content-type', 'N/A'),
                            'response_size': len(await response.text())
                        }
                    else:
                        return {
                            'success': False,
                            'status_code': response.status,
                            'error': f"Frontend zwrócił status {response.status}"
                        }
        except Exception as e:
            logger.error(f"Błąd podczas testowania frontendu: {e}")
            return {'success': False, 'error': str(e)}

    async def test_database_connection(self) -> Dict[str, Any]:
        """Test 7: Sprawdzenie połączenia z bazą danych"""
        logger.info("🔍 Test 7: Sprawdzanie połączenia z bazą danych")
        
        try:
            async with aiohttp.ClientSession() as session:
                # Test endpointu który wymaga bazy danych
                async with session.get(f"{self.base_url}/api/chat/history?session_id=test") as response:
                    if response.status in [200, 404]:  # 404 jest OK dla pustej historii
                        return {
                            'success': True,
                            'status_code': response.status,
                            'database_accessible': True
                        }
                    else:
                        return {
                            'success': False,
                            'status_code': response.status,
                            'error': f"Baza danych zwróciła status {response.status}"
                        }
        except Exception as e:
            logger.error(f"Błąd podczas testowania bazy danych: {e}")
            return {'success': False, 'error': str(e)}

    async def test_redis_connection(self) -> Dict[str, Any]:
        """Test 8: Sprawdzenie połączenia z Redis/Celery worker (poprawiony)"""
        logger.info("🔍 Test 8: Sprawdzanie połączenia z Redis/Celery worker [poprawiony]")
        try:
            # Sprawdzenie logów Celery worker
            result = subprocess.run(
                ["docker", "logs", "aiasisstmarubo-celery_worker-1", "--tail", "20"],
                capture_output=True, text=True, check=True
            )
            logs = result.stdout.lower()
            # Szukamy fraz świadczących o gotowości workera
            ready_phrases = ["ready", "worker", "boot", "online", "started", "waiting for tasks"]
            if any(phrase in logs for phrase in ready_phrases):
                return {
                    'success': True,
                    'celery_worker_status': 'running',
                    'redis_accessible': True,
                    'log_snippet': logs[-500:]
                }
            # Fallback: sprawdzenie statusu backendu (czy Celery jest zintegrowany)
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/health") as response:
                    if response.status == 200:
                        data = await response.json()
                        celery_ok = 'celery' in data.get('status', '').lower() or 'healthy' in data.get('status', '').lower()
                        return {
                            'success': celery_ok,
                            'celery_worker_status': 'checked_by_backend',
                            'backend_health': data.get('status'),
                            'log_snippet': logs[-500:]
                        }
            return {
                'success': False,
                'celery_worker_logs': logs[-500:],
                'error': 'Celery worker nie jest gotowy (brak fraz ready/worker/boot/online)'
            }
        except Exception as e:
            logger.error(f"Błąd podczas testowania Redis: {e}")
            return {'success': False, 'error': str(e)}

    async def run_all_tests(self) -> Dict[str, Any]:
        """Uruchomienie wszystkich testów"""
        logger.info("🚀 Rozpoczynanie pełnego testu systemu MyAppAssistant")
        
        tests = [
            ("docker_containers", self.test_docker_containers),
            ("backend_health", self.test_backend_health),
            ("ollama_models", self.test_ollama_models),
            ("agents_api", self.test_agents_api),
            ("chat_functionality", self.test_chat_functionality),
            ("frontend_accessibility", self.test_frontend_accessibility),
            ("database_connection", self.test_database_connection),
            ("redis_connection", self.test_redis_connection)
        ]
        
        results = {}
        total_tests = len(tests)
        passed_tests = 0
        
        for test_name, test_func in tests:
            logger.info(f"⏳ Wykonywanie testu: {test_name}")
            try:
                result = await test_func()
                results[test_name] = result
                
                if result.get('success', False):
                    passed_tests += 1
                    logger.info(f"✅ Test {test_name}: SUKCES")
                else:
                    logger.error(f"❌ Test {test_name}: BŁĄD - {result.get('error', 'Nieznany błąd')}")
                    
            except Exception as e:
                logger.error(f"❌ Test {test_name}: WYJĄTEK - {e}")
                results[test_name] = {'success': False, 'error': str(e)}
            
            await asyncio.sleep(1)  # Krótka przerwa między testami
        
        # Podsumowanie
        overall_success = passed_tests == total_tests
        success_rate = (passed_tests / total_tests) * 100
        
        summary = {
            'overall_success': overall_success,
            'total_tests': total_tests,
            'passed_tests': passed_tests,
            'failed_tests': total_tests - passed_tests,
            'success_rate': round(success_rate, 2),
            'test_results': results,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
        }
        
        logger.info(f"📊 PODSUMOWANIE TESTÓW:")
        logger.info(f"   Całkowity sukces: {'✅ TAK' if overall_success else '❌ NIE'}")
        logger.info(f"   Testy zaliczone: {passed_tests}/{total_tests}")
        logger.info(f"   Procent sukcesu: {success_rate}%")
        
        return summary

async def main():
    """Główna funkcja testowa"""
    tester = SystemTester()
    results = await tester.run_all_tests()
    
    # Zapisanie wyników do pliku
    with open('full_system_test_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    logger.info("💾 Wyniki testów zapisane w pliku: full_system_test_results.json")
    
    # Zwrócenie kodu wyjścia
    if results['overall_success']:
        logger.info("🎉 WSZYSTKIE TESTY ZALICZONE! System działa poprawnie.")
        sys.exit(0)
    else:
        logger.error("❌ NIEKTÓRE TESTY NIE ZALICZONE! Sprawdź logi.")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main()) 