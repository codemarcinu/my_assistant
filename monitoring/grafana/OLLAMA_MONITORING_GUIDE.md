# Ollama Monitoring Guide (FoodSave AI)

## Cel
Ten dokument opisuje najlepsze praktyki monitorowania komunikacji z Ollama w projekcie FoodSave AI. Pozwala śledzić wszystkie prompty i odpowiedzi modeli LLM, zgodnie z wymaganiami bezpieczeństwa, debugowania i audytu.

## Struktura logów
Każda interakcja z Ollama (zarówno prompt, jak i odpowiedź) jest logowana przez backend FastAPI w formacie JSON:

- `event`: "ollama_prompt" lub "ollama_response"
- `model`: nazwa modelu LLM
- `messages`: lista wiadomości (prompt)
- `options`: parametry wywołania
- `response`: odpowiedź modelu (dla response)
- `duration`: czas generowania odpowiedzi (dla response)
- `timestamp`: znacznik czasu
- `stream`: czy odpowiedź była streamowana

Logi są dostępne w Grafanie przez Loki (job: `backend_logs`).

## Import dashboardu
1. Otwórz Grafanę (domyślnie http://localhost:3000)
2. Wybierz "Import dashboard"
3. Wskaż plik: `monitoring/grafana/dashboards/ollama-prompts-dashboard.json`
4. Wybierz źródło danych: `loki_foodsave_logs`
5. Zapisz i otwórz dashboard

## Przykładowe panele
- **Ollama Prompts & Responses (Backend)** – logi z eventami `ollama_prompt` i `ollama_response`
- **Ollama Responses Table (Backend)** – tabela z model, prompt, odpowiedź, czas generowania

## Filtrowanie i analiza
- Możesz filtrować po polu `model`, `event`, czasie, itp.
- Przykład zapytania Loki:
  ```
  {job="backend_logs"} |~ "ollama_prompt|ollama_response" | json | model="gemma3:12b"
  ```
- Zalecane: nie udostępniaj dashboardu publicznie (dane mogą zawierać wrażliwe prompty/użytkowników)

## Bezpieczeństwo i zgodność
- Logi nie powinny zawierać danych osobowych użytkowników (PII) – jeśli prompt zawiera takie dane, należy je maskować przed logowaniem (zgodnie z polityką FoodSave AI)
- Dostęp do dashboardu powinien być ograniczony do zespołu technicznego
- Zgodnie z `.cursorrules`: zawsze stosuj structured logging, nie loguj nadmiarowych danych, dbaj o bezpieczeństwo

## Troubleshooting
- Jeśli logi nie pojawiają się w dashboardzie:
  - Sprawdź, czy backend generuje logi z eventem `ollama_prompt`/`ollama_response`
  - Sprawdź status Promtail i Loki
  - Zweryfikuj, czy dashboard używa poprawnego źródła danych
- W razie problemów z wydajnością ogranicz zakres czasowy dashboardu

## Rozszerzenia
- Możesz dodać alerty Grafana na podstawie liczby błędów, opóźnień lub nietypowych promptów
- Możliwe jest rozszerzenie logowania o identyfikator użytkownika (anonimizowany), trace_id lub inne metadane (zgodnie z polityką bezpieczeństwa)

---

> Dokument zgodny z wymaganiami `.cursorrules` (monitoring, structured logging, bezpieczeństwo, audyt, troubleshooting) 