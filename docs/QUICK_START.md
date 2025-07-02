# 🚀 Szybki Start - FoodSave AI

> **Ostatnia aktualizacja:** 2025-07-02  
> **Powiązane dokumenty:** [TOC.md](TOC.md), [README.md](../README.md)

## Co znajdziesz w tym dokumencie?

- [x] Minimalne wymagania systemowe
- [x] Szybkie uruchomienie w 3 krokach
- [x] Panel sterowania
- [x] Rozwiązywanie problemów
- [x] Linki do szczegółowej dokumentacji

## Spis treści
- [1. 📋 Wymagania](#-wymagania)
- [2. 🚀 Szybkie Uruchomienie](#-szybkie-uruchomienie)
- [3. 🎮 Panel Sterowania](#-panel-sterowania)
- [4. 🔧 Rozwiązywanie Problemów](#-rozwiązywanie-problemów)
- [5. 📚 Następne Kroki](#-następne-kroki)

---

## 📋 Wymagania

### Minimalne Wymagania Systemowe
- **OS**: Linux (Ubuntu 20.04+), macOS, Windows 10+
- **RAM**: 8GB (16GB zalecane)
- **Dysk**: 10GB wolnego miejsca
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

### Wymagane Narzędzia
```bash
# Sprawdź czy masz zainstalowane
docker --version
docker-compose --version
git --version
```

---

## 🚀 Szybkie Uruchomienie

### Krok 1: Klonowanie Repozytorium
```bash
git clone https://github.com/codemarcinu/my_assistant.git
cd my_assistant
```

### Krok 2: Uruchomienie Panelu Sterowania
```bash
# Nadaj uprawnienia do uruchamiania
chmod +x foodsave-all.sh

# Uruchom panel sterowania
./foodsave-all.sh
```

### Krok 3: Wybór Trybu
W panelu wybierz:
- **🚀 Uruchom system** → **Tryb deweloperski** (zalecane na start)
- Poczekaj na uruchomienie wszystkich usług (~2-3 minuty)

---

## 🎮 Panel Sterowania

### Funkcje Panelu
```
┌─────────────────────────────────────┐
│         FoodSave AI Panel           │
├─────────────────────────────────────┤
│ 1. 🚀 Uruchom system               │
│ 2. 🖥️ Aplikacja desktop (Tauri)    │
│ 3. 📊 Status systemu               │
│ 4. 📝 Logi systemu                 │
│ 5. 🛑 Zatrzymaj usługi             │
│ 6. 🔧 Diagnostyka                  │
│ 0. Wyjście                         │
└─────────────────────────────────────┘
```

### Bezpośrednie Komendy
```bash
# Tryb deweloperski (backend + frontend)
./foodsave-all.sh dev

# Tryb produkcyjny (backend + frontend statyczny)
./foodsave-all.sh prod

# Aplikacja Tauri (backend + desktop)
./foodsave-all.sh tauri

# Status systemu
./foodsave-all.sh status

# Zatrzymanie
./foodsave-all.sh stop
```

---

## 🌐 Dostęp do Aplikacji

Po uruchomieniu systemu:

### Frontend Web
- **URL**: http://localhost:3000
- **Status**: Automatycznie uruchamiany w trybie deweloperskim

### Backend API
- **URL**: http://localhost:8000
- **Dokumentacja API**: http://localhost:8000/docs
- **Status**: Sprawdź w panelu sterowania

### Monitoring
- **Grafana**: http://localhost:3001
- **Prometheus**: http://localhost:9090

---

## 🔧 Rozwiązywanie Problemów

### Problem: Kontenery się nie uruchamiają
```bash
# Sprawdź status
./foodsave-all.sh status

# Sprawdź logi
./foodsave-all.sh logs

# Restart systemu
./foodsave-all.sh stop
./foodsave-all.sh dev
```

### Problem: Błąd SearchAgent
```
SearchAgent.__init__() got an unexpected keyword argument 'llm_client'
```
**Rozwiązanie:**
```bash
# Zatrzymaj kontenery
docker compose down

# Usuń cache i przebuduj
docker system prune -af
docker compose build --no-cache
docker compose up -d
```

### Problem: Brak modeli AI
```bash
# Sprawdź status Ollama
curl http://localhost:11434/api/tags

# Pobierz modele Bielik
docker exec -it ollama ollama pull bielik-4.5b-v3.0
docker exec -it ollama ollama pull bielik-11b-v2.3
```

### Problem: Porty zajęte
```bash
# Sprawdź co używa portów
sudo netstat -tulpn | grep :8000
sudo netstat -tulpn | grep :3000

# Zatrzymaj konfliktujące usługi
sudo systemctl stop nginx  # jeśli używa portu 8000
```

---

## 📊 Status Systemu

### Sprawdzenie Statusu
```bash
# Pełny status systemu
./foodsave-all.sh status

# Status poszczególnych komponentów
curl -s http://localhost:8000/health
curl -s http://localhost:8000/monitoring/status
```

### Oczekiwane Statusy
- ✅ **Backend**: `healthy`
- ✅ **Frontend**: `running` (port 3000)
- ✅ **Database**: `connected`
- ✅ **Redis**: `connected`
- ✅ **Ollama**: `running` (port 11434)

---

## 🧪 Testy Systemu

### Uruchomienie Testów
```bash
# Testy backendu
cd src
python -m pytest tests/ -v

# Testy frontendu
cd myappassistant-chat-frontend
npm test

# Pełne testy systemu
python3 FULL_SYSTEM_TEST.py
```

### Oczekiwane Wyniki
- **Backend**: 150+ testów ✅ PASS
- **Frontend**: 81/81 testów ✅ PASS (100%)
- **System**: 8/8 testów ✅ PASS (100%)

---

## 📚 Następne Kroki

### 📖 Dokumentacja
- [Przewodnik użytkownika](guides/user/FEATURES.md) - Funkcje systemu
- [Dokumentacja API](core/API_REFERENCE.md) - Endpointy API
- [Architektura systemu](core/ARCHITECTURE.md) - Szczegóły techniczne

### 🛠️ Rozwój
- [Konfiguracja środowiska](guides/development/SETUP.md) - Setup deweloperski
- [Przewodnik testowania](guides/development/TESTING.md) - Testy i QA
- [Zasady kontrybucji](guides/development/CONTRIBUTING.md) - Jak pomóc w rozwoju

### 🚀 Produkcja
- [Wdrażanie produkcyjne](guides/deployment/PRODUCTION.md) - Konfiguracja prod
- [Monitoring](guides/deployment/MONITORING.md) - Monitoring i alerty
- [Backup system](operations/BACKUP_SYSTEM.md) - Backup i recovery

---

## 🆘 Wsparcie

### 🔗 Przydatne Linki
- **GitHub Issues**: [Zgłoś problem](https://github.com/codemarcinu/my_assistant/issues)
- **Dokumentacja**: [docs/](TOC.md)
- **Panel sterowania**: `./foodsave-all.sh`

### 📞 Kontakt
- **Diagnostyka**: Użyj opcji "Diagnostyka" w panelu sterowania
- **Logi**: Użyj opcji "Pokaż logi" w panelu sterowania
- **Status**: Użyj opcji "Status systemu" w panelu sterowania

---

> **💡 Wskazówka:** Panel sterowania `foodsave-all.sh` to najłatwiejszy sposób zarządzania systemem. Użyj go do wszystkich operacji zamiast ręcznych komend Docker. 