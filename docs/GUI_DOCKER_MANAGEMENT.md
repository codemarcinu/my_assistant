# Zarządzanie Kontenerami Docker w GUI FoodSave AI

## 🚀 Przegląd Funkcjonalności

Zaimplementowano pełne zarządzanie kontenerami Docker w interfejsie GUI FoodSave AI, zgodnie z regułami z `.cursorrules`. System umożliwia intuicyjne zarządzanie wszystkimi kontenerami z poziomu przeglądarki.

## 📋 Dostępne Funkcje

### 1. Podstawowe Operacje na Wszystkich Kontenerach

- **Uruchom wszystkie** (`/api/docker/start-all`)
  - Uruchamia wszystkie kontenery za pomocą `docker compose up -d`
  - Sprawdza status usługi Docker przed wykonaniem
  - Zwraca szczegółowe informacje o wyniku operacji

- **Zatrzymaj wszystkie** (`/api/docker/stop-all`)
  - Zatrzymuje wszystkie kontenery za pomocą `docker compose down`
  - Bezpieczne zatrzymanie z timeout 30 sekund

- **Restartuj wszystkie** (`/api/docker/restart-all`)
  - Sekwencyjnie zatrzymuje i uruchamia wszystkie kontenery
  - Idealne do odświeżenia stanu systemu

- **Rebuilduj wszystkie** (`/api/docker/rebuild-all`)
  - Rebuilduje wszystkie kontenery za pomocą `docker compose up -d --build`
  - Timeout 5 minut dla długich operacji

### 2. Operacje na Pojedynczych Kontenerach

- **Uruchom kontener** (`/api/docker/container/start`)
  - Uruchamia pojedynczy kontener przez ID lub nazwę serwisu
  - Obsługuje zarówno `docker start` jak i `docker compose up -d`

- **Zatrzymaj kontener** (`/api/docker/container/stop`)
  - Zatrzymuje pojedynczy kontener
  - Obsługuje zarówno `docker stop` jak i `docker compose stop`

- **Restartuj kontener** (`/api/docker/container/restart`)
  - Restartuje pojedynczy kontener
  - Obsługuje zarówno `docker restart` jak i `docker compose restart`

### 3. Monitoring i Informacje

- **Status kontenerów** (`/api/docker/status`)
  - Pobiera aktualny status wszystkich kontenerów
  - Format `docker compose ps`

- **Lista kontenerów** (`/api/docker/containers`)
  - Szczegółowe informacje o wszystkich kontenerach
  - Format `docker ps -a` z pełnymi metadanymi

- **Logi kontenera** (`/api/docker/container/logs/{container_id}`)
  - Pobiera logi wybranego kontenera
  - Konfigurowalna liczba linii (domyślnie 100)

- **Informacje systemowe** (`/api/docker/system-info`)
  - Informacje o systemie Docker (`docker info`)
  - Użycie dysku (`docker system df`)

## 🎨 Interfejs Użytkownika

### Panel Statusu Docker
- Automatyczne odświeżanie co 10 sekund
- Wizualne wskaźniki statusu (online/offline)
- Przycisk uruchamiania Dockera gdy usługa nie działa
- Licznik uruchomionych kontenerów

### Sekcja Szybkie Akcje
- Przyciski dla podstawowych operacji:
  - Uruchom wszystkie
  - Zatrzymaj wszystkie
  - Restartuj wszystkie
  - Rebuilduj wszystkie
  - Zarządzaj szczegółowo

### Modal Zarządzania Docker
- Kompletny interfejs zarządzania kontenerami
- Lista wszystkich kontenerów z statusami
- Akcje na pojedynczych kontenerach
- Podgląd logów w czasie rzeczywistym
- Informacje systemowe

### Karty Kontenerów
- Wizualne rozróżnienie statusów (running/stopped)
- Szczegółowe informacje o każdym kontenerze
- Przyciski akcji dla każdego kontenera
- Responsywny design

## 🔧 Architektura Techniczna

### Backend (Python/Flask)
```python
# Endpointy w server.py
@app.route('/api/docker/start-all', methods=['POST'])
@app.route('/api/docker/stop-all', methods=['POST'])
@app.route('/api/docker/restart-all', methods=['POST'])
@app.route('/api/docker/rebuild-all', methods=['POST'])
@app.route('/api/docker/status')
@app.route('/api/docker/containers')
@app.route('/api/docker/system-info')
@app.route('/api/docker/container/<action>', methods=['POST'])
@app.route('/api/docker/container/logs/<container_id>')
```

### Frontend (JavaScript)
```javascript
// Główne funkcje w script.js
async function showDockerManagement()
async function loadDockerData()
async function dockerAction(action)
async function containerAction(action, containerId)
async function showContainerLogs(containerId, containerName)
async function showDockerSystemInfo()
```

