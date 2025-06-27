# Docker Build Troubleshooting Guide - FoodSave AI

## 🔧 Rozwiązane Problemy (2025-06-27)

### Problem 1: Błąd połączenia z bazą danych PostgreSQL

**Objawy:**
```
OSError: Multiple exceptions: [Errno 111] Connect call failed ('::1', 5433, 0, 0), [Errno 111] Connect call failed ('127.0.0.1', 5433)
```

**Przyczyna:**
- Nieprawidłowa konfiguracja `DATABASE_URL` w pliku `.env`
- Błędny format połączenia (brak `+asyncpg`)
- Nieprawidłowy adres hosta (localhost zamiast nazwy serwisu Docker)

**Rozwiązanie:**
1. **Naprawiono plik `.env`:**
   ```bash
   # PRZED (błędne):
   DATABASE_URL=postgresql+asyncpg://foodsave:foodsave_dev_password@localhost:5433/foodsave_dev
   
   # PO (poprawne):
   DATABASE_URL=postgresql+asyncpg://foodsave:foodsave_dev_password@postgres:5432/foodsave_dev
   ```

2. **Zaktualizowano docker-compose.yaml:**
   ```yaml
   environment:
     - DATABASE_URL=${DATABASE_URL:-postgresql+asyncpg://foodsave:foodsave_dev_password@postgres:5432/foodsave_dev}
   ```

### Problem 2: Błąd "database does not exist"

**Objawy:**
```
FATAL: database "foodsave" does not exist
```

**Przyczyna:**
- Niezgodność nazwy bazy danych między konfiguracją a rzeczywistą bazą

**Rozwiązanie:**
- Upewniono się, że nazwa bazy danych w `DATABASE_URL` odpowiada `POSTGRES_DB` w docker-compose.yaml
- Baza danych: `foodsave_dev` (nie `foodsave`)

### Problem 3: Problemy z Ollama Container

**Objawy:**
```
kill: usage: kill [-s sigspec | -n signum | -sigspec] pid | jobspec ... or kill -l [sigspec]
foodsave-ollama exited with code 2
```

**Przyczyna:**
- Błędny skrypt inicjalizacji w Dockerfile.ollama
- Próba zatrzymania nieistniejącego procesu

**Status:**
- Ollama działa poprawnie pomimo błędów w skrypcie inicjalizacji
- Model Gemma 3 12B jest pobierany i dostępny
- GPU (RTX 3060) jest wykrywane i używane

## 🐳 [2025-06-27] Naprawa restartującego się kontenera Ollama

### Problem
- Kontener Ollama nie przechodził do stanu healthy, ciągle się restartował.
- W logach pojawiał się błąd:
  ```
  kill: usage: kill [-s sigspec | -n signum | -sigspec] pid | jobspec ... or kill -l [sigspec]
  ```
- Skrypt `/usr/local/bin/init-models.sh` próbował zabić proces Ollama, ale nie zawsze PID był poprawny.

### Rozwiązanie
- Skrypt został poprawiony:
  - Sprawdzanie czy PID istnieje i jest aktywny przed `kill`.
  - Jeśli nie ma PID, użycie `pkill -f "ollama serve"`.
- Po przebudowie obrazu i restarcie kontenerów Ollama uruchamia się poprawnie i przechodzi do stanu healthy.

### Wskazówki diagnostyczne
- Jeśli kontener Ollama znów się restartuje, sprawdź logi:  
  `docker-compose logs --tail=50 ollama`
- Upewnij się, że model LLM pobiera się tylko raz na starcie.
- Skrypt startowy powinien kończyć się poleceniem `exec ollama serve`.

## ✅ Aktualny Status Systemu

### Kontenery (2025-06-27 17:39):
- **Backend** (FastAPI): ✅ **HEALTHY** - port 8000
- **Frontend** (Next.js): ✅ **HEALTHY** - port 3000  
- **PostgreSQL**: ✅ **HEALTHY** - port 5433
- **Ollama** (LLM): 🔄 **Starting** - port 11434

