# Skrypty Automatyzacji Dokumentacji

## Przegląd

System automatyzacji dokumentacji FoodSave AI / MyAppAssistant zawiera dwa główne skrypty, które zapewniają kompleksowe zarządzanie dokumentacją projektu:

1. **`scripts/update_documentation.sh`** - Główny skrypt aktualizacji dokumentacji
2. **`scripts/generate_toc.sh`** - Skrypt generowania spisu treści

## 1. Skrypt Aktualizacji Dokumentacji

### Plik: `scripts/update_documentation.sh`

#### Cel i Funkcjonalność
Główny skrypt automatyzacji, który wykonuje kompleksową aktualizację dokumentacji projektu:

- **Aktualizacja dat** w plikach markdown
- **Sprawdzanie statusu testów** backend i frontend
- **Walidacja linków** i wykrywanie uszkodzonych odnośników
- **Walidacja składni markdown** i wykrywanie błędów
- **Generowanie podsumowania dokumentacji**
- **Aktualizacja spisu treści (TOC)**

#### Użycie
```bash
# Pełna aktualizacja dokumentacji
bash scripts/update_documentation.sh

# Lub z pełną ścieżką
bash /path/to/project/scripts/update_documentation.sh
```

#### Funkcje Skryptu

##### `update_dates()`
- **Cel:** Aktualizuje daty w plikach markdown
- **Funkcjonalność:**
  - Znajduje wszystkie pliki `.md` w projekcie
  - Aktualizuje pola "Last Updated", "Ostatnia aktualizacja"
  - Aktualizuje rok copyright
  - Aktualizuje daty "Generated on"
- **Wyjście:** Informuje o liczbie zaktualizowanych plików

##### `update_test_status()`
- **Cel:** Sprawdza status testów backend i frontend
- **Funkcjonalność:**
  - Analizuje pliki `backend_test_results.txt` i `frontend_test_results.txt`
  - Wyświetla status testów (passed/failed/unknown)
  - Rekomenduje ręczny przegląd statusu testów

##### `check_broken_links()`
- **Cel:** Wykrywa uszkodzone linki w dokumentacji
- **Funkcjonalność:**
  - Skanuje wszystkie pliki markdown pod kątem linków
  - Sprawdza względne i bezwzględne ścieżki
  - Wykrywa linki do nieistniejących plików
  - Wyświetla ostrzeżenia dla uszkodzonych linków
- **Wyjście:** Liczba znalezionych uszkodzonych linków

