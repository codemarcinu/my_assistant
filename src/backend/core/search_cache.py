"""
Cache'owanie wyników wyszukiwania dla optymalizacji wydajności
"""

import hashlib
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

class SearchCache:
    """
    Cache dla wyników wyszukiwania z TTL i automatycznym czyszczeniem.
    """
    
    def __init__(self, max_size: int = 1000, default_ttl: int = 3600) -> None:
        """
        Inicjalizuje cache wyszukiwania.
        
        Args:
            max_size: Maksymalna liczba wpisów w cache
            default_ttl: Domyślny czas życia wpisu w sekundach (1 godzina)
        """
        self._cache: Dict[str, Dict[str, Any]] = {}
        self.max_size = max_size
        self.default_ttl = default_ttl
        self._access_times: Dict[str, datetime] = {}
    
    def _generate_cache_key(self, query: str, provider: str) -> str:
        """
        Generuje klucz cache na podstawie zapytania i providera.
        """
        cache_string = f"{query.lower().strip()}:{provider}"
        return hashlib.md5(cache_string.encode('utf-8')).hexdigest()
    
    def get(self, query: str, provider: str) -> Optional[List[Dict[str, Any]]]:
        """
        Pobiera wyniki z cache.
        
        Args:
            query: Zapytanie wyszukiwania
            provider: Nazwa providera (wikipedia/duck)
            
        Returns:
            Wyniki wyszukiwania lub None jeśli nie ma w cache
        """
        cache_key = self._generate_cache_key(query, provider)
        
        if cache_key not in self._cache:
            return None
        
        cache_entry = self._cache[cache_key]
        
        # Sprawdź czy wpis nie wygasł
        if datetime.now() > cache_entry['expires_at']:
            logger.debug(f"Cache entry expired for query: {query}")
            self._remove_entry(cache_key)
            return None
        
        # Aktualizuj czas ostatniego dostępu
        self._access_times[cache_key] = datetime.now()
        
        logger.debug(f"Cache hit for query: {query}")
        return cache_entry['results']
    
    def set(self, query: str, provider: str, results: List[Dict[str, Any]], ttl: Optional[int] = None) -> None:
        """
        Zapisuje wyniki w cache.
        
        Args:
            query: Zapytanie wyszukiwania
            provider: Nazwa providera
            results: Wyniki wyszukiwania
            ttl: Czas życia w sekundach (opcjonalny)
        """
        cache_key = self._generate_cache_key(query, provider)
        ttl_seconds = ttl or self.default_ttl
        
        # Sprawdź czy cache nie jest pełny
        if len(self._cache) >= self.max_size:
            self._evict_oldest()
        
        # Zapisz wpis
        self._cache[cache_key] = {
            'query': query,
            'provider': provider,
            'results': results,
            'created_at': datetime.now(),
            'expires_at': datetime.now() + timedelta(seconds=ttl_seconds),
            'access_count': 0
        }
        self._access_times[cache_key] = datetime.now()
        
        logger.debug(f"Cached results for query: {query}, provider: {provider}")
    
    def _remove_entry(self, cache_key: str) -> None:
        """Usuwa wpis z cache."""
        if cache_key in self._cache:
            del self._cache[cache_key]
        if cache_key in self._access_times:
            del self._access_times[cache_key]
    
    def _evict_oldest(self) -> None:
        """Usuwa najstarszy wpis z cache (LRU)."""
        if not self._access_times:
            return
        
        oldest_key = min(self._access_times.keys(), key=lambda k: self._access_times[k])
        logger.debug(f"Evicting oldest cache entry: {oldest_key}")
        self._remove_entry(oldest_key)
    
    def clear_expired(self) -> int:
        """
        Czyści wygasłe wpisy z cache.
        
        Returns:
            Liczba usuniętych wpisów
        """
        now = datetime.now()
        expired_keys = [
            key for key, entry in self._cache.items()
            if now > entry['expires_at']
        ]
        
        for key in expired_keys:
            self._remove_entry(key)
        
        if expired_keys:
            logger.info(f"Cleared {len(expired_keys)} expired cache entries")
        
        return len(expired_keys)
    
    def clear_all(self) -> None:
        """Czyści cały cache."""
        self._cache.clear()
        self._access_times.clear()
        logger.info("Cleared all cache entries")
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Zwraca statystyki cache.
        
        Returns:
            Słownik ze statystykami
        """
        now = datetime.now()
        active_entries = sum(1 for entry in self._cache.values() if now <= entry['expires_at'])
        
        return {
            'total_entries': len(self._cache),
            'active_entries': active_entries,
            'max_size': self.max_size,
            'cache_hit_ratio': self._calculate_hit_ratio(),
            'oldest_entry': min(self._access_times.values()) if self._access_times else None,
            'newest_entry': max(self._access_times.values()) if self._access_times else None
        }
    
    def _calculate_hit_ratio(self) -> float:
        """Oblicza stosunek trafień w cache."""
        # To jest uproszczona implementacja - w rzeczywistości należałoby śledzić hit/miss
        return 0.0  # Placeholder

# Globalna instancja cache
search_cache = SearchCache(max_size=1000, default_ttl=3600) 