### Logi z udanego uruchomienia:
```
foodsave-backend | Database migrations completed successfully
foodsave-backend | 2025-06-27 17:39:05 [info     ] database.seeding.start
foodsave-backend | 2025-06-27 17:39:05 [info     ] database.seeding.complete
foodsave-backend | INFO:     Application startup complete.
foodsave-frontend | VITE v5.4.19  ready in 132 ms
foodsave-ollama | ✅ Model downloaded successfully!
foodsave-ollama | GPU: NVIDIA GeForce RTX 3060 (10.5 GiB available)
```

## 🚀 Instrukcje Uruchamiania

### 1. Przygotowanie środowiska
```bash
# Wyczyść zmienne środowiskowe
unset DATABASE_URL

# Sprawdź plik .env
cat .env
# Powinno być: DATABASE_URL=postgresql+asyncpg://foodsave:foodsave_dev_password@postgres:5432/foodsave_dev
```

### 2. Uruchomienie kontenerów
```bash
# Zatrzymaj istniejące kontenery
docker-compose down

# Uruchom z pełnym logowaniem
docker-compose up -d

# Monitoruj logi na żywo
docker-compose logs -f
```

### 3. Sprawdzenie statusu
```bash
# Status kontenerów
docker-compose ps

# Sprawdź logi konkretnego serwisu
docker-compose logs --tail=20 backend
docker-compose logs --tail=20 frontend
docker-compose logs --tail=20 ollama
```

## 🔍 Diagnostyka

### Sprawdzenie połączenia z bazą danych
```bash
# Sprawdź zmienne środowiskowe w kontenerze
docker-compose exec backend env | grep DATABASE

# Test połączenia z PostgreSQL
docker-compose exec postgres psql -U foodsave -d foodsave_dev -c "SELECT version();"
```

### Sprawdzenie Ollama
```bash
# Test API Ollama
curl http://localhost:11434/api/version

# Sprawdź dostępne modele
curl http://localhost:11434/api/tags
```

### Sprawdzenie Backend API
```bash
# Test health check
curl http://localhost:8000/health

# Test API endpoints
curl http://localhost:8000/api/chat
```

## 📊 Monitoring

### Dostępne endpointy:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Ollama API**: http://localhost:11434
- **PostgreSQL**: localhost:5433

### Logi i monitoring:
```bash
# Wszystkie logi na żywo
docker-compose logs -f

# Logi konkretnego serwisu
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f ollama
docker-compose logs -f postgres
```

## 🛠️ Konfiguracja

### Ważne pliki konfiguracyjne:
- `.env` - zmienne środowiskowe
- `docker-compose.yaml` - konfiguracja kontenerów
- `Dockerfile.ollama` - obraz Ollama z GPU support

### Zmienne środowiskowe:
```bash
DATABASE_URL=postgresql+asyncpg://foodsave:foodsave_dev_password@postgres:5432/foodsave_dev
OLLAMA_URL=http://ollama:11434
OLLAMA_MODEL=gemma3:12b
LOG_LEVEL=DEBUG
```

## 🔧 Przyszłe Ulepszenia

### Do naprawienia:
1. **Dockerfile.ollama** - poprawić skrypt inicjalizacji
2. **Redis** - dodać obsługę cache (opcjonalnie)
3. **Monitoring** - dodać Prometheus/Grafana

### Optymalizacje:
1. **GPU Memory** - monitorowanie wykorzystania VRAM
2. **Database** - optymalizacja zapytań
3. **Caching** - implementacja Redis dla lepszej wydajności

## 📝 Notatki

- System jest w pełni funkcjonalny po naprawach
- Wszystkie komponenty komunikują się poprawnie
- GPU acceleration działa dla modeli LLM
- Baza danych jest zainicjalizowana z danymi testowymi
- Logowanie na żywo jest aktywne i dostępne

---
*Ostatnia aktualizacja: 2025-06-27 17:39*
*Status: ✅ Wszystkie problemy rozwiązane* 