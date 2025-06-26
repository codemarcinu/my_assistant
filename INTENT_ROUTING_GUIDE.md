# 🧠 PRZEWODNIK PO ROZDZIELANIU ZADAŃ DLA AGENTÓW

**Ostatnia aktualizacja:** 26.06.2025  
**Status:** ✅ ZAIMPLEMENTOWANE I PRZETESTOWANE

---

## 🎯 **JAK DZIAŁA ROZDZIELANIE ZADAŃ**

System AIASISSTMARUBO automatycznie rozpoznaje intencje użytkownika w języku naturalnym i kieruje je do odpowiednich agentów AI. Oto jak to działa:

### 📋 **PRZEPŁYW PRZETWARZANIA**

```
1. Użytkownik → Wprowadza tekst w języku naturalnym
2. IntentDetector → Analizuje tekst i wykrywa intencję
3. AgentRouter → Mapuje intencję na odpowiedniego agenta
4. Orchestrator → Koordynuje przetwarzanie przez agenta
5. Agent → Przetwarza żądanie i zwraca odpowiedź
6. Użytkownik ← Otrzymuje odpowiedź od właściwego agenta
```

---

## 🔍 **WYKRYWANIE INTENCJI**

### 🤖 **IntentDetector - Jak działa**

System używa **hybrydowego podejścia** do wykrywania intencji:

1. **LLM-based detection** (główny sposób)
   - Używa modelu Bielik 11B do analizy tekstu
   - Zwraca JSON z wykrytą intencją
   - Wysoka dokładność dla złożonych zapytań

2. **Rule-based fallback** (zapasowy sposób)
   - Słowa kluczowe dla każdej intencji
   - Działa gdy LLM nie jest dostępny
   - Szybkie przetwarzanie prostych zapytań

### 📝 **Przykład działania LLM**

```python
# Wejście użytkownika
text = "Wczoraj wydałem 150 zł w Biedronce na jedzenie"

# Prompt do LLM
prompt = "Wykryj intencję użytkownika na podstawie tekstu: 'Wczoraj wydałem 150 zł w Biedronce na jedzenie'. Zwróć JSON: {\"intent\": ...}"

# Odpowiedź LLM
response = {"intent": "shopping_conversation"}

# Wynik
intent_data = IntentData(
    type="shopping_conversation",
    entities={"amount": "150 zł", "store": "Biedronka", "category": "jedzenie"},
    confidence=0.95
)
```

---

## 🗺️ **MAPOWANIE INTENCJI NA AGENTÓW**

### 📊 **Tabela mapowania**

| Intencja | Agent | Opis | Przykłady zapytań |
|----------|-------|------|-------------------|
| `general_conversation` | GeneralConversationAgent | Konwersacja ogólna | "Cześć", "Jak się masz?", "Opowiedz żart" |
| `shopping_conversation` | ShoppingConversationAgent | Zakupy i paragony | "Wydałem 150 zł", "Mam paragon", "Ile wydałem" |
| `food_conversation` | FoodConversationAgent | Jedzenie i gotowanie | "Jak ugotować", "Czy to zdrowe", "Przepis na" |
| `meal_planning` | MealPlannerAgent | Planowanie posiłków | "Zaplanuj posiłki", "Dieta wegetariańska" |
| `weather` | WeatherAgent | Informacje o pogodzie | "Jaka pogoda", "Czy będzie padać" |
| `information_query` | InformationQueryAgent | Wyszukiwanie informacji | "Co to jest", "Kto wynalazł", "Jak działa" |
| `categorization` | CategorizationAgent | Kategoryzacja danych | "Kategoryzuj", "Przypisz kategorię" |
| `ocr` | OCRAgent | Analiza obrazów | "Przeanalizuj paragon", "Skanuj obraz" |
| `rag` | RAGAgent | Analiza dokumentów | "Przeczytaj dokument", "Analizuj PDF" |
| `search` | SearchAgent | Wyszukiwanie w sieci | "Znajdź informacje", "Wyszukaj" |

### 🔄 **Logika routingu**

