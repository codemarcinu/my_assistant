import logging
from typing import Any, AsyncGenerator, Dict, List

import httpx

from backend.agents.base_agent import BaseAgent
from backend.agents.interfaces import AgentResponse, MemoryContext
from backend.agents.response_generator import ResponseGenerator
from backend.settings import settings
from backend.core.decorators import handle_exceptions
from backend.core.hybrid_llm_client import hybrid_llm_client
from backend.core.llm_client import LLMClient
from backend.core.vector_store import VectorStore
from backend.integrations.web_search import web_search
from backend.agents.tools.search_providers import WikipediaSearchProvider, DuckDuckGoSearchProvider
from backend.core.search_cache import search_cache

logger = logging.getLogger(__name__)


class SearchAgentInput:
    """Input model for SearchAgent"""

    def __init__(
        self, query: str, model: str | None = None, max_results: int = 5
    ) -> None:
        self.query = query
        self.model = (
            model or "SpeakLeash/bielik-4.5b-v3.0-instruct:Q8_0"
        )  # Użyj domyślnego modelu
        self.max_results = max_results


class SearchAgent(BaseAgent):
    """
    Agent do wyszukiwania informacji z różnych źródeł (Wikipedia, DuckDuckGo).
    Wybór providera na podstawie heurystyki, prefixu lub fallbacku.
    Zintegrowany z ResponseGenerator dla spójnych odpowiedzi.
    Zoptymalizowany z cache'owaniem wyników wyszukiwania.
    """

    def __init__(self, config: Dict[str, Any] = None) -> None:
        super().__init__(config=config)
        self.search_providers = {
            "wikipedia": WikipediaSearchProvider(),
            "duck": DuckDuckGoSearchProvider(),
        }
        self.default_provider = "duck"
        self.response_generator = ResponseGenerator()
        self.cache_enabled = config.get("cache_enabled", True) if config else True

    def detect_search_type(self, query: str) -> str:
        """
        Wybiera providera na podstawie prefixu lub heurystyki.
        """
        q = query.lower().strip()
        if q.startswith("wikipedia:"):
            return "wikipedia"
        if q.startswith("duck:") or q.startswith("duckduckgo:"):
            return "duck"
        # Heurystyka encyklopedyczna
        wiki_keywords = ["wikipedia", "kto to", "co to", "definicja", "biografia", "historia", "encyklopedia"]
        if any(kw in q for kw in wiki_keywords):
            return "wikipedia"
        # Heurystyka webowa
        duck_keywords = ["szukaj", "search", "find", "najlepsze strony", "aktualności", "news"]
        if any(kw in q for kw in duck_keywords):
            return "duck"
        return self.default_provider

    def format_search_results(self, results: List[Dict[str, Any]], provider: str) -> str:
        """
        Formatuje wyniki wyszukiwania w czytelny tekst.
        """
        if not results:
            return "Nie znaleziono wyników wyszukiwania."
        
        formatted_results = []
        for i, result in enumerate(results[:5], 1):  # Maksymalnie 5 wyników
            title = result.get("title", "Brak tytułu")
            snippet = result.get("snippet", "Brak opisu")
            
            if provider == "wikipedia":
                pageid = result.get("pageid", "")
                formatted_results.append(f"{i}. **{title}** (ID: {pageid})\n   {snippet}")
            else:  # duck
                url = result.get("url", "")
                formatted_results.append(f"{i}. **{title}**\n   {snippet}\n   URL: {url}")
        
        return "\n\n".join(formatted_results)

    async def process(self, input_data: Dict[str, Any]) -> AgentResponse:
        """
        Główna metoda przetwarzania zgodna z interfejsem BaseAgent.
        """
        query = input_data.get("query", "")
        context = input_data.get("context")
        
        if not query:
            return AgentResponse(
                success=False,
                error="Brak zapytania wyszukiwania",
                text="Proszę podać zapytanie do wyszukiwania."
            )
        
        try:
            results = await self.process_request(query, context)
            formatted_text = self.format_search_results(results, self.detect_search_type(query))
            
            response = AgentResponse(
                success=True,
                text=formatted_text,
                data={"search_results": results, "provider_used": self.detect_search_type(query)},
                metadata={
                    "agent_type": "search",
                    "results_count": len(results),
                    "query": query,
                    "cache_used": self.cache_enabled
                }
            )
            
            # Użyj ResponseGenerator do finalnego formatowania
            if context:
                return await self.response_generator.generate_response(context, response)
            return response
            
        except Exception as e:
            logger.error(f"SearchAgent error: {e}")
            error_response = AgentResponse(
                success=False,
                error=f"Błąd wyszukiwania: {str(e)}",
                text=f"Przepraszam, wystąpił błąd podczas wyszukiwania: {str(e)}"
            )
            
            if context:
                return await self.response_generator.generate_response(context, error_response)
            return error_response

    async def process_request(self, query: str, context: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Przetwarza zapytanie, wybiera providera, obsługuje fallback i cache.
        Zwraca listę wyników (tytuł, snippet, url/pageid).
        """
        provider_key = self.detect_search_type(query)
        
        # Sprawdź cache jeśli włączony
        if self.cache_enabled:
            cached_results = search_cache.get(query, provider_key)
            if cached_results:
                logger.info(f"Cache hit for query: {query}, provider: {provider_key}")
                return cached_results
        
        provider = self.search_providers[provider_key]
        try:
            results = await provider.search(query)
            if results:
                # Zapisz w cache jeśli włączony
                if self.cache_enabled:
                    search_cache.set(query, provider_key, results)
                return results
            
            # Fallback na drugi provider jeśli brak wyników
            fallback_key = "duck" if provider_key == "wikipedia" else "wikipedia"
            fallback_provider = self.search_providers[fallback_key]
            
            # Sprawdź cache dla fallback providera
            if self.cache_enabled:
                cached_fallback = search_cache.get(query, fallback_key)
                if cached_fallback:
                    logger.info(f"Cache hit for fallback query: {query}, provider: {fallback_key}")
                    return cached_fallback
            
            fallback_results = await fallback_provider.search(query)
            
            # Zapisz fallback wyniki w cache
            if self.cache_enabled and fallback_results:
                search_cache.set(query, fallback_key, fallback_results)
            
            return fallback_results
            
        except Exception as e:
            logger.error(f"SearchAgent error with {provider_key}: {e}")
            # Fallback na drugi provider w razie błędu
            fallback_key = "duck" if provider_key == "wikipedia" else "wikipedia"
            try:
                fallback_provider = self.search_providers[fallback_key]
                
                # Sprawdź cache dla fallback providera
                if self.cache_enabled:
                    cached_fallback = search_cache.get(query, fallback_key)
                    if cached_fallback:
                        return cached_fallback
                
                fallback_results = await fallback_provider.search(query)
                
                # Zapisz fallback wyniki w cache
                if self.cache_enabled and fallback_results:
                    search_cache.set(query, fallback_key, fallback_results)
                
                return fallback_results
            except Exception as e2:
                logger.error(f"SearchAgent fallback error: {e2}")
                return []

    @handle_exceptions(max_retries=2)
    async def process_with_verification(self, input_data: Dict[str, Any]) -> AgentResponse:
        """Main processing method - performs search and returns results in a stream"""
        query = input_data.get("query", "")
        if not query:
            return AgentResponse(
                success=False,
                error="Query is required",
                text="Przepraszam, ale potrzebuję zapytania do wyszukania.",
            )

        max_results = input_data.get("max_results", 5)
        use_perplexity = input_data.get("use_perplexity", True)  # Domyślnie Perplexity
        verify_knowledge = input_data.get("verify_knowledge", True)  # Domyślnie włączona weryfikacja

        async def stream_generator() -> AsyncGenerator[str, None]:
            try:
                yield "Rozpoczynam wyszukiwanie z weryfikacją wiedzy...\n"

                if use_perplexity:
                    logger.info(f"Using Perplexity for search query: {query}")
                    yield "Korzystam z Perplexity...\n"
                    search_result = await self.web_search.search(
                        query, model=None, max_results=max_results
                    )
                    if search_result["success"]:
                        yield search_result["content"]
                    else:
                        yield f"Błąd podczas wyszukiwania w Perplexity: {search_result['error']}"
                else:
                    # Użyj ulepszonego systemu wyszukiwania z weryfikacją wiedzy
                    logger.info(f"Using enhanced web search for query: {query}")
                    yield "Korzystam z ulepszonego systemu wyszukiwania...\n"
                    
                    if verify_knowledge:
                        yield "🔍 Weryfikuję wiarygodność źródeł...\n"
                        enhanced_result = await self._enhanced_search_with_verification(query, max_results)
                        yield enhanced_result
                    else:
                        basic_result = await self._basic_search(query, max_results)
                        yield basic_result

            except Exception as e:
                logger.error(f"[SearchAgent] Error during stream generation: {e}")
                yield f"Wystąpił wewnętrzny błąd: {e}"

        return AgentResponse(
            success=True,
            text_stream=stream_generator(),
            message="Search stream started.",
        )

    async def _enhanced_search_with_verification(self, query: str, max_results: int) -> str:
        """Perform enhanced search with knowledge verification"""
        try:
            # Użyj nowego systemu wyszukiwania z weryfikacją
            search_response = await web_search.search_with_verification(query, max_results)
            
            if not search_response["results"]:
                return "Nie znaleziono odpowiednich wyników wyszukiwania."

            # Analizuj wyniki wyszukiwania
            verified_results = [r for r in search_response["results"] if r["knowledge_verified"]]
            total_results = len(search_response["results"])
            verification_score = search_response["knowledge_verification_score"]

            # Przygotuj odpowiedź
            response_parts = []
            response_parts.append(f"📊 **Wyniki wyszukiwania dla: '{query}'**\n")
            response_parts.append(f"🔍 Znaleziono {total_results} wyników")
            response_parts.append(f"✅ Zweryfikowane źródła: {len(verified_results)}/{total_results}")
            response_parts.append(f"📈 Wskaźnik wiarygodności: {verification_score:.2f}\n")

            # Dodaj najlepsze wyniki
            response_parts.append("**Najlepsze wyniki:**\n")
            for i, result in enumerate(search_response["results"][:3], 1):
                verification_icon = "✅" if result["knowledge_verified"] else "⚠️"
                confidence_icon = "🟢" if result["confidence"] > 0.7 else "🟡" if result["confidence"] > 0.4 else "🔴"
                
                response_parts.append(f"{i}. {verification_icon} {confidence_icon} **{result['title']}**")
                response_parts.append(f"   📝 {result['snippet'][:150]}...")
                response_parts.append(f"   🔗 {result['url']}")
                response_parts.append(f"   📊 Wiarygodność: {result['confidence']:.2f}")
                response_parts.append("")

            # Dodaj rekomendację na podstawie weryfikacji
            if verification_score > self.knowledge_verification_threshold:
                response_parts.append("✅ **Wysoka wiarygodność źródeł** - wyniki są godne zaufania.")
            elif verification_score > 0.4:
                response_parts.append("⚠️ **Średnia wiarygodność źródeł** - zalecana dodatkowa weryfikacja.")
            else:
                response_parts.append("🔴 **Niska wiarygodność źródeł** - zalecana ostrożność przy interpretacji.")

            return "\n".join(response_parts)

        except Exception as e:
            logger.error(f"Error in enhanced search: {e}")
            return f"Błąd podczas wyszukiwania: {e}"

    async def _basic_search(self, query: str, max_results: int) -> str:
        """Perform basic search without verification"""
        try:
            results = await web_search.search(query, max_results)
            
            if not results:
                return "Nie znaleziono odpowiednich wyników wyszukiwania."

            response_parts = []
            response_parts.append(f"📊 **Wyniki wyszukiwania dla: '{query}'**\n")
            
            for i, result in enumerate(results[:3], 1):
                response_parts.append(f"{i}. **{result['title']}**")
                response_parts.append(f"   📝 {result['snippet'][:150]}...")
                response_parts.append(f"   🔗 {result['url']}")
                response_parts.append("")

            return "\n".join(response_parts)

        except Exception as e:
            logger.error(f"Error in basic search: {e}")
            return f"Błąd podczas wyszukiwania: {e}"

    async def _perform_search(
        self, query: str, model: str, max_results: int
    ) -> Dict[str, Any]:
        """Perform search using Perplexity API"""
        try:
            # Translate query to English for better results
            english_query = await self._translate_to_english(query, model)

            # Perform search with Perplexity
            result = await self.web_search.search(
                query=english_query,
                model=None,  # Użyj domyślnego modelu
                max_results=max_results,
            )

            if result["success"]:
                # Translate response back to Polish if needed
                polish_response = await self._translate_to_polish(
                    result["content"], model
                )
                result["content"] = polish_response

            return result

        except Exception as e:
            logger.error(f"Error in Perplexity search: {e}")
            return {"success": False, "error": str(e), "content": ""}

    async def _duckduckgo_search(self, query: str) -> Dict[str, Any]:
        """Fallback search using DuckDuckGo"""
        try:
            # Simple DuckDuckGo search implementation
            search_url = f"https://api.duckduckgo.com/?q={query}&format=json&no_html=1&skip_disambig=1"

            response = await self.http_client.get(search_url)
            response.raise_for_status()

            data = response.json()

            # Extract relevant information
            abstract = data.get("Abstract", "")
            answer = data.get("Answer", "")
            related_topics = data.get("RelatedTopics", [])

            # Combine results
            content_parts = []
            if answer:
                content_parts.append(f"Odpowiedź: {answer}")
            if abstract:
                content_parts.append(f"Opis: {abstract}")
            if related_topics:
                topics = [topic.get("Text", "") for topic in related_topics[:3]]
                content_parts.append(f"Powiązane tematy: {'; '.join(topics)}")

            content = (
                "\n\n".join(content_parts)
                if content_parts
                else "Nie znaleziono odpowiednich wyników."
            )

            return {
                "success": True,
                "content": content,
                "source": "duckduckgo",
                "query": query,
            }

        except Exception as e:
            logger.error(f"Error in DuckDuckGo search: {e}")
            return {"success": False, "error": str(e), "content": ""}

    async def _translate_to_english(self, polish_query: str, model: str) -> str:
        """Translate Polish query to English for better search results"""
        prompt = (
            f"Przetłumacz poniższe zapytanie z języka polskiego na angielski:\n\n"
            f"Zapytanie: '{polish_query}'\n\n"
            f"Zwróć tylko tłumaczenie, bez dodatkowego tekstu."
        )

        try:
            response = await hybrid_llm_client.chat(
                model=model,
                messages=[
                    {
                        "role": "system",
                        "content": "Jesteś pomocnym asystentem, który tłumaczy zapytania z polskiego na angielski.",
                    },
                    {"role": "user", "content": prompt},
                ],
                stream=False,
            )

            if not response or not isinstance(response, dict):
                return polish_query

            content = response.get("message", {}).get("content", "")
            if not content:
                return polish_query

            # Clean up the response
            content = content.strip()
            if content.startswith('"') and content.endswith('"'):
                content = content[1:-1]

            return content if content else polish_query

        except Exception as e:
            logger.error(f"Translation error: {e}")
            return polish_query

    async def _translate_to_polish(self, english_content: str, model: str) -> str:
        """Translate English content back to Polish"""
        prompt = (
            f"Przetłumacz poniższą treść z języka angielskiego na polski:\n\n"
            f"Treść: '{english_content}'\n\n"
            f"Zwróć tylko tłumaczenie, bez dodatkowego tekstu."
        )

        try:
            response = await hybrid_llm_client.chat(
                model=model,
                messages=[
                    {
                        "role": "system",
                        "content": "Jesteś pomocnym asystentem, który tłumaczy treść z angielskiego na polski.",
                    },
                    {"role": "user", "content": prompt},
                ],
                stream=False,
            )

            if not response or not isinstance(response, dict):
                return english_content

            content = response.get("message", {}).get("content", "")
            return content.strip() if content else english_content

        except Exception as e:
            logger.error(f"Translation error: {e}")
            return english_content

    @handle_exceptions(max_retries=1)
    def get_dependencies(self) -> List[type]:
        """Return list of dependencies this agent requires"""
        return ["httpx", "hybrid_llm_client", "perplexity_client", "web_search", ResponseGenerator]

    def get_metadata(self) -> Dict[str, Any]:
        """Zwraca metadane agenta."""
        return {
            "agent_type": "search",
            "capabilities": ["web_search", "wikipedia_search", "fallback_support", "caching"],
            "providers": list(self.search_providers.keys()),
            "version": "1.0.0",
            "cache_enabled": self.cache_enabled,
            "cache_stats": search_cache.get_stats() if self.cache_enabled else None
        }

    def is_healthy(self) -> bool:
        """Check if the agent is healthy and ready to process requests"""
        return True  # Simple health check - could be enhanced

    async def verify_knowledge_claim(self, claim: str, context: str = "") -> Dict[str, Any]:
        """Verify a specific knowledge claim against external sources"""
        try:
            # Search for the claim
            search_query = f"{claim} {context}".strip()
            search_response = await web_search.search_with_verification(search_query, max_results=3)
            
            # Analyze results for claim verification
            verified_sources = [r for r in search_response["results"] if r["knowledge_verified"]]
            high_confidence_sources = [r for r in search_response["results"] if r["confidence"] > 0.7]
            
            verification_result = {
                "claim": claim,
                "verified": len(verified_sources) > 0,
                "confidence_score": search_response["knowledge_verification_score"],
                "high_confidence_sources": len(high_confidence_sources),
                "total_sources": len(search_response["results"]),
                "supporting_evidence": [r["snippet"] for r in verified_sources[:2]],
                "sources": [r["url"] for r in verified_sources[:2]]
            }
            
            return verification_result
            
        except Exception as e:
            logger.error(f"Error verifying knowledge claim: {e}")
            return {
                "claim": claim,
                "verified": False,
                "error": str(e),
                "confidence_score": 0.0
            }
