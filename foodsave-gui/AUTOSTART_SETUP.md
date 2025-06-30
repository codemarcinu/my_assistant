# 🍽️ FoodSave AI GUI - Automatyczne Uruchamianie

## 📋 Przegląd

Ten dokument opisuje jak skonfigurować FoodSave AI GUI do automatycznego uruchamiania przy starcie systemu Ubuntu.

## 🚀 Szybka Instalacja

### 1. Przejdź do katalogu GUI
```bash
cd foodsave-gui
```

### 2. Nadaj uprawnienia do skryptów
```bash
chmod +x install-autostart.sh uninstall-autostart.sh
```

### 3. Zainstaluj automatyczne uruchamianie
```bash
./install-autostart.sh
```

## 📖 Szczegółowe Instrukcje

### Wymagania
- Ubuntu z systemd
- Python 3
- Wymagane pakiety Python: `flask`, `flask-cors`, `psutil`, `requests`

### Instalacja

1. **Przejdź do katalogu GUI:**
   ```bash
   cd /home/marcin/Dokumenty/agentai/makeit/AIASISSTMARUBO/foodsave-gui
   ```

2. **Nadaj uprawnienia do skryptów:**
   ```bash
   chmod +x install-autostart.sh uninstall-autostart.sh
   ```

3. **Uruchom instalator:**
   ```bash
   ./install-autostart.sh
   ```

   Instalator automatycznie:
   - Sprawdzi wymagania systemowe
   - Zainstaluje brakujące pakiety Python
   - Utworzy plik systemd service
   - Włączy automatyczne uruchamianie
   - Uruchomi serwis

### Odinstalacja

Aby wyłączyć automatyczne uruchamianie:

```bash
./uninstall-autostart.sh
```

## 🔧 Zarządzanie Serwisem

### Sprawdzenie statusu
```bash
systemctl --user status foodsave-gui.service
```

### Uruchomienie serwisu
```bash
systemctl --user start foodsave-gui.service
```

### Zatrzymanie serwisu
```bash
systemctl --user stop foodsave-gui.service
```

### Restart serwisu
```bash
systemctl --user restart foodsave-gui.service
```

### Włączenie autostartu
```bash
systemctl --user enable foodsave-gui.service
```

### Wyłączenie autostartu
```bash
systemctl --user disable foodsave-gui.service
```

## 📝 Logi

### Wyświetlenie logów
```bash
journalctl --user -u foodsave-gui.service
```

### Śledzenie logów w czasie rzeczywistym
```bash
journalctl --user -u foodsave-gui.service -f
```

### Logi z ostatnich 100 linii
```bash
journalctl --user -u foodsave-gui.service -n 100
```

## 🌐 Dostęp do GUI

Po uruchomieniu serwisu, GUI będzie dostępne pod adresem:
- **Lokalnie:** http://localhost:8080
- **W sieci:** http://[IP-KOMPUTERA]:8080

## 🔍 Rozwiązywanie Problemów

### Serwis nie uruchamia się
1. Sprawdź logi:
   ```bash
   journalctl --user -u foodsave-gui.service
   ```

2. Sprawdź czy port 8080 jest wolny:
   ```bash
   lsof -i :8080
   ```

3. Sprawdź uprawnienia do plików:
   ```bash
   ls -la server.py
   ls -la ../foodsave-all.sh
   ```

### GUI nie jest dostępne
1. Sprawdź czy serwis działa:
   ```bash
   systemctl --user is-active foodsave-gui.service
   ```

2. Sprawdź czy port jest otwarty:
   ```bash
   netstat -tlnp | grep 8080
   ```

3. Sprawdź firewall:
   ```bash
   sudo ufw status
   ```

### Problemy z zależnościami
1. Zainstaluj brakujące pakiety:
   ```bash
   pip3 install flask flask-cors psutil requests --user
   ```

2. Sprawdź wersję Pythona:
   ```bash
   python3 --version
   ```

### Problemy z backendem lub usługami Docker

1. **Backend nie uruchamia się lub GUI pokazuje błąd "Nie udało się uruchomić systemu"**
   - Sprawdź logi backendu:
     ```bash
     docker logs aiasisstmarubo-backend-1 --tail 50
     ```
   - Jeśli pojawia się błąd `ImportError` lub inny błąd importu, sprawdź czy wszystkie pliki i funkcje istnieją w kodzie źródłowym.
   - Po poprawce kodu backendu uruchom:
     ```bash
     docker-compose build backend
     docker-compose up -d
     ```

2. **Baza danych nie startuje lub jest konflikt na porcie 5432**
   - Sprawdź czy lokalny PostgreSQL nie blokuje portu:
     ```bash
     sudo netstat -tulpn | grep :5432
     ```
   - Jeśli tak, zatrzymaj lokalny serwer:
     ```bash
     sudo systemctl stop postgresql
     ```

3. **Jak sprawdzić status wszystkich usług Docker**
   - Wyświetl listę uruchomionych kontenerów:
     ```bash
     docker ps
     ```
   - Sprawdź logi wybranej usługi, np. bazy danych:
     ```bash
     docker logs aiasisstmarubo-postgres-1 --tail 50
     ```

