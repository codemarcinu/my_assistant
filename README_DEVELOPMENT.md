# 🚀 FoodSave AI - Przewodnik Developerski

> **Kompletny przewodnik uruchomienia środowiska developerskiego z pełnym logowaniem i monitoringiem**

## 📋 Spis Treści

- [🚀 Szybki Start](#-szybki-start)
- [🔧 Wymagania Systemowe](#-wymagania-systemowe)
- [📦 Instalacja i Konfiguracja](#-instalacja-i-konfiguracja)
- [🔄 Zarządzanie Aplikacją](#-zarządzanie-aplikacją)
- [📊 Monitoring i Logi](#-monitoring-i-logi)
- [🧪 Testowanie](#-testowanie)
- [🔍 Debugowanie](#-debugowanie)
- [📚 Dokumentacja API](#-dokumentacja-api)
- [🛠️ Rozwój](#-rozwój)

---

## 🚀 Szybki Start

### 1. Klonowanie Repozytorium
```bash
git clone https://github.com/yourusername/foodsave-ai.git
cd foodsave-ai
```

### 2. Konfiguracja Środowiska
```bash
# Skopiuj plik konfiguracyjny
cp env.dev.example .env

# Uruchom konfigurację początkową
./scripts/dev-setup.sh setup
```

### 3. Uruchomienie Aplikacji
```bash
# Uruchom wszystkie serwisy
./scripts/dev-setup.sh start

# Sprawdź status
./scripts/dev-setup.sh status
```

### 4. Dostęp do Aplikacji
- 🌐 **Frontend**: http://localhost:5173
- 🔧 **Backend API**: http://localhost:8000
- 📚 **API Docs**: http://localhost:8000/docs
- 🤖 **Ollama**: http://localhost:11434
- 📈 **Prometheus**: http://localhost:9090
- 📊 **Grafana**: http://localhost:3001 (admin/admin)
- 📝 **Loki**: http://localhost:3100

---

## 🔧 Wymagania Systemowe

### Podstawowe Wymagania
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Git**: 2.30+
- **curl**: dla health checks

### Opcjonalne (Dla Lepszego Wydajności)
- **NVIDIA GPU**: z CUDA support
- **NVIDIA Container Toolkit**: dla GPU acceleration
- **Min. 8GB RAM**: dla modeli AI
- **Min. 20GB wolnego miejsca**: dla modeli i danych

### Sprawdzenie Wymagań
```bash
# Sprawdź Docker
docker --version
docker-compose --version

# Sprawdź GPU (opcjonalne)
nvidia-smi

# Sprawdź dostępną pamięć
free -h
```

---

## 📦 Instalacja i Konfiguracja

### 1. Konfiguracja Początkowa
```bash
# Uruchom pełną konfigurację
./scripts/dev-setup.sh setup
```

To polecenie:
- ✅ Sprawdza wymagania systemowe
- ✅ Tworzy plik `.env` z szablonu
- ✅ Tworzy katalogi dla logów i danych
- ✅ Sprawdza support GPU
- ✅ Konfiguruje uprawnienia

### 2. Konfiguracja GPU (Opcjonalne)
Jeśli masz NVIDIA GPU:

```bash
# Sprawdź czy GPU jest wykryty
nvidia-smi

# Jeśli tak, Ollama automatycznie użyje GPU
# Jeśli nie, sprawdź instalację NVIDIA Container Toolkit
```

### 3. Instalacja Modeli AI
```bash
# Zainstaluj modele Ollama (po uruchomieniu aplikacji)
./scripts/dev-setup.sh models
```

Dostępne modele:
- `gemma3:12b` - Główny model (zalecany)
- `gemma3:8b` - Lżejszy model
- `nomic-embed-text` - Model embeddings

---

## 🔄 Zarządzanie Aplikacją

### Podstawowe Komendy
```bash
# Uruchom aplikację
./scripts/dev-setup.sh start

# Zatrzymaj aplikację
./scripts/dev-setup.sh stop

# Restartuj aplikację
./scripts/dev-setup.sh restart

# Sprawdź status
./scripts/dev-setup.sh status
```

### Zarządzanie Logami
```bash
# Wszystkie logi
./scripts/dev-setup.sh logs all

# Logi konkretnego serwisu
./scripts/dev-setup.sh logs backend
./scripts/dev-setup.sh logs frontend
./scripts/dev-setup.sh logs ollama
./scripts/dev-setup.sh logs postgres
./scripts/dev-setup.sh logs redis

# Logi z określoną liczbą linii
./scripts/dev-setup.sh logs backend 100
```

### Czyszczenie Środowiska
```bash
# Zatrzymaj i wyczyść
./scripts/dev-setup.sh cleanup
```

---

## 📊 Monitoring i Logi

### Struktura Katalogów Logów
```
logs/
├── backend/          # Logi FastAPI
├── frontend/         # Logi React/Vite
├── ollama/           # Logi modeli AI
├── postgres/         # Logi bazy danych
├── redis/            # Logi cache
├── grafana/          # Logi dashboardów
├── prometheus/       # Logi metryk
└── loki/             # Logi agregacji
```

### Dostęp do Logów

#### 1. Przez Skrypt
```bash
# Logi w czasie rzeczywistym
./scripts/dev-setup.sh logs backend -f

# Ostatnie 100 linii
./scripts/dev-setup.sh logs backend 100
```

#### 2. Przez Docker
```bash
# Logi kontenera
docker logs foodsave-backend-dev -f

# Logi z timestamp
docker logs foodsave-backend-dev --timestamps
```

#### 3. Przez Grafana (Loki)
- Otwórz http://localhost:3001
- Zaloguj się (admin/admin)
- Przejdź do "Explore"
- Wybierz datasource "Loki"
- Wpisz zapytanie: `{job="backend_logs"}`

### Monitoring Metryk

#### Prometheus
- **URL**: http://localhost:9090
- **Metryki**: Backend, Frontend, Ollama, PostgreSQL, Redis
- **Zapytania**: PromQL queries

#### Grafana
- **URL**: http://localhost:3001
- **Login**: admin/admin
- **Dashboardy**: Automatycznie załadowane
- **Datasources**: Prometheus, Loki

### Przykładowe Zapytania Loki
```logql
# Wszystkie logi backend
{job="backend_logs"}

# Logi błędów
{job="backend_logs"} |= "ERROR"

# Logi z określonego poziomu
{job="backend_logs"} | json | level="ERROR"

# Logi z określonego serwisu
{job="docker"} |= "foodsave-backend"
```

---

## 🧪 Testowanie

### Uruchomienie Testów
```bash
# Wszystkie testy
./scripts/dev-setup.sh test

# Testy jednostkowe
docker-compose -f docker-compose.dev.yaml exec backend poetry run pytest tests/unit/ -v

# Testy integracyjne
docker-compose -f docker-compose.dev.yaml exec backend poetry run pytest tests/integration/ -v

# Testy z coverage
docker-compose -f docker-compose.dev.yaml exec backend poetry run pytest --cov=src --cov-report=html
```

### Struktura Testów
```
tests/
├── unit/              # Testy jednostkowe
├── integration/       # Testy integracyjne
├── e2e/              # Testy end-to-end
└── fixtures/         # Dane testowe
```

### Testy Frontendu
```bash
# Przejdź do katalogu frontendu
cd myappassistant-chat-frontend

# Testy jednostkowe
npm test

# Testy e2e
npm run test:e2e
```

---

## 🔍 Debugowanie

### Debugowanie Backend
```bash
# Shell w kontenerze backend
docker-compose -f docker-compose.dev.yaml exec backend bash

# Sprawdź logi aplikacji
tail -f /app/logs/backend.log

# Sprawdź zmienne środowiskowe
env | grep FOODSAVE

# Uruchom Python debugger
poetry run python -m pdb src/backend/main.py
```

### Debugowanie Frontend
```bash
# Shell w kontenerze frontend
docker-compose -f docker-compose.dev.yaml exec frontend sh

# Sprawdź logi
tail -f /app/logs/frontend.log

# Sprawdź node_modules
ls -la node_modules/
```

### Debugowanie Bazy Danych
```bash
# Połączenie z PostgreSQL
docker-compose -f docker-compose.dev.yaml exec postgres psql -U foodsave -d foodsave_dev

# Sprawdź tabele
\dt

# Sprawdź logi
tail -f /var/log/postgresql/postgresql.log
```

### Debugowanie Redis
```bash
# Redis CLI
docker-compose -f docker-compose.dev.yaml exec redis redis-cli

# Sprawdź klucze
KEYS *

# Sprawdź logi
tail -f /var/log/redis/redis.log
```

---

## 📚 Dokumentacja API

### Swagger UI
- **URL**: http://localhost:8000/docs
- **Funkcje**: Interaktywna dokumentacja API
- **Testowanie**: Możliwość testowania endpointów

### ReDoc
- **URL**: http://localhost:8000/redoc
- **Funkcje**: Alternatywna dokumentacja API

### Endpointy Health Check
```bash
# Health check
curl http://localhost:8000/health

# Metrics
curl http://localhost:8000/metrics

# Readiness
curl http://localhost:8000/ready

# Liveness
curl http://localhost:8000/live
```

---

## 🛠️ Rozwój

### Hot Reload
- **Backend**: Automatyczny reload przy zmianach w `./src/`
- **Frontend**: Automatyczny reload przy zmianach w `./myappassistant-chat-frontend/`

### Struktura Projektu
```
myappassistant/
├── src/backend/           # Backend FastAPI
├── myappassistant-chat-frontend/  # Frontend React
├── scripts/               # Skrypty automatyzacji
├── tests/                 # Testy
├── monitoring/            # Konfiguracja monitoringu
├── logs/                  # Logi aplikacji
└── data/                  # Dane aplikacji
```

### Dodawanie Nowych Serwisów
1. Dodaj serwis do `docker-compose.dev.yaml`
2. Dodaj konfigurację do `env.dev.example`
3. Zaktualizuj skrypt `dev-setup.sh`
4. Dodaj health check
5. Skonfiguruj logowanie

### Best Practices
- ✅ Zawsze używaj hot reload
- ✅ Sprawdzaj logi przed commitowaniem
- ✅ Uruchamiaj testy przed push
- ✅ Używaj pre-commit hooks
- ✅ Dokumentuj zmiany w API

---

## 🆘 Rozwiązywanie Problemów

### Częste Problemy

#### 1. Port Already in Use
```bash
# Sprawdź co używa portu
sudo lsof -i :8000

# Zatrzymaj proces
sudo kill -9 <PID>
```

#### 2. Brak Pamięci dla Modeli
```bash
# Sprawdź użycie pamięci
docker stats

# Zatrzymaj niepotrzebne kontenery
docker stop $(docker ps -q)
```

#### 3. Problemy z GPU
```bash
# Sprawdź NVIDIA Container Toolkit
docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi

# Jeśli nie działa, użyj CPU
export NVIDIA_VISIBLE_DEVICES=""
```

#### 4. Problemy z Bazą Danych
```bash
# Resetuj bazę danych
docker-compose -f docker-compose.dev.yaml down -v
docker-compose -f docker-compose.dev.yaml up -d postgres
```

### Logi Debugowania
```bash
# Szczegółowe logi Docker
docker-compose -f docker-compose.dev.yaml logs --tail=100 -f

# Logi systemowe
journalctl -f

# Logi Docker daemon
sudo journalctl -u docker.service -f
```

---

## 📞 Wsparcie

### Dokumentacja
- [Główny README](../README.md)
- [Dokumentacja API](API_REFERENCE.md)
- [Przewodnik Testowania](TESTING_GUIDE.md)

### Kontakt
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)

---

**🚀 FoodSave AI Development Environment** - Gotowy do rozwoju! 🎯