### Styling (CSS)
- Responsywny design z CSS Grid
- Ciemny motyw zgodny z resztą aplikacji
- Animacje i przejścia
- Mobile-first approach

## 🛡️ Bezpieczeństwo i Walidacja

### Walidacja Wejścia
- Sprawdzanie statusu usługi Docker przed operacjami
- Walidacja container_id i service_name
- Timeout dla długich operacji
- Obsługa błędów i wyjątków

### Bezpieczeństwo
- Asynchroniczne wykonywanie komend
- Izolacja procesów Docker
- Walidacja odpowiedzi API
- Logowanie błędów

## 📊 Monitoring i Logi

### Metryki Systemowe
- Status usługi Docker
- Liczba uruchomionych kontenerów
- Użycie zasobów systemowych
- Historia operacji

### Logi Operacji
- Szczegółowe logi wszystkich operacji
- Timestamp dla każdej akcji
- Informacje o błędach
- Debugging informacje

## 🚀 Uruchomienie i Dostęp

### Serwer GUI
```bash
cd foodsave-gui
python3 server.py
```

### Dostęp
- **GUI**: http://localhost:8081
- **API**: http://localhost:8081/api/
- **Health Check**: http://localhost:8081/health

### Przykład Użycia API
```bash
# Uruchom wszystkie kontenery
curl -X POST http://localhost:8081/api/docker/start-all

# Sprawdź status
curl http://localhost:8081/api/docker/status

# Pobierz logi kontenera
curl http://localhost:8081/api/docker/container/logs/container_id
```

## 🔄 Integracja z DevOps

### Endpointy DevOps (FastAPI)
Rozszerzono również endpointy DevOps w `src/backend/api/v1/endpoints/devops.py`:

```python
@router.post("/docker/start-all", response_model=ActionResponse)
@router.post("/docker/stop-all", response_model=ActionResponse)
@router.post("/docker/restart-all", response_model=ActionResponse)
@router.post("/docker/rebuild-all", response_model=ActionResponse)
@router.get("/docker/status", response_model=ActionResponse)
@router.get("/docker/containers", response_model=ActionResponse)
@router.post("/docker/container/start", response_model=ActionResponse)
@router.post("/docker/container/stop", response_model=ActionResponse)
@router.post("/docker/container/restart", response_model=ActionResponse)
@router.get("/docker/container/logs/{container_id}")
@router.get("/docker/system-info", response_model=ActionResponse)
```

## 📝 Przykłady Użycia

### 1. Uruchomienie Wszystkich Kontenerów
```javascript
// W GUI
document.getElementById('docker-start-btn').onclick = () => 
    action('/api/docker/start-all', 'Wszystkie kontenery uruchomione');

// Przez API
fetch('/api/docker/start-all', { method: 'POST' })
    .then(res => res.json())
    .then(data => console.log(data));
```

### 2. Zarządzanie Pojedynczym Kontenerem
```javascript
// Uruchom konkretny kontener
containerAction('start', 'aiasisstmarubo-backend-1');

// Pokaż logi
showContainerLogs('aiasisstmarubo-backend-1', 'Backend');
```

### 3. Monitoring Statusu
```javascript
// Automatyczne odświeżanie
setInterval(updateDockerStatusPanel, 10000);

// Ręczne odświeżenie
loadDockerData();
```

## 🎯 Zgodność z Regułami

### Zgodność z .cursorrules
- ✅ **Python (FastAPI)**: Pełne type hints + docstrings
- ✅ **Async Operations**: Wszystkie operacje asynchroniczne
- ✅ **Input Validation**: Walidacja przez Pydantic
- ✅ **Error Handling**: Kompletna obsługa błędów
- ✅ **Security**: Walidacja i sanitizacja danych
- ✅ **Polish Language**: Wszystkie komunikaty po polsku

### Best Practices
- ✅ **Modular Design**: Separacja logiki biznesowej
- ✅ **RESTful API**: Standardowe endpointy HTTP
- ✅ **Response Models**: Spójne formaty odpowiedzi
- ✅ **Timeout Handling**: Bezpieczne timeouty
- ✅ **Logging**: Kompletne logowanie operacji

## 🔮 Planowane Rozszerzenia

1. **Eksport Logów**: Zapisywanie logów do plików
2. **Metryki Wydajności**: Szczegółowe metryki kontenerów
3. **Backup Kontenerów**: Tworzenie backupów
4. **Alerty**: Powiadomienia o problemach
5. **Scheduling**: Planowanie operacji
6. **Multi-Environment**: Obsługa wielu środowisk

---

**Autor**: FoodSave AI Development Team  
**Data**: 2025-07-03  
**Wersja**: 1.0.0  
**Status**: ✅ Gotowe do użycia 