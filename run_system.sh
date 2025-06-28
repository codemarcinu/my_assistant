#!/bin/bash

# Skrypt do uruchamiania systemu agentowego w kontenerach
set -e

echo "🚀 Uruchamianie systemu agentowego AI..."

# Sprawdź czy Docker i Docker Compose są dostępne
if ! command -v docker &> /dev/null; then
    echo "❌ Docker nie jest zainstalowany"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose nie jest zainstalowany"
    exit 1
fi

# Zatrzymaj istniejące kontenery
echo "🛑 Zatrzymywanie istniejących kontenerów..."
docker-compose down

# Wyczyść nieużywane obrazy i kontenery
echo "🧹 Czyszczenie nieużywanych zasobów..."
docker system prune -f

# Uruchom system
echo "🔧 Uruchamianie systemu..."
docker-compose up -d

# Czekaj na gotowość serwisów
echo "⏳ Oczekiwanie na gotowość serwisów..."
sleep 30

# Sprawdź status serwisów
echo "📊 Sprawdzanie statusu serwisów..."
docker-compose ps

# Sprawdź logi
echo "📋 Logi systemu:"
docker-compose logs --tail=20

# Test połączenia z bazą danych
echo "🔍 Testowanie połączenia z bazą danych..."
docker-compose exec backend python -c "
import asyncio
from backend.core.database import check_db_connection, get_db_info

async def test_db():
    connected = await check_db_connection()
    if connected:
        print('✅ Połączenie z bazą danych OK')
        info = await get_db_info()
        print(f'📊 Informacje o bazie: {info}')
    else:
        print('❌ Błąd połączenia z bazą danych')

asyncio.run(test_db())
"

# Test systemu agentowego
echo "🤖 Testowanie systemu agentowego..."
docker-compose exec backend python -c "
import asyncio
import sys
sys.path.insert(0, '/app')

from backend.agents.orchestrator import Orchestrator
from backend.core.database import get_db

async def test_agent_system():
    try:
        async for db in get_db():
            orchestrator = Orchestrator(db_session=db, use_planner_executor=True)
            await orchestrator.initialize()
            print('✅ System agentowy zainicjalizowany pomyślnie')
            
            # Test prostego zapytania
            response = await orchestrator.process_query('Hello, how are you?', 'test_session')
            if response:
                print('✅ Test zapytania zakończony pomyślnie')
            else:
                print('❌ Test zapytania nie powiódł się')
            break
    except Exception as e:
        print(f'❌ Błąd testu systemu agentowego: {e}')

asyncio.run(test_agent_system())
"

# Sprawdź status Celery
echo "🌿 Sprawdzanie statusu Celery..."
docker-compose exec backend celery -A backend.config.celery_config inspect active

echo "🎉 System agentowy jest gotowy!"
echo ""
echo "📱 Dostępne serwisy:"
echo "   - Backend API: http://localhost:8000"
echo "   - Frontend: http://localhost:3000"
echo "   - Ollama: http://localhost:11434"
echo "   - Redis: localhost:6379"
echo "   - PostgreSQL: localhost:5432"
echo ""
echo "📋 Przydatne komendy:"
echo "   - Logi: docker-compose logs -f"
echo "   - Zatrzymanie: docker-compose down"
echo "   - Restart: docker-compose restart"
echo "   - Shell backend: docker-compose exec backend bash"
echo ""
echo "🔧 Aby uruchomić testy w kontenerze:"
echo "   docker-compose exec backend python test_evolved_agent_system.py" 