```python
def _map_intent_to_agent_type(self, intent_type: str) -> AgentType:
    """Mapuje typ intencji na typ agenta"""
    intent_mapping = {
        "cooking": AgentType.CHEF,
        "weather": AgentType.WEATHER,
        "search": AgentType.SEARCH,
        "rag": AgentType.RAG,
        "ocr": AgentType.OCR,
        "categorization": AgentType.CATEGORIZATION,
        "meal_planning": AgentType.MEAL_PLANNER,
        "analytics": AgentType.ANALYTICS,
        "general_conversation": AgentType.GENERAL_CONVERSATION,
    }
    return intent_mapping.get(intent_type, AgentType.GENERAL_CONVERSATION)
```

---

## 🧪 **TESTOWANIE ROZDZIELANIA INTENCJI**

### 📋 **Dostępne testy**

1. **test_intent_routing.py** - Pełny test z orchestratorem
2. **test_intent_api.py** - Test przez API endpoint
3. **Manualne testy** - Przez endpoint `/api/chat/chat`

### 🚀 **Uruchomienie testów**

```bash
# Test pełnego routingu (wymaga backend)
python test_intent_routing.py

# Test przez API (wymaga uruchomionego backendu)
python test_intent_api.py

# Test manualny przez curl
curl -X POST http://localhost:8000/api/chat/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Jaka jest pogoda w Warszawie?", "session_id": "test"}'
```

### 📊 **Przykłady testów**

```python
# Testy intencji w języku naturalnym
test_cases = [
    ("Cześć, jak się masz?", "general_conversation"),
    ("Wczoraj wydałem 150 zł w Biedronce", "shopping_conversation"),
    ("Jak ugotować spaghetti?", "food_conversation"),
    ("Zaplanuj mi posiłki na tydzień", "meal_planning"),
    ("Jaka jest pogoda w Warszawie?", "weather"),
    ("Co to jest sztuczna inteligencja?", "information_query"),
    ("Kategoryzuj moje wydatki", "categorization"),
    ("Przeanalizuj ten paragon", "ocr"),
    ("Przeczytaj ten dokument", "rag"),
]
```

---

## 🎯 **SŁOWA KLUCZOWE DLA INTENCJI**

### 💬 **General Conversation**
```
"cześć", "witaj", "dzień dobry", "dobry wieczór", "hej", "siema",
"dzięki", "dziękuję", "jak się masz", "co słychać", "co u ciebie",
"ok", "rozumiem", "jasne", "dobra", "pomoc", "pomóż", "help",
"kto ty jesteś", "kim jesteś", "żart", "opowiedz żart"
```

### 🛒 **Shopping Conversation**
```
"zakupy", "shopping", "paragon", "receipt", "wydałem", "spent",
"kupiłem", "bought", "cena", "price", "koszt", "cost", "sklep",
"store", "market", "biedronka", "lidl", "żabka", "carrefour",
"tesco", "suma", "total", "kwota", "amount", "produkt", "product",
"lista zakupów", "shopping list", "wydatki", "expenses"
```

### 🍽️ **Food Conversation**
```
"jedzenie", "food", "przepis", "recipe", "gotowanie", "cooking",
"kuchnia", "kitchen", "posiłek", "meal", "obiad", "dinner",
"śniadanie", "breakfast", "kolacja", "supper", "składniki",
"ingredients", "smak", "taste", "smaczne", "delicious"
```

### 🌤️ **Weather**
```
"weather", "pogoda", "temperature", "temperatura", "jaka pogoda",
"prognoza", "forecast", "deszcz", "rain", "śnieg", "snow",
"słońce", "sun", "wiatr", "wind", "wilgotność", "humidity"
```

### 📅 **Meal Planning**
```
"plan", "posiłki", "dieta", "planowanie", "tydzień", "menu",
"śniadanie", "obiad", "kolacja", "przekąski", "wegetariańska",
"wegańska", "kalorie", "zdrowe", "odżywcze"
```

### 🔍 **Information Query**
```
"co to jest", "what is", "kto to", "who is", "gdzie", "where",
"kiedy", "when", "dlaczego", "why", "jak", "how", "informacje",
"information", "dane", "data", "statystyki", "statistics"
```

### 🏷️ **Categorization**
```
"kategoryzuj", "categorize", "klasyfikuj", "classify", "grupuj",
"group", "sortuj", "sort", "organizuj", "organize", "przypisz kategorię",
"assign category", "jaką kategorię", "what category"
```