4. **Backend nie odpowiada na healthcheck**
   - Sprawdź status:
     ```bash
     curl -s http://localhost:8000/health
     ```
   - Jeśli brak odpowiedzi, sprawdź logi backendu jak wyżej.

5. **Najczęstsze przyczyny problemów**
   - Błąd w kodzie backendu (np. ImportError)
   - Brak uprawnień do Docker
   - Porty zajęte przez inne procesy
   - Nieaktualny obraz backendu (po zmianach w kodzie zawsze wykonaj `docker-compose build backend`)

6. **Sprawdzenie wszystkich usług systemu**
   - Użyj głównego skryptu zarządzania:
     ```bash
     ./foodsave-all.sh
     ```
   - Lub sprawdź status Docker Compose:
     ```bash
     docker-compose ps
     ```

7. **Restart wszystkich usług**
   - Zatrzymaj wszystkie usługi:
     ```bash
     docker-compose down
     ```
   - Uruchom ponownie:
     ```bash
     docker-compose up -d
     ```

8. **Problemy z Ollama (LLM service)**
   - Sprawdź czy Ollama działa:
     ```bash
     curl -s http://localhost:11434/api/tags
     ```
   - Jeśli nie działa, uruchom lokalnie:
     ```bash
     ollama serve
     ```

9. **Problemy z Redis**
   - Sprawdź logi Redis:
     ```bash
     docker logs aiasisstmarubo-redis-1 --tail 20
     ```
   - Sprawdź połączenie:
     ```bash
     docker exec aiasisstmarubo-redis-1 redis-cli ping
     ```

10. **Problemy z Celery (worker/scheduler)**
    - Sprawdź logi workera:
      ```bash
      docker logs aiasisstmarubo-celery_worker-1 --tail 30
      ```
    - Sprawdź logi beat:
      ```bash
      docker logs aiasisstmarubo-celery_beat-1 --tail 30
      ```

**Wskazówka:**  
Jeśli nie wiesz jak naprawić błąd, skopiuj logi i skontaktuj się z administratorem lub zespołem wsparcia.

## 📁 Struktura Plików

```
foodsave-gui/
├── server.py                 # Główny serwer GUI (Flask)
├── index.html               # Interfejs użytkownika
├── style.css                # Style CSS
├── script.js                # Logika JavaScript
├── foodsave-gui.service     # Plik systemd service
├── install-autostart.sh     # Skrypt instalacyjny
├── uninstall-autostart.sh   # Skrypt odinstalacyjny
├── start-gui.sh            # Ręczne uruchamianie
├── stop-gui.sh             # Ręczne zatrzymanie
├── README.md               # Dokumentacja projektu
└── AUTOSTART_SETUP.md      # Ta dokumentacja
```

## 🔒 Bezpieczeństwo

Serwis jest skonfigurowany z następującymi zabezpieczeniami:
- Uruchamiany jako użytkownik (nie root)
- Ograniczone uprawnienia systemowe
- Izolowane środowisko
- Automatyczne restartowanie w przypadku awarii

## 📞 Wsparcie

W przypadku problemów:

### 1. Diagnostyka podstawowa
- Sprawdź logi systemd: `journalctl --user -u foodsave-gui.service`
- Sprawdź czy wszystkie wymagania są spełnione
- Uruchom GUI ręcznie aby sprawdzić błędy: `./start-gui.sh`
- Sprawdź uprawnienia do plików i katalogów

### 2. Diagnostyka zaawansowana
- Sprawdź status wszystkich usług: `./foodsave-all.sh`
- Sprawdź logi Docker: `docker-compose logs`
- Sprawdź dostępność portów: `netstat -tulpn | grep -E ':(8080|8000|3000|5432|11434)'`
- Sprawdź zużycie zasobów: `htop` lub `top`

### 3. Kontakt z zespołem wsparcia
Przygotuj następujące informacje:
- Wersja systemu operacyjnego: `lsb_release -a`
- Wersja Docker: `docker --version`
- Wersja Python: `python3 --version`
- Logi błędów z systemd i Docker
- Opis kroków prowadzących do problemu

### 4. Przydatne komendy diagnostyczne
```bash
# Sprawdź wszystkie usługi systemd użytkownika
systemctl --user list-units --type=service

# Sprawdź wszystkie kontenery Docker
docker ps -a

# Sprawdź zużycie dysku
df -h

# Sprawdź zużycie pamięci
free -h

# Sprawdź procesy używające portów
sudo lsof -i -P -n | grep LISTEN
```

## 🔄 Aktualizacje

Po aktualizacji kodu:
1. Zatrzymaj serwis: `systemctl --user stop foodsave-gui.service`
2. Zaktualizuj kod
3. Uruchom serwis: `systemctl --user start foodsave-gui.service`

---

**Uwaga:** Ten system używa systemd user services, co oznacza, że GUI będzie uruchamiane tylko dla zalogowanego użytkownika. Jeśli potrzebujesz uruchamiania dla wszystkich użytkowników, skontaktuj się z administratorem systemu. 