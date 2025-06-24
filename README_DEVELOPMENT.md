## Automatyczna naprawa błędów typów i składniowych (Python)

W projekcie znajduje się skrypt `fix_syntax_errors.py`, który automatycznie naprawia najczęstsze błędy składniowe związane z typowaniem (np. `param -> Any: str` na `param: str`).

### Jak używać?

1. Upewnij się, że jesteś w katalogu głównym projektu.
2. Uruchom skrypt:
   ```bash
   python3 fix_syntax_errors.py
   ```
3. Po zakończeniu uruchom:
   ```bash
   python3 -m mypy src/backend --show-error-codes
   ```
   aby sprawdzić, czy nie ma już błędów typowania/składniowych.

### Co robi skrypt?
- Przeszukuje wszystkie pliki `.py` w `src/backend/`
- Automatycznie poprawia powtarzalne błędy typów/adnotacji
- Wypisuje listę naprawionych plików

### Kiedy uruchamiać?
- Po masowych zmianach w typowaniu
- Po migracji kodu lub automatycznych refaktoryzacjach
- Przed uruchomieniem testów typowania (`mypy`)

### Bezpieczeństwo
- Skrypt nie usuwa kodu, tylko poprawia adnotacje typów
- Zalecane commitowanie zmian po każdej automatycznej naprawie

## Weryfikacja wiedzy przez agenta (Knowledge Verification)

System backendowy posiada agenta SearchAgent, który:
- Wykorzystuje narzędzie `web_search` do pobierania i weryfikacji informacji z zewnętrznych źródeł (Wikipedia, Bing, NewsAPI).
- Ocenia wiarygodność źródeł (knowledge_verified, confidence score) i przekazuje te dane do odpowiedzi.
- Pozwala na bezpośrednią weryfikację twierdzeń przez metodę `verify_knowledge_claim`.
- Integruje się z GeneralConversationAgent, który automatycznie korzysta z weryfikacji wiedzy przy generowaniu odpowiedzi.

### Wymagania i zależności
- Dla pełnej funkcjonalności wymagane są:
  - `vector_store` i `llm_client` (zapewniane automatycznie przez AgentFactory dla SearchAgent)
  - (Opcjonalnie) klucze API do Bing/NewsAPI (jeśli chcesz korzystać z tych źródeł)
  - Działający serwis ollama (jeśli korzystasz z lokalnych modeli LLM)
- Healthcheck backendu sprawdza zdrowie agentów, bazy oraz zewnętrznych API.

### Testowanie
- Testy jednostkowe: `pytest tests/unit/test_search_agent.py` oraz `pytest tests/unit/test_web_search.py`
- Test ręczny: `python test_knowledge_verification.py` (sprawdza end-to-end weryfikację wiedzy)

### Zasady @.cursorrules
- Każdy agent musi mieć zarejestrowane i przekazane zależności przez AgentFactory.
- Wszelkie zmiany w agentach i narzędziach muszą być pokryte testami.
- Dokumentacja powinna być aktualizowana po każdej istotnej zmianie w logice agentów lub narzędzi.
