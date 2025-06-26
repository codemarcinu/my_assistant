"""
Optymalizowane prompty LLM dla szybszych odpowiedzi
Zgodnie z przewodnikiem implementacji napraw krytycznych
"""

from typing import Dict, Any
from datetime import datetime, timedelta
import threading

# Skrócone prompty dla szybszych odpowiedzi
OPTIMIZED_PROMPTS = {
    "intent_detection": "Wykryj intencję: {query}. Odpowiedz JSON: {{\"intent\": \"typ\"}}",
    "simple_response": "Krótka odpowiedź na: {query}. Max 50 słów.",
    "search_query": "Wyszukaj: {query}. Zwróć tylko najważniejsze informacje.",
    "weather_query": "Pogoda dla: {location}. Krótko.",
    "recipe_query": "Przepis na: {dish}. Składniki i kroki.",
    "general_chat": "Odpowiedz na: {query}. Naturalnie i krótko.",
    "error_fallback": "Błąd: {error}. Przepraszam, spróbuj ponownie."
}

# Predefiniowane szablony dla typowych zapytań
PROMPT_TEMPLATES = {
    "greeting": {
        "system": "Jesteś pomocnym asystentem. Odpowiadaj krótko i przyjaźnie.",
        "user": "Cześć! Jak się masz?"
    },
    "weather": {
        "system": "Podaj aktualną pogodę. Krótko i konkretnie.",
        "user": "Jaka jest pogoda w {location}?"
    },
    "recipe": {
        "system": "Podaj prosty przepis. Składniki i kroki.",
        "user": "Jak ugotować {dish}?"
    },
    "search": {
        "system": "Wyszukaj informacje. Zwróć najważniejsze fakty.",
        "user": "Znajdź informacje o {topic}"
    }
}