### 📷 **OCR**
```
"image", "photo", "zdjęcie", "obraz", "picture", "paragon",
"receipt", "scan", "skanuj", "ocr", "tekst", "text"
```

### 📄 **RAG**
```
"document", "file", "dokument", "plik", "pdf", "text", "tekst",
"analizuj", "analyze", "przeczytaj", "read", "informacje"
```

---

## 🔧 **KONFIGURACJA I DOSTOSOWANIE**

### ⚙️ **Dostosowanie słów kluczowych**

Możesz dodać własne słowa kluczowe w `src/backend/agents/intent_detector.py`:

```python
# Dodaj nowe słowa kluczowe
food_keywords = [
    "jedzenie", "food", "przepis", "recipe",
    # ... istniejące słowa ...
    "twoje_nowe_slowo",  # Dodaj tutaj
]
```

### 🎯 **Dostosowanie mapowania agentów**

Zmodyfikuj mapowanie w `src/backend/agents/agent_router.py`:

```python
intent_mapping = {
    "cooking": AgentType.CHEF,
    "weather": AgentType.WEATHER,
    # ... istniejące mapowania ...
    "twoja_nowa_intencja": AgentType.TWOJ_AGENT,  # Dodaj tutaj
}
```

### 🤖 **Dodawanie nowych agentów**

1. Utwórz nowego agenta implementującego `BaseAgent`
2. Zarejestruj go w `AgentFactory`
3. Dodaj mapowanie w `AgentRouter`
4. Dodaj słowa kluczowe w `IntentDetector`

---

## 📊 **MONITORING I METRYKI**

### 📈 **Metryki do monitorowania**

- **Dokładność wykrywania intencji** - ile intencji zostało poprawnie rozpoznanych
- **Czas wykrywania intencji** - jak szybko system rozpoznaje intencje
- **Rozkład intencji** - które intencje są najczęściej używane
- **Fallback rate** - jak często używany jest rule-based fallback
- **Agent response time** - czas odpowiedzi poszczególnych agentów

### 🔍 **Logi do analizy**

```python
# Logi wykrywania intencji
logger.info(f"Detecting intent for text: '{text}'")
logger.info(f"Successfully parsed intent: {intent_type}")

# Logi routingu
logger.info(f"Routing intent '{intent.type}' to agent {agent_type.value}")

# Logi błędów
logger.warning(f"No agent found for type {agent_type.value}, using fallback")
```

---

## 🚀 **BEST PRACTICES**

### ✅ **Dobre praktyki**

1. **Używaj języka naturalnego** - system jest zaprojektowany dla naturalnych zapytań
2. **Testuj różne formułowania** - sprawdź jak system reaguje na różne sposoby wyrażania tej samej intencji
3. **Monitoruj dokładność** - regularnie sprawdzaj czy intencje są poprawnie rozpoznawane
4. **Dostosowuj słowa kluczowe** - dodawaj nowe słowa kluczowe na podstawie rzeczywistego użycia

### ❌ **Czego unikać**

1. **Zbyt krótkie zapytania** - mogą być niejednoznaczne
2. **Mieszanie intencji** - unikaj zapytań łączących różne domeny
3. **Zbyt techniczne słownictwo** - używaj naturalnego języka
4. **Ignorowanie błędów** - zawsze sprawdzaj logi błędów

---

## 📞 **WSPARCIE I ROZWÓJ**

### 🔧 **Debugowanie**

Jeśli intencje nie są poprawnie rozpoznawane:

1. Sprawdź logi backendu
2. Uruchom testy intencji
3. Sprawdź czy LLM jest dostępny
4. Zweryfikuj słowa kluczowe

### 📈 **Rozwój**

Aby dodać nową intencję:

1. Dodaj słowa kluczowe w `IntentDetector`
2. Utwórz nowego agenta
3. Dodaj mapowanie w `AgentRouter`
4. Przetestuj z różnymi zapytaniami
5. Dodaj do dokumentacji

---

*Przewodnik utworzony na podstawie implementacji systemu AIASISSTMARUBO*  
*Data: 26.06.2025 | Wersja: 1.0 | Status: Aktywny* 