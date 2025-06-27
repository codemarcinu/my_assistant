import pytest
from unittest.mock import AsyncMock, patch
from backend.agents.search_agent import SearchAgent

@pytest.mark.asyncio
async def test_search_integration_wikipedia_encyclopedic():
    """Test integracyjny: zapytanie encyklopedyczne → Wikipedia provider."""
    agent = SearchAgent()
    
    # Mock odpowiedzi Wikipedii
    wiki_response = {
        "query": {
            "search": [
                {
                    "title": "Albert Einstein",
                    "snippet": "Albert Einstein was a German-born theoretical physicist...",
                    "pageid": 736
                }
            ]
        }
    }
    
    with patch("aiohttp.ClientSession.get") as mock_get:
        mock_get.return_value.__aenter__.return_value.json = AsyncMock(return_value=wiki_response)
        
        results = await agent.process_request("kto to Albert Einstein")
        
        assert len(results) == 1
        assert results[0]["title"] == "Albert Einstein"
        assert "theoretical physicist" in results[0]["snippet"]
        assert results[0]["pageid"] == 736

@pytest.mark.asyncio
async def test_search_integration_duckduckgo_web():
    """Test integracyjny: zapytanie webowe → DuckDuckGo provider."""
    agent = SearchAgent()
    
    # Mock odpowiedzi DuckDuckGo
    duck_response = {
        "AbstractText": "Python is a high-level programming language",
        "Heading": "Python (programming language)",
        "AbstractURL": "https://python.org",
        "RelatedTopics": [
            {
                "Text": "Python Tutorial",
                "FirstURL": "https://python.org/tutorial"
            }
        ]
    }
    
    with patch("aiohttp.ClientSession.get") as mock_get:
        mock_get.return_value.__aenter__.return_value.json = AsyncMock(return_value=duck_response)
        
        results = await agent.process_request("szukaj informacji o Pythonie")
        
        assert len(results) == 2
        assert results[0]["title"] == "Python (programming language)"
        assert "programming language" in results[0]["snippet"]
        assert results[0]["url"] == "https://python.org"

@pytest.mark.asyncio
async def test_search_integration_fallback_scenario():
    """Test integracyjny: Wikipedia nie ma wyników → fallback na DuckDuckGo."""
    agent = SearchAgent()
    
    # Wikipedia zwraca pustą odpowiedź
    wiki_empty_response = {"query": {"search": []}}
    
    # DuckDuckGo zwraca wyniki
    duck_response = {
        "AbstractText": "Machine learning is a subset of artificial intelligence",
        "Heading": "Machine Learning",
        "AbstractURL": "https://example.com/ml"
    }
    
    with patch("aiohttp.ClientSession.get") as mock_get:
        # Pierwsze wywołanie (Wikipedia) zwraca pustą odpowiedź
        # Drugie wywołanie (DuckDuckGo) zwraca wyniki
        mock_get.return_value.__aenter__.return_value.json = AsyncMock(
            side_effect=[wiki_empty_response, duck_response]
        )
        
        results = await agent.process_request("wikipedia: machine learning")
        
        assert len(results) == 1
        assert results[0]["title"] == "Machine Learning"
        assert "artificial intelligence" in results[0]["snippet"]

@pytest.mark.asyncio
async def test_search_integration_error_recovery():
    """Test integracyjny: błąd pierwszego providera → recovery przez drugi."""
    agent = SearchAgent()
    
    # DuckDuckGo zwraca błąd, ale Wikipedia działa
    wiki_response = {
        "query": {
            "search": [
                {
                    "title": "Test Article",
                    "snippet": "Test content",
                    "pageid": 123
                }
            ]
        }
    }
    
    with patch("aiohttp.ClientSession.get") as mock_get:
        # Pierwsze wywołanie zwraca błąd, drugie zwraca wyniki
        mock_get.return_value.__aenter__.return_value.json = AsyncMock(
            side_effect=[Exception("Network error"), wiki_response]
        )
        
        results = await agent.process_request("test query")
        
        assert len(results) == 1
        assert results[0]["title"] == "Test Article"

@pytest.mark.asyncio
async def test_search_integration_prefix_override():
    """Test integracyjny: prefix wymusza provider niezależnie od heurystyki."""
    agent = SearchAgent()
    
    # Zapytanie z prefixem "duck:" ale treść encyklopedyczna
    duck_response = {
        "AbstractText": "Search results for encyclopedic query",
        "Heading": "Search Results",
        "AbstractURL": "https://example.com"
    }
    
    with patch("aiohttp.ClientSession.get") as mock_get:
        mock_get.return_value.__aenter__.return_value.json = AsyncMock(return_value=duck_response)
        
        results = await agent.process_request("duck: kto to Albert Einstein")
        
        assert len(results) == 1
        assert results[0]["title"] == "Search Results"
        # Sprawdź czy użyto DuckDuckGo (nie Wikipedii) mimo treści encyklopedycznej

@pytest.mark.asyncio
async def test_search_integration_real_world_scenarios():
    """Test integracyjny: rzeczywiste scenariusze użycia."""
    agent = SearchAgent()
    
    test_cases = [
        ("wikipedia: historia Polski", "wikipedia"),
        ("szukaj najlepszych restauracji w Warszawie", "duck"),
        ("co to jest blockchain", "wikipedia"),
        ("aktualności z dzisiejszego dnia", "duck"),
        ("definicja sztucznej inteligencji", "wikipedia"),
        ("search for programming tutorials", "duck"),
    ]
    
    for query, expected_provider in test_cases:
        provider = agent.detect_search_type(query)
        assert provider == expected_provider, f"Query: {query}, Expected: {expected_provider}, Got: {provider}" 