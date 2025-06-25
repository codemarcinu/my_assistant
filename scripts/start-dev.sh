#!/bin/bash

# FoodSave AI - Quick Start Development Environment
# Szybki skrypt do uruchomienia środowiska developerskiego

set -e

echo "🚀 FoodSave AI - Uruchamianie środowiska developerskiego..."

# Sprawdź czy jesteśmy w odpowiednim katalogu
if [ ! -f "docker-compose.dev.yaml" ]; then
    echo "❌ Błąd: Uruchom skrypt z katalogu głównego projektu"
    exit 1
fi

# Sprawdź czy plik .env istnieje
if [ ! -f ".env" ]; then
    echo "📝 Tworzenie pliku .env z szablonu..."
    cp env.dev.example .env
    echo "✅ Plik .env utworzony"
fi

# Tworzenie katalogów
echo "📁 Tworzenie katalogów..."
mkdir -p logs/{backend,frontend,ollama,redis,postgres,nginx,grafana,prometheus,loki}
mkdir -p data/{models,vector_store,backups}
mkdir -p monitoring/{grafana/{dashboards,datasources},prometheus}

# Uruchomienie aplikacji
echo "🐳 Uruchamianie kontenerów Docker..."
docker-compose -f docker-compose.dev.yaml up --build -d

echo "⏳ Oczekiwanie na uruchomienie serwisów..."
sleep 30

# Sprawdzenie statusu
echo "🔍 Sprawdzanie statusu serwisów..."
docker-compose -f docker-compose.dev.yaml ps

echo ""
echo "🎉 FoodSave AI uruchomiony!"
echo ""
echo "📱 Dostępne endpointy:"
echo "  🌐 Frontend:     http://localhost:5173"
echo "  🔧 Backend API:  http://localhost:8000"
echo "  📚 API Docs:     http://localhost:8000/docs"
echo "  🤖 Ollama:       http://localhost:11434"
echo "  📈 Prometheus:   http://localhost:9090"
echo "  📊 Grafana:      http://localhost:3001 (admin/admin)"
echo "  📝 Loki:         http://localhost:3100"
echo ""
echo "📝 Logi:"
echo "  ./scripts/dev-setup.sh logs all"
echo ""
echo "🛑 Zatrzymanie:"
echo "  ./scripts/dev-setup.sh stop" 