# 🐳 Zarządzanie Kontenerami Docker - FoodSave AI GUI

## 📋 Przegląd

Sekcja "Zarządzanie Kontenerami" w GUI FoodSave AI umożliwia użytkownikom nietechnicznym łatwe zarządzanie kontenerami Docker bez konieczności używania wiersza poleceń.

## 🎯 Funkcjonalności

### 1. **Zarządzanie Masowe**
- **Uruchom Wszystkie** - Włącza wszystkie kontenery Docker
- **Zatrzymaj Wszystkie** - Wyłącza wszystkie kontenery Docker
- **Restartuj Wszystkie** - Uruchamia ponownie wszystkie kontenery
- **Przebuduj Wszystkie** - Przebudowuje obrazy i uruchamia kontenery

### 2. **Zarządzanie Indywidualne**
- **Start/Stop** - Uruchamianie i zatrzymywanie pojedynczych kontenerów
- **Restart** - Restartowanie pojedynczych kontenerów
- **Logi** - Wyświetlanie logów kontenerów w czasie rzeczywistym

### 3. **Monitorowanie Statusu**
- Wizualne wskaźniki statusu (zielony = działa, czerwony = zatrzymany)
- Lista wszystkich kontenerów z informacjami o obrazach
- Status w czasie rzeczywistym

## 🚀 Jak Używać

### Dostęp do Sekcji
1. Otwórz GUI FoodSave AI w przeglądarce
2. W sekcji "Potrzebujesz Pomocy?" kliknij "Kontenery"
3. Lub przejdź bezpośrednio do: `http://localhost:8080`

### Zarządzanie Masowe
1. **Uruchomienie wszystkich kontenerów:**
   - Kliknij przycisk "Uruchom Wszystkie"
   - Poczekaj na potwierdzenie sukcesu
   - Sprawdź status w liście kontenerów

2. **Zatrzymanie wszystkich kontenerów:**
   - Kliknij przycisk "Zatrzymaj Wszystkie"
   - Potwierdź akcję w oknie dialogowym
   - Poczekaj na zakończenie operacji

3. **Restart wszystkich kontenerów:**
   - Kliknij przycisk "Restartuj Wszystkie"
   - Potwierdź akcję
   - Kontenery zostaną zatrzymane i uruchomione ponownie

4. **Przebudowanie wszystkich kontenerów:**
   - Kliknij przycisk "Przebuduj Wszystkie"
   - **UWAGA:** To może potrwać kilka minut
   - Potwierdź akcję w oknie dialogowym

### Zarządzanie Indywidualne
1. **Uruchomienie pojedynczego kontenera:**
   - W liście kontenerów znajdź zatrzymany kontener
   - Kliknij przycisk "Start" obok kontenera
   - Poczekaj na potwierdzenie

2. **Zatrzymanie pojedynczego kontenera:**
   - W liście kontenerów znajdź działający kontener
   - Kliknij przycisk "Stop" obok kontenera
   - Poczekaj na potwierdzenie

3. **Restart pojedynczego kontenera:**
   - Kliknij przycisk "Restart" obok kontenera
   - Kontener zostanie zatrzymany i uruchomiony ponownie

4. **Wyświetlanie logów:**
   - Kliknij przycisk "Logi" obok kontenera
   - Logi zostaną wyświetlone w nowym oknie
   - Możesz przewijać i kopiować logi

## 🎨 Interfejs Użytkownika

### Wskaźniki Statusu
- 🟢 **Zielony** - Kontener działa poprawnie
- 🔴 **Czerwony** - Kontener jest zatrzymany
- 🟡 **Pomarańczowy (pulsujący)** - Kontener się restartuje

### Przyciski Akcji
- **Zielone przyciski** - Akcje uruchamiające (Start, Uruchom Wszystkie)
- **Czerwone przyciski** - Akcje zatrzymujące (Stop, Zatrzymaj Wszystkie)
- **Niebieskie przyciski** - Akcje restartujące (Restart, Restartuj Wszystkie)
- **Pomarańczowe przyciski** - Akcje przebudowujące (Przebuduj Wszystkie)
- **Szare przyciski** - Akcje informacyjne (Logi)

## 🔧 Rozwiązywanie Problemów

### Kontenery Nie Uruchamiają Się
1. Sprawdź czy Docker jest uruchomiony
2. Sprawdź logi kontenera (przycisk "Logi")
3. Spróbuj przebudować kontenery
4. Sprawdź czy porty nie są zajęte

