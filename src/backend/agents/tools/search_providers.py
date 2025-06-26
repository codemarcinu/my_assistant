import aiohttp
from typing import List, Dict, Any

class WikipediaSearchProvider:
    """Provider do wyszukiwania i pobierania treści z Wikipedii."""
    API_URL = "https://pl.wikipedia.org/w/api.php"

    async def search(self, query: str) -> List[Dict[str, Any]]:
        params = {
            "action": "query",
            "list": "search",
            "srsearch": query,
            "format": "json",
        }
        async with aiohttp.ClientSession() as session:
            async with session.get(self.API_URL, params=params) as resp:
                data = await resp.json()
                results = data.get("query", {}).get("search", [])
                return [
                    {
                        "title": r["title"],
                        "snippet": r["snippet"],
                        "pageid": r["pageid"]
                    }
                    for r in results
                ]

class DuckDuckGoSearchProvider:
    """Provider do wyszukiwania webowego przez DuckDuckGo."""
    API_URL = "https://api.duckduckgo.com/"

    async def search(self, query: str) -> List[Dict[str, Any]]:
        params = {
            "q": query,
            "format": "json",
            "no_redirect": 1,
            "no_html": 1,
        }
        async with aiohttp.ClientSession() as session:
            async with session.get(self.API_URL, params=params) as resp:
                data = await resp.json()
                results = []
                # DuckDuckGo zwraca główną odpowiedź i related topics
                if data.get("AbstractText"):
                    results.append({
                        "title": data.get("Heading"),
                        "snippet": data.get("AbstractText"),
                        "url": data.get("AbstractURL")
                    })
                for topic in data.get("RelatedTopics", []):
                    if "Text" in topic and "FirstURL" in topic:
                        results.append({
                            "title": topic.get("Text"),
                            "snippet": topic.get("Text"),
                            "url": topic.get("FirstURL")
                        })
                return results 