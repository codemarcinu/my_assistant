"""
Search providers for different search engines.
Provides unified interface for Wikipedia and DuckDuckGo searches.
"""

import logging
from typing import Any, Dict, List, Optional
import httpx
from abc import ABC, abstractmethod

from backend.config import settings

logger = logging.getLogger(__name__)

# Constants
WIKIPEDIA_API_BASE = "https://pl.wikipedia.org/api/rest_v1"
WIKIPEDIA_SEARCH_BASE = "https://pl.wikipedia.org/w/api.php"
DUCKDUCKGO_API_BASE = "https://api.duckduckgo.com/"
REQUEST_TIMEOUT = 10.0


class SearchProvider(ABC):
    """Abstract base class for search providers"""
    
    @abstractmethod
    async def search(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """Search for results"""
        pass


class WikipediaSearchProvider(SearchProvider):
    """Provider for Wikipedia searches"""
    
    def __init__(self):
        self.client = httpx.AsyncClient(
            timeout=REQUEST_TIMEOUT,
            headers={"User-Agent": settings.USER_AGENT}
        )
    
    async def search(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """Search Wikipedia for articles"""
        try:
            search_url = f"{WIKIPEDIA_SEARCH_BASE}"
            params = {
                "action": "query",
                "format": "json",
                "list": "search",
                "srsearch": query,
                "srlimit": max_results,
                "srnamespace": 0,  # Main namespace only
                "srprop": "snippet|title|timestamp"
            }

            response = await self.client.get(search_url, params=params)
            response.raise_for_status()
            data = response.json()

            results = []
            if "query" in data and "search" in data["query"]:
                for item in data["query"]["search"]:
                    result = {
                        "title": item["title"],
                        "url": f"https://pl.wikipedia.org/wiki/{item['title'].replace(' ', '_')}",
                        "snippet": item.get("snippet", ""),
                        "pageid": item.get("pageid", ""),
                        "source": "wikipedia"
                    }
                    results.append(result)

            return results

        except Exception as e:
            logger.error(f"Wikipedia search error: {e}")
            return []
    
    async def close(self):
        """Close the client"""
        await self.client.aclose()


class DuckDuckGoSearchProvider(SearchProvider):
    """Provider for DuckDuckGo searches"""
    
    def __init__(self):
        self.client = httpx.AsyncClient(
            timeout=REQUEST_TIMEOUT,
            headers={"User-Agent": settings.USER_AGENT}
        )
    
    async def search(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """Search DuckDuckGo for results"""
        try:
            # DuckDuckGo Instant Answer API
            search_url = f"{DUCKDUCKGO_API_BASE}"
            params = {
                "q": query,
                "format": "json",
                "no_html": "1",
                "skip_disambig": "1"
            }

            response = await self.client.get(search_url, params=params)
            response.raise_for_status()
            data = response.json()

            results = []
            
            # Add instant answer if available
            if data.get("Abstract"):
                results.append({
                    "title": data.get("Heading", "DuckDuckGo Result"),
                    "url": data.get("AbstractURL", ""),
                    "snippet": data.get("Abstract", ""),
                    "source": "duckduckgo"
                })
            
            # Add related topics
            if data.get("RelatedTopics"):
                for topic in data["RelatedTopics"][:max_results - len(results)]:
                    if isinstance(topic, dict) and topic.get("Text"):
                        results.append({
                            "title": topic.get("Text", "").split(" - ")[0] if " - " in topic.get("Text", "") else topic.get("Text", ""),
                            "url": topic.get("FirstURL", ""),
                            "snippet": topic.get("Text", ""),
                            "source": "duckduckgo"
                        })

            return results[:max_results]

        except Exception as e:
            logger.error(f"DuckDuckGo search error: {e}")
            return []
    
    async def close(self):
        """Close the client"""
        await self.client.aclose() 