### Błędy Podczas Operacji
1. Sprawdź uprawnienia użytkownika do Docker
2. Upewnij się że masz wystarczająco miejsca na dysku
3. Sprawdź logi systemu w sekcji "Logi"

### Kontenery Nie Są Widoczne
1. Odśwież listę kontenerów
2. Sprawdź czy Docker Compose jest uruchomiony
3. Sprawdź czy pliki docker-compose.yml istnieją

## 📊 Monitorowanie

### Informacje Wyświetlane
- **Nazwa kontenera** - Identyfikator kontenera
- **Obraz** - Nazwa obrazu Docker
- **Status** - Aktualny stan kontenera
- **Akcje** - Dostępne operacje

### Automatyczne Odświeżanie
- Lista kontenerów jest odświeżana po każdej operacji
- Status jest aktualizowany w czasie rzeczywistym
- Logi są pobierane na żądanie

## 🛡️ Bezpieczeństwo

### Potwierdzenia
- Wszystkie destrukcyjne operacje wymagają potwierdzenia
- Operacje masowe mają dodatkowe ostrzeżenia
- Przebudowanie kontenerów ma specjalne ostrzeżenie o czasie trwania

### Uprawnienia
- GUI wymaga uprawnień do zarządzania Docker
- Operacje są wykonywane w kontekście użytkownika systemu
- Logi są filtrowane pod kątem bezpieczeństwa

## 🔄 Integracja z Systemem

### Powiązanie z FoodSave AI
- Kontenery są używane przez główne komponenty systemu
- Backend, Frontend, Baza danych, AI Agents
- Automatyczne zarządzanie zależnościami

### Synchronizacja Statusu
- Status kontenerów wpływa na ogólny status systemu
- Problemy z kontenerami są odzwierciedlane w głównym statusie
- Automatyczne powiadomienia o problemach

## 📝 Przykłady Użycia

### Scenariusz 1: Pierwsze Uruchomienie
1. Otwórz GUI FoodSave AI
2. Przejdź do sekcji "Kontenery"
3. Kliknij "Uruchom Wszystkie"
4. Poczekaj na uruchomienie wszystkich komponentów
5. Sprawdź status w głównym interfejsie

### Scenariusz 2: Rozwiązywanie Problemów
1. Zauważ czerwony status w głównym interfejsie
2. Przejdź do sekcji "Kontenery"
3. Sprawdź które kontenery są zatrzymane
4. Sprawdź logi problematycznych kontenerów
5. Restartuj problematyczne kontenery
6. Jeśli problemy się powtarzają, przebuduj kontenery

### Scenariusz 3: Aktualizacja Systemu
1. Po aktualizacji kodu, przejdź do sekcji "Kontenery"
2. Kliknij "Przebuduj Wszystkie"
3. Poczekaj na zakończenie procesu (kilka minut)
4. Sprawdź czy wszystkie kontenery działają
5. Przetestuj funkcjonalność systemu

## 🎯 Korzyści dla Użytkowników Nietechnicznych

### Łatwość Użycia
- **Brak konieczności znajomości komend** - Wszystko przez interfejs graficzny
- **Intuicyjne ikony** - Kolorowe wskaźniki i ikony
- **Jasne komunikaty** - Polskie opisy i potwierdzenia

### Automatyzacja
- **Operacje masowe** - Jednym kliknięciem zarządzaj wszystkimi kontenerami
- **Automatyczne odświeżanie** - Status aktualizuje się automatycznie
- **Inteligentne potwierdzenia** - System ostrzega przed ryzykownymi operacjami

### Bezpieczeństwo
- **Potwierdzenia operacji** - Brak przypadkowego zatrzymania systemu
- **Ostrzeżenia czasowe** - Informacje o długotrwałych operacjach
- **Bezpieczne logi** - Filtrowane informacje bez wrażliwych danych

## 🔮 Przyszłe Rozszerzenia

### Planowane Funkcjonalności
- **Monitorowanie zasobów** - CPU, RAM, dysk dla każdego kontenera
- **Historia operacji** - Logi wszystkich wykonanych akcji
- **Harmonogram zadań** - Automatyczne restartowanie o określonych godzinach
- **Backup kontenerów** - Tworzenie kopii zapasowych konfiguracji
- **Alerty** - Powiadomienia o problemach z kontenerami

### Integracje
- **Monitoring zewnętrzny** - Integracja z Prometheus/Grafana
- **Powiadomienia** - Email/SMS o problemach
- **API zewnętrzne** - Integracja z systemami monitoringu

---

**Wersja dokumentacji:** 1.0  
**Data aktualizacji:** 2025-07-04  
**Autor:** FoodSave AI Team 