##### `validate_markdown()`
- **Cel:** Waliduje składnię markdown
- **Funkcjonalność:**
  - Sprawdza niezamknięte bloki kodu (```)
  - Wykrywa nieprawidłowo sformatowane linki
  - Sprawdza spójność składni markdown
- **Wyjście:** Liczba plików z problemami składni

##### `generate_documentation_summary()`
- **Cel:** Generuje podsumowanie dokumentacji projektu
- **Funkcjonalność:**
  - Tworzy plik `docs/DOCUMENTATION_SUMMARY.md`
  - Zawiera przegląd struktury dokumentacji
  - Listuje wszystkie sekcje dokumentacji
  - Zawiera szybkie linki do głównych dokumentów
  - Aktualizuje datę ostatniej modyfikacji

##### `generate_toc()`
- **Cel:** Generuje spis treści
- **Funkcjonalność:**
  - Wywołuje skrypt `generate_toc.sh`
  - Aktualizuje główny spis treści
  - Generuje mini-spisy treści dla poszczególnych plików

#### Obsługa Błędów
- **Resilient Error Handling:** Skrypt kontynuuje działanie nawet przy błędach
- **Debug Output:** Szczegółowe informacje debugowania
- **Color-coded Messages:** Kolorowe komunikaty (SUCCESS, WARNING, ERROR, DEBUG)
- **Graceful Degradation:** Funkcje mogą się nie powieść bez przerywania całego procesu

#### Przykład Wyjścia
```
Starting documentation update process...
========================================
[DEBUG] Script started at sob, 28 cze 2025, 10:34:39 CEST
[DEBUG] Calling update_dates...
=== Updating dates in documentation ===
[INFO] Updated dates in 16 files
[DEBUG] Finished update_dates.
[DEBUG] Calling update_test_status...
=== Checking and updating test status ===
[INFO] Backend test status: unknown
[INFO] Frontend test status: unknown
[DEBUG] Finished update_test_status.
[DEBUG] Calling check_broken_links...
=== Checking for broken links ===
[WARNING] Broken link in README.md: LICENSE
[ERROR] Found 92 broken links
[WARNING] Broken links check failed, continuing...
[DEBUG] Finished check_broken_links.
[DEBUG] Calling validate_markdown...
=== Validating markdown syntax ===
[WARNING] Found 26 files with syntax issues
[DEBUG] Finished validate_markdown.
[DEBUG] About to generate documentation summary...
=== Generating documentation summary ===
[SUCCESS] Documentation summary generated successfully
[DEBUG] Finished generate_documentation_summary.
[DEBUG] Calling generate_toc...
=== Generating TOC ===
[SUCCESS] TOC generation completed
[DEBUG] Finished generate_toc.
========================================
[SUCCESS] Documentation update process completed!
```

## 2. Skrypt Generowania Spisu Treści

### Plik: `scripts/generate_toc.sh`

#### Cel i Funkcjonalność
Wyspecjalizowany skrypt do generowania spisów treści dla dokumentacji:

- **Główny spis treści** - Kompleksowy TOC dla całego projektu
- **Mini-spisy treści** - Dodawane do poszczególnych plików markdown
- **Kategoryzacja dokumentacji** - Organizacja według tematów
- **Sprawdzanie spójności** - Walidacja linków w TOC

#### Użycie
```bash
# Generowanie głównego TOC
bash scripts/generate_toc.sh

# Generowanie mini-TOC dla wszystkich plików
bash scripts/generate_toc.sh --all

# Sprawdzanie spójności TOC
bash scripts/generate_toc.sh --check
```

#### Funkcje Skryptu

##### `generate_main_toc()`
- **Cel:** Generuje główny spis treści projektu
- **Funkcjonalność:**
  - Tworzy `docs/TOC.md` z kompleksową strukturą
  - Organizuje dokumentację w 10 głównych sekcjach tematycznych
  - Zawiera linki do wszystkich dokumentów
  - Dodaje datę ostatniej aktualizacji

##### `generate_mini_toc()`
- **Cel:** Generuje mini-spisy treści dla poszczególnych plików
- **Funkcjonalność:**
  - Analizuje nagłówki w plikach markdown
  - Tworzy lokalne spisy treści
  - Dodaje je na początku plików
  - Zachowuje istniejącą zawartość

##### `check_toc_consistency()`
- **Cel:** Sprawdza spójność spisów treści
- **Funkcjonalność:**
  - Weryfikuje czy wszystkie pliki są uwzględnione w TOC
  - Sprawdza poprawność linków
  - Wykrywa brakujące dokumenty
  - Generuje raport spójności

#### Struktura Głównego TOC
```markdown
# Spis Treści - FoodSave AI / MyAppAssistant

## 1. Przegląd Projektu
- README.md
- ROADMAP.md
- IMPLEMENTATION_SUMMARY.md

## 2. Backend
- docs/ARCHITECTURE_DOCUMENTATION.md
- docs/API_REFERENCE.md
- docs/AGENTS_GUIDE.md

## 3. Frontend
- myappassistant-chat-frontend/README.md
- docs/frontend-implementation-plan.md

## 4. Dokumentacja
- docs/TESTING_GUIDE.md
- docs/DEPLOYMENT_GUIDE.md
- docs/DATABASE_GUIDE.md

## 5. Testowanie
- tests/FINAL_TEST_STATUS.md
- docs/ANTI_HALLUCINATION_GUIDE.md

## 6. Monitoring i Telemetria
- docs/MONITORING_TELEMETRY_GUIDE.md
- monitoring/grafana/OLLAMA_MONITORING_GUIDE.md

## 7. Baza Danych i Backup
- docs/BACKUP_SYSTEM_GUIDE.md
- docs/DATABASE_GUIDE.md

## 8. Wdrożenie
- docs/DEPLOYMENT_GUIDE.md
- docs/TELEGRAM_BOT_DEPLOYMENT_GUIDE.md

## 9. Frontend UX
- myappassistant-chat-frontend/FRONTEND_IMPLEMENTATION.md
- myappassistant-chat-frontend/DASHBOARD_IMPLEMENTATION.md

## 10. Rozwój i Roadmap
- docs/CONTRIBUTING_GUIDE.md
- docs/ROADMAP.md
```

## 3. Plik README dla Skryptów

### Plik: `scripts/README.md`

#### Cel
Dokumentacja użytkownika dla skryptów automatyzacji:

- **Instrukcje użycia** dla każdego skryptu
- **Przykłady komend** z różnymi opcjami
- **Opis funkcjonalności** i możliwości
- **Rozwiązywanie problemów** i FAQ

## 4. Integracja z Workflow

### Automatyzacja w CI/CD
Skrypty mogą być zintegrowane z pipeline'ami CI/CD:

```yaml
# Przykład dla GitHub Actions
- name: Update Documentation
  run: |
    bash scripts/update_documentation.sh
    
- name: Generate TOC
  run: |
    bash scripts/generate_toc.sh --all
```

### Harmonogram Aktualizacji
Można skonfigurować automatyczne uruchamianie:

```bash
# Cron job dla codziennej aktualizacji
0 2 * * * cd /path/to/project && bash scripts/update_documentation.sh
```

## 5. Rozwiązywanie Problemów

### Typowe Problemy

#### Skrypt się zatrzymuje
- **Przyczyna:** Błędy składni bash lub brakujące funkcje
- **Rozwiązanie:** Sprawdź debug output i upewnij się, że wszystkie funkcje są zdefiniowane

#### Brak uprawnień do zapisu
- **Przyczyna:** Brak uprawnień do katalogu `docs/`
- **Rozwiązanie:** `chmod 755 docs/` lub uruchom z odpowiednimi uprawnieniami

#### Uszkodzone linki
- **Przyczyna:** Pliki zostały przeniesione lub usunięte
- **Rozwiązanie:** Zaktualizuj linki w dokumentacji lub przywróć brakujące pliki

### Debugowanie
Skrypty zawierają szczegółowe debug output:
```bash
# Włącz dodatkowe debug info
export DEBUG=1
bash scripts/update_documentation.sh
```

## 6. Rozszerzenia i Dostosowania

### Dodawanie Nowych Funkcji
Skrypty są modularne i łatwe do rozszerzenia:

```bash
# Dodaj nową funkcję do update_documentation.sh
add_new_function() {
    print_header "Nowa funkcjonalność"
    # Implementacja
    success_print "Nowa funkcja zakończona"
}
```

### Konfiguracja
Można dostosować zachowanie skryptów przez zmienne środowiskowe:

```bash
# Konfiguracja ścieżek
export PROJECT_ROOT="/custom/path"
export DOCS_DIR="/custom/docs"

# Konfiguracja zachowania
export SKIP_LINK_CHECK=1
export VERBOSE_DEBUG=1
```

## Podsumowanie

System skryptów automatyzacji dokumentacji zapewnia:

✅ **Kompleksową aktualizację** wszystkich aspektów dokumentacji  
✅ **Automatyczne generowanie** spisów treści  
✅ **Walidację jakości** dokumentacji  
✅ **Resilient error handling** z kontynuacją działania  
✅ **Szczegółowe debug output** dla łatwego rozwiązywania problemów  
✅ **Modularną architekturę** umożliwiającą łatwe rozszerzenia  

Skrypty są gotowe do użycia w produkcji i mogą być zintegrowane z workflow'ami CI/CD oraz harmonogramami automatycznych aktualizacji. 