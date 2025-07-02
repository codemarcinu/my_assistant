# 🔧 Rozwiązywanie Problemów - FoodSave AI

> **Ostatnia aktualizacja:** 2025-07-02  
> **Powiązane dokumenty:** [TOC.md](../TOC.md), [FEATURES.md](FEATURES.md)

## Co znajdziesz w tym dokumencie?

- [x] Najczęstsze problemy i rozwiązania
- [x] Procedury diagnostyczne
- [x] Komendy naprawcze
- [x] Kontakt z pomocą techniczną
- [x] Linki do szczegółowych przewodników

## Spis treści
- [1. 🚨 Problemy Krytyczne](#-problemy-krytyczne)
- [2. 🔧 Problemy Systemowe](#-problemy-systemowe)
- [3. 🤖 Problemy AI/ML](#-problemy-aiml)
- [4. 🌐 Problemy Sieciowe](#-problemy-sieciowe)
- [5. 💾 Problemy z Bazą Danych](#-problemy-z-bazą-danych)
- [6. 📱 Problemy Frontendu](#-problemy-frontendu)
- [7. 📞 Kontakt z Pomocą](#-kontakt-z-pomocą)

---

## 🚨 Problemy Krytyczne

### Problem: System się nie uruchamia
**Objawy:**
- Kontenery Docker nie startują
- Błędy podczas uruchamiania
- System nie odpowiada

**Rozwiązanie:**
```bash
# 1. Sprawdź status systemu
./foodsave-all.sh status

# 2. Zatrzymaj wszystkie usługi
./foodsave-all.sh stop

# 3. Sprawdź zasoby systemowe
df -h          # Wolne miejsce na dysku
free -h        # Dostępna pamięć
top            # Użycie CPU

# 4. Uruchom ponownie
./foodsave-all.sh dev

# 5. Sprawdź logi
./foodsave-all.sh logs
```

### Problem: Błąd SearchAgent
**Objawy:**
```
SearchAgent.__init__() got an unexpected keyword argument 'llm_client'
```

**Rozwiązanie:**
```bash
# 1. Zatrzymaj kontenery
docker compose down

# 2. Usuń cache i przebuduj
docker system prune -af
docker compose build --no-cache

# 3. Uruchom ponownie
docker compose up -d

# 4. Sprawdź status agenta
curl -s http://localhost:8000/monitoring/status | jq '.components.agents.agents.search'
```

### Problem: Brak dostępu do aplikacji
**Objawy:**
- Frontend nie ładuje się (localhost:3000)
- Backend nie odpowiada (localhost:8000)
- Błędy 502/503/504

**Rozwiązanie:**
```bash
# 1. Sprawdź czy porty są zajęte
sudo netstat -tulpn | grep :8000
sudo netstat -tulpn | grep :3000

# 2. Sprawdź status kontenerów
docker ps -a

# 3. Sprawdź logi kontenerów
docker logs <container_name>

# 4. Restart systemu
./foodsave-all.sh stop
./foodsave-all.sh dev
```

---

## 🔧 Problemy Systemowe

### Problem: Wysokie użycie CPU/RAM
**Objawy:**
- System działa wolno
- Aplikacja się zawiesza
- Błędy "out of memory"

**Rozwiązanie:**
```bash
# 1. Sprawdź użycie zasobów
htop
free -h
df -h

# 2. Sprawdź procesy Docker
docker stats

# 3. Ogranicz zasoby dla kontenerów
# Edytuj docker-compose.override.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '2.0'

# 4. Restart z ograniczeniami
./foodsave-all.sh stop
./foodsave-all.sh dev
```

### Problem: Brak miejsca na dysku
**Objawy:**
- Błędy "no space left on device"
- System nie może zapisać plików
- Kontenery się nie uruchamiają

**Rozwiązanie:**
```bash
# 1. Sprawdź użycie dysku
df -h

# 2. Czyszczenie Docker
docker system prune -af
docker volume prune -f

# 3. Czyszczenie logów
find logs/ -name "*.log" -mtime +7 -delete

# 4. Czyszczenie plików tymczasowych
rm -rf temp_uploads/*
rm -rf test-results/*

# 5. Restart systemu
./foodsave-all.sh dev
```

### Problem: Problemy z uprawnieniami
**Objawy:**
- Błędy "permission denied"
- Nie można zapisać plików
- Problemy z Docker

**Rozwiązanie:**
```bash
# 1. Sprawdź uprawnienia
ls -la
ls -la logs/
ls -la data/

# 2. Napraw uprawnienia
sudo chown -R $USER:$USER .
chmod +x foodsave-all.sh

# 3. Sprawdź uprawnienia Docker
sudo usermod -aG docker $USER
newgrp docker

# 4. Restart Docker
sudo systemctl restart docker
```

---

## 🤖 Problemy AI/ML

### Problem: Modele AI nie ładują się
**Objawy:**
- Błędy "model not found"
- Wolne odpowiedzi AI
- Błędy Ollama

**Rozwiązanie:**
```bash
# 1. Sprawdź status Ollama
curl http://localhost:11434/api/tags

# 2. Sprawdź dostępne modele
docker exec -it ollama ollama list

# 3. Pobierz wymagane modele
docker exec -it ollama ollama pull bielik-4.5b-v3.0
docker exec -it ollama ollama pull bielik-11b-v2.3

# 4. Sprawdź logi Ollama
docker logs ollama

# 5. Restart Ollama
docker restart ollama
```

### Problem: Wolne odpowiedzi AI
**Objawy:**
- Odpowiedzi AI trwają >10 sekund
- System się zawiesza podczas analizy
- Wysokie użycie CPU podczas AI

**Rozwiązanie:**
```bash
# 1. Sprawdź zasoby systemowe
htop
nvidia-smi  # jeśli masz GPU

# 2. Optymalizuj konfigurację Ollama
# Edytuj ollama.conf
models:
  - name: "bielik-4.5b-v3.0"
    parameters:
      num_thread: 8
      num_gpu: 1  # jeśli dostępne GPU

# 3. Sprawdź konfigurację modeli
docker exec -it ollama ollama show bielik-4.5b-v3.0

# 4. Restart z optymalizacją
./foodsave-all.sh stop
./foodsave-all.sh dev
```

### Problem: Błędne analizy paragonów
**Objawy:**
- Niepoprawna kategoryzacja produktów
- Błędne wyciąganie cen
- Problemy z OCR

**Rozwiązanie:**
```bash
# 1. Sprawdź jakość obrazu
# Upewnij się, że obraz jest:
# - Dobrze oświetlony
# - W wysokiej rozdzielczości
# - Bez odblasków

# 2. Sprawdź logi OCR
docker logs backend | grep -i ocr

# 3. Testuj z różnymi obrazami
# Spróbuj z paragonami z różnych sklepów

# 4. Sprawdź konfigurację modeli
curl -s http://localhost:8000/monitoring/status | jq '.components.ai'
```

---

## 🌐 Problemy Sieciowe

### Problem: Problemy z połączeniem
**Objawy:**
- Błędy "connection refused"
- Timeout podczas żądań
- Problemy z WebSocket

**Rozwiązanie:**
```bash
# 1. Sprawdź połączenia sieciowe
netstat -tulpn | grep -E "(8000|3000|11434)"

# 2. Sprawdź firewall
sudo ufw status
sudo iptables -L

# 3. Testuj połączenia lokalne
curl http://localhost:8000/health
curl http://localhost:3000

# 4. Sprawdź DNS
nslookup localhost
ping localhost
```

### Problem: Problemy z proxy/SSL
**Objawy:**
- Błędy SSL/TLS
- Problemy z certyfikatami
- Błędy proxy

**Rozwiązanie:**
```bash
# 1. Sprawdź certyfikaty SSL
openssl s_client -connect localhost:8000

# 2. Sprawdź konfigurację nginx
docker logs nginx

# 3. Testuj bez SSL
curl http://localhost:8000/health

# 4. Sprawdź konfigurację proxy
cat nginx/proxy.conf
```

---

## 💾 Problemy z Bazą Danych

### Problem: Błąd połączenia z bazą danych
**Objawy:**
- Błędy "database connection failed"
- Timeout podczas zapytań
- Błędy "connection pool exhausted"

**Rozwiązanie:**
```bash
# 1. Sprawdź status PostgreSQL
docker ps | grep postgres
docker logs postgres

# 2. Sprawdź połączenia
docker exec -it postgres psql -U postgres -c "SELECT * FROM pg_stat_activity;"

# 3. Sprawdź konfigurację
docker exec -it postgres cat /var/lib/postgresql/data/postgresql.conf

# 4. Restart bazy danych
docker restart postgres

# 5. Sprawdź połączenie
docker exec -it postgres psql -U postgres -d foodsave -c "SELECT 1;"
```

### Problem: Wolne zapytania do bazy danych
**Objawy:**
- Zapytania trwają >1 sekundy
- Wysokie użycie CPU przez PostgreSQL
- Błędy "query timeout"

**Rozwiązanie:**
```bash
# 1. Sprawdź wolne zapytania
docker exec -it postgres psql -U postgres -c "
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;"

# 2. Optymalizuj indeksy
docker exec -it postgres psql -U postgres -d foodsave -c "
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_id 
ON messages(conversation_id);"

# 3. Analizuj tabele
docker exec -it postgres psql -U postgres -d foodsave -c "VACUUM ANALYZE;"

# 4. Sprawdź konfigurację
docker exec -it postgres psql -U postgres -c "SHOW shared_buffers;"
```

### Problem: Błąd Redis
**Objawy:**
- Błędy "redis connection failed"
- Problemy z cache
- Błędy sesji

**Rozwiązanie:**
```bash
# 1. Sprawdź status Redis
docker ps | grep redis
docker logs redis

# 2. Sprawdź połączenie Redis
docker exec -it redis redis-cli ping

# 3. Sprawdź pamięć Redis
docker exec -it redis redis-cli info memory

# 4. Restart Redis
docker restart redis

# 5. Sprawdź konfigurację
docker exec -it redis redis-cli CONFIG GET maxmemory
```

---

## 📱 Problemy Frontendu

### Problem: Frontend się nie ładuje
**Objawy:**
- Biały ekran w przeglądarce
- Błędy JavaScript w konsoli
- Problemy z ładowaniem zasobów

**Rozwiązanie:**
```bash
# 1. Sprawdź status frontendu
docker ps | grep frontend
docker logs frontend

# 2. Sprawdź build
cd myappassistant-chat-frontend
npm run build

# 3. Sprawdź zależności
npm install
npm audit fix

# 4. Restart frontendu
docker restart frontend

# 5. Sprawdź w przeglądarce
# Otwórz DevTools (F12) i sprawdź Console
```

### Problem: Problemy z Tauri
**Objawy:**
- Aplikacja desktop się nie uruchamia
- Błędy podczas kompilacji
- Problemy z uprawnieniami

**Rozwiązanie:**
```bash
# 1. Sprawdź Rust
rustc --version
cargo --version

# 2. Sprawdź Tauri
cd myappassistant-chat-frontend
npm run tauri info

# 3. Przebuduj aplikację
npm run tauri build

# 4. Sprawdź uprawnienia
chmod +x src-tauri/target/release/ai-agent

# 5. Uruchom w trybie dev
npm run tauri dev
```

---

## 📊 Diagnostyka Systemu

### Automatyczna Diagnostyka
```bash
# Uruchom pełną diagnostykę
./foodsave-all.sh

# Wybierz opcję 6: Diagnostyka
# System sprawdzi:
# - Status wszystkich usług
# - Zasoby systemowe
# - Konfigurację sieci
# - Logi błędów
# - Rekomendacje napraw
```

### Ręczna Diagnostyka
```bash
# 1. Sprawdź status systemu
./foodsave-all.sh status

# 2. Sprawdź logi
./foodsave-all.sh logs

# 3. Sprawdź zasoby
df -h && free -h && top -n 1

# 4. Sprawdź sieć
netstat -tulpn | grep -E "(8000|3000|11434)"

# 5. Sprawdź Docker
docker ps -a && docker system df
```

---

## 📞 Kontakt z Pomocą

### Zbieranie Informacji
Przed kontaktem z pomocą techniczną zbierz:

```bash
# 1. Status systemu
./foodsave-all.sh status > system_status.txt

# 2. Logi systemu
./foodsave-all.sh logs > system_logs.txt

# 3. Informacje o systemie
uname -a > system_info.txt
docker version > docker_info.txt

# 4. Zasoby systemowe
df -h > disk_usage.txt
free -h > memory_usage.txt
top -n 1 > cpu_usage.txt
```

### Kanały Pomocy
- **GitHub Issues**: [Zgłoś problem](https://github.com/codemarcinu/my_assistant/issues)
- **Dokumentacja**: [docs/](TOC.md)
- **Panel sterowania**: `./foodsave-all.sh`
- **Diagnostyka**: Opcja 6 w panelu sterowania

### Informacje do Zgłoszenia
- **Opis problemu**: Co się dzieje?
- **Kroki reprodukcji**: Jak odtworzyć problem?
- **Oczekiwane zachowanie**: Co powinno się dziać?
- **Logi błędów**: Skopiuj błędy z konsoli
- **Informacje systemowe**: OS, wersje, zasoby

---

## 🔗 Linki do Dokumentacji

### Szczegółowe Przewodniki
- [Szybki start](../QUICK_START.md) - Podstawowe uruchomienie
- [Funkcje systemu](FEATURES.md) - Opis funkcji
- [Panel sterowania](../QUICK_START.md#-panel-sterowania) - Zarządzanie systemem
- [Monitoring](../guides/deployment/MONITORING.md) - Monitoring systemu

### Techniczne Przewodniki
- [Dokumentacja API](../core/API_REFERENCE.md) - Endpointy API
- [Architektura systemu](../core/ARCHITECTURE.md) - Szczegóły techniczne
- [Stack technologiczny](../core/TECHNOLOGY_STACK.md) - Używane technologie
- [Przewodnik testowania](../guides/development/TESTING.md) - Testy systemu

---

## 📋 Checklista Rozwiązywania Problemów

### Podstawowe Sprawdzenia
- [ ] Czy system ma wystarczająco zasobów?
- [ ] Czy wszystkie usługi są uruchomione?
- [ ] Czy porty nie są zajęte?
- [ ] Czy logi nie pokazują błędów?
- [ ] Czy konfiguracja jest poprawna?

### Zaawansowane Sprawdzenia
- [ ] Czy baza danych działa poprawnie?
- [ ] Czy modele AI są załadowane?
- [ ] Czy sieć jest skonfigurowana?
- [ ] Czy uprawnienia są poprawne?
- [ ] Czy cache nie jest pełny?

---

> **💡 Wskazówka:** Większość problemów można rozwiązać używając panelu sterowania `foodsave-all.sh`. Zawsze zaczynaj od opcji "Diagnostyka" - automatycznie wykryje i naprawi wiele problemów. 