class OptimizedPrompts:
    """
    Klasa do zarządzania zoptymalizowanymi promptami z cache'owaniem.
    """
    
    def __init__(self, ttl: int = 3600):
        """
        Inicjalizuje OptimizedPrompts.
        
        Args:
            ttl: Czas życia cache w sekundach (domyślnie 1 godzina)
        """
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._cache_timestamps: Dict[str, datetime] = {}
        self._cache_hits = 0
        self._cache_misses = 0
        self._ttl = ttl
        self._lock = threading.Lock()
    
    def get_optimized_prompt(self, prompt_type: str, **kwargs: Any) -> str:
        """
        Zwraca zoptymalizowany prompt z cache'owaniem.
        
        Args:
            prompt_type: Typ promptu (intent_detection, simple_response, etc.)
            **kwargs: Parametry do formatowania promptu
            
        Returns:
            Zoptymalizowany prompt
        """
        if prompt_type not in OPTIMIZED_PROMPTS:
            return f"Odpowiedz na: {kwargs.get('query', 'zapytanie')}"
        
        # Sprawdź cache
        cache_key = f"{prompt_type}:{hash(str(kwargs))}"
        
        with self._lock:
            if cache_key in self._cache:
                # Sprawdź czy cache nie wygasł
                if datetime.now() - self._cache_timestamps[cache_key] < timedelta(seconds=self._ttl):
                    self._cache_hits += 1
                    return self._cache[cache_key]["prompt"]
                else:
                    # Usuń wygasły cache
                    del self._cache[cache_key]
                    del self._cache_timestamps[cache_key]
            
            self._cache_misses += 1
            
            # Formatuj prompt
            try:
                prompt = OPTIMIZED_PROMPTS[prompt_type].format(**kwargs)
                self._cache[cache_key] = {"prompt": prompt, "type": prompt_type}
                self._cache_timestamps[cache_key] = datetime.now()
                return prompt
            except KeyError as e:
                # Fallback dla brakujących parametrów
                prompt = OPTIMIZED_PROMPTS[prompt_type].format(
                    query=kwargs.get('query', 'zapytanie'),
                    **{k: '...' for k in kwargs.keys()}
                )
                self._cache[cache_key] = {"prompt": prompt, "type": prompt_type}
                self._cache_timestamps[cache_key] = datetime.now()
                return prompt
    
    def get_prompt_template(self, template_name: str, **kwargs: Any) -> Dict[str, str]:
        """
        Zwraca szablon promptu z parametrami.
        
        Args:
            template_name: Nazwa szablonu
            **kwargs: Parametry do formatowania
            
        Returns:
            Słownik z system i user promptami
        """
        if template_name not in PROMPT_TEMPLATES:
            return {
                "system": "Jesteś pomocnym asystentem.",
                "user": kwargs.get('query', 'Zapytanie')
            }
        
        template = PROMPT_TEMPLATES[template_name]
        try:
            return {
                "system": template["system"],
                "user": template["user"].format(**kwargs)
            }
        except KeyError:
            return template
    
    def clear_cache(self) -> None:
        """Czyści cache promptów."""
        with self._lock:
            self._cache.clear()
            self._cache_timestamps.clear()
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Zwraca statystyki cache promptów."""
        with self._lock:
            return {
                "cache_size": len(self._cache),
                "cache_hits": self._cache_hits,
                "cache_misses": self._cache_misses,
                "hit_rate": self._cache_hits / (self._cache_hits + self._cache_misses) if (self._cache_hits + self._cache_misses) > 0 else 0,
                "cached_prompts": list(self._cache.keys())
            }
    
    def cleanup_expired_cache(self) -> int:
        """
        Czyści wygasłe wpisy z cache.
        
        Returns:
            Liczba usuniętych wpisów
        """
        now = datetime.now()
        expired_keys = []
        
        with self._lock:
            for key, timestamp in self._cache_timestamps.items():
                if now - timestamp > timedelta(seconds=self._ttl):
                    expired_keys.append(key)
            
            for key in expired_keys:
                del self._cache[key]
                del self._cache_timestamps[key]
        
        return len(expired_keys)

# Cache dla często używanych promptów (legacy)
_prompt_cache: Dict[str, str] = {}

def get_optimized_prompt(prompt_type: str, **kwargs: Any) -> str:
    """
    Zwraca zoptymalizowany prompt z cache'owaniem.
    
    Args:
        prompt_type: Typ promptu (intent_detection, simple_response, etc.)
        **kwargs: Parametry do formatowania promptu
        
    Returns:
        Zoptymalizowany prompt
    """
    if prompt_type not in OPTIMIZED_PROMPTS:
        return f"Odpowiedz na: {kwargs.get('query', 'zapytanie')}"
    
    # Sprawdź cache
    cache_key = f"{prompt_type}:{hash(str(kwargs))}"
    if cache_key in _prompt_cache:
        return _prompt_cache[cache_key]
    
    # Formatuj prompt
    try:
        prompt = OPTIMIZED_PROMPTS[prompt_type].format(**kwargs)
        _prompt_cache[cache_key] = prompt
        return prompt
    except KeyError as e:
        # Fallback dla brakujących parametrów
        return OPTIMIZED_PROMPTS[prompt_type].format(
            query=kwargs.get('query', 'zapytanie'),
            **{k: '...' for k in kwargs.keys()}
        )

def get_prompt_template(template_name: str, **kwargs: Any) -> Dict[str, str]:
    """
    Zwraca szablon promptu z parametrami.
    
    Args:
        template_name: Nazwa szablonu
        **kwargs: Parametry do formatowania
        
    Returns:
        Słownik z system i user promptami
    """
    if template_name not in PROMPT_TEMPLATES:
        return {
            "system": "Jesteś pomocnym asystentem.",
            "user": kwargs.get('query', 'Zapytanie')
        }
    
    template = PROMPT_TEMPLATES[template_name]
    try:
        return {
            "system": template["system"],
            "user": template["user"].format(**kwargs)
        }
    except KeyError:
        return template

def clear_prompt_cache() -> None:
    """Czyści cache promptów."""
    _prompt_cache.clear()

def get_cache_stats() -> Dict[str, Any]:
    """Zwraca statystyki cache promptów."""
    return {
        "cache_size": len(_prompt_cache),
        "cached_prompts": list(_prompt_cache.keys())
    } 