# Changelog

Wszystkie istotne zmiany w projekcie FoodSave AI będą dokumentowane w tym pliku.

Format oparty na [Keep a Changelog](https://keepachangelog.com/pl/1.0.0/),
i projekt przestrzega [Semantic Versioning](https://semver.org/lang/pl/).

## [1.1.0] - 2025-06-26

### ✅ Naprawione
- **Błąd bazy danych**: Naprawiono `AsyncAdaptedQueuePool` - usunięto nieistniejący atrybut `'invalid'`
  - Dodano bezpieczne pobieranie statystyk pool z fallbackami
  - Dodano obsługę wyjątków w `update_pool_stats()`
  - Poprawiono health check bazy danych

- **Generator odpowiedzi**: Naprawiono async generator w `/chat/stream` endpoint
  - Usunięto niepotrzebną walidację `inspect.iscoroutine()`
  - Uproszczono implementację streaming response
  - Poprawiono obsługę błędów w generatorze

- **Health checks kontenerów**: Wszystkie kontenery teraz przechodzą health checks
  - Backend: ✅ `healthy` (zamiast `unhealthy`)
  - Frontend: ✅ `healthy` (zamiast `unhealthy`)
  - Poprawiono testy health check z `CMD-SHELL`
  - Zwiększono `start_period` dla lepszego uruchamiania

- **Redis konfiguracja**: Poprawiono konfigurację Redis dla kontenera
  - Zmieniono host z `"redis"` na `"localhost"`
  - Zmieniono port z `6379` na `6380` (zgodnie z docker-compose)
  - Dodano zależności Redis do `pyproject.toml`

### ➕ Dodano
- **Nowe zależności**:
  - `langdetect` - wykrywanie języka
  - `sentence-transformers` - embeddings
  - `redis` - klient Redis

- **Dokumentacja**:
  - Sekcja troubleshooting w README
  - Aktualizacja stanu systemu
  - Instrukcje sprawdzania health checks

### 🔧 Zmieniono
- **Docker Compose**: Poprawiono health checks z lepszymi timeoutami
- **Konfiguracja**: Zaktualizowano ustawienia Redis
- **Dokumentacja**: Dodano sekcję z naprawami i troubleshooting

### 📊 Stan systemu
```bash
# Wszystkie główne usługi działają poprawnie:
- foodsave-frontend:    ✅ healthy
- foodsave-backend:     ✅ healthy  
- foodsave-postgres:    ✅ healthy
- foodsave-ollama:      ✅ healthy
- foodsave-redis:       ✅ healthy
```

## [1.0.0] - 2025-06-25

### ➕ Dodano
- Początkowa wersja FoodSave AI
- Backend FastAPI z agentami AI
- Frontend React/TypeScript
- Integracja z Ollama
- System health checks
- Monitoring i logowanie
- Docker Compose setup

---

## Typy zmian

- `➕ Dodano` - nowe funkcje
- `🔧 Zmieniono` - zmiany w istniejących funkcjach
- `✅ Naprawione` - poprawki błędów
- `🗑️ Usunięto` - usunięte funkcje
- `📊 Stan systemu` - informacje o stabilności 