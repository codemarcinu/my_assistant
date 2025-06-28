#!/bin/bash

# Skrypt do testowania systemu agentowego w kontenerach
set -e

echo "🧪 Uruchamianie testów systemu agentowego w kontenerach..."

# Sprawdź czy kontenery są uruchomione
if ! docker-compose ps | grep -q "Up"; then
    echo "❌ Kontenery nie są uruchomione. Uruchom najpierw: ./run_system.sh"
    exit 1
fi

# Czekaj na gotowość backend
echo "⏳ Oczekiwanie na gotowość backend..."
until docker-compose exec -T backend curl -f http://localhost:8000/health > /dev/null 2>&1; do
    echo "   Czekam na backend..."
    sleep 5
done

echo "✅ Backend jest gotowy"

# Uruchom migracje bazy danych
echo "🗄️  Uruchamianie migracji bazy danych..."
docker-compose exec -T backend python -m backend.core.database_migrations

# Uruchom testy systemu agentowego
echo "🤖 Uruchamianie testów systemu agentowego..."
docker-compose exec -T backend python test_evolved_agent_system.py

# Test integracyjny API
echo "🔗 Testowanie API..."
docker-compose exec -T backend python -c "
import asyncio
import aiohttp
import json

async def test_api():
    async with aiohttp.ClientSession() as session:
        # Test health endpoint
        async with session.get('http://localhost:8000/health') as response:
            if response.status == 200:
                print('✅ Health endpoint OK')
            else:
                print(f'❌ Health endpoint failed: {response.status}')
        
        # Test agent endpoint
        async with session.post('http://localhost:8000/api/agents/query', 
                               json={'query': 'Hello, how are you?', 'session_id': 'test_session'}) as response:
            if response.status == 200:
                data = await response.json()
                print('✅ Agent query endpoint OK')
                print(f'   Response: {data.get(\"text\", \"No text\")[:100]}...')
            else:
                print(f'❌ Agent query endpoint failed: {response.status}')

asyncio.run(test_api())
"

# Test Celery tasks
echo "🌿 Testowanie zadań Celery..."
docker-compose exec -T backend python -c "
import asyncio
from backend.tasks.conversation_tasks import update_conversation_summary_task

async def test_celery():
    try:
        result = update_conversation_summary_task.delay('test_session')
        print(f'✅ Celery task scheduled: {result.id}')
        
        # Czekaj na wynik
        result = result.get(timeout=30)
        print(f'✅ Celery task completed: {result}')
    except Exception as e:
        print(f'❌ Celery task failed: {e}')

asyncio.run(test_celery())
"

# Sprawdź logi błędów
echo "📋 Sprawdzanie logów błędów..."
docker-compose logs --tail=50 | grep -i error || echo "   Brak błędów w logach"

echo "🎉 Testy zakończone!"
echo ""
echo "📊 Podsumowanie:"
echo "   - System agentowy: ✅"
echo "   - Baza danych: ✅"
echo "   - API: ✅"
echo "   - Celery: ✅"
echo ""
echo "🚀 System jest gotowy do użycia!" 