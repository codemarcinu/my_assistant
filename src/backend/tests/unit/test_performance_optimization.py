"""
Testy jednostkowe dla optymalizacji wydajności
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timedelta

from backend.core.search_cache import SearchCache
from backend.core.optimized_prompts import get_optimized_prompt, get_prompt_template, clear_prompt_cache, get_cache_stats
from backend.core.database_optimizer import DatabaseOptimizer
from backend.models.conversation import Conversation, Message
from backend.models.rag_document import RAGDocument
from backend.models.user_profile import UserProfile


class TestSearchCache:
    """Testy dla SearchCache"""
    
    @pytest.fixture
    def cache(self):
        """Fixture dla SearchCache"""
        return SearchCache(max_size=10, default_ttl=60)
    
    def test_cache_set_and_get(self, cache):
        """Test podstawowego set/get"""
        query = "test query"
        provider = "wikipedia"
        results = [{"title": "Test", "snippet": "Test snippet"}]
        
        # Set cache
        cache.set(query, provider, results)
        
        # Get from cache
        cached_results = cache.get(query, provider)
        
        assert cached_results == results
        assert len(cache._cache) == 1
    
    def test_cache_expiration(self, cache):
        """Test wygasania cache"""
        query = "test query"
        provider = "wikipedia"
        results = [{"title": "Test", "snippet": "Test snippet"}]
        
        # Set cache with short TTL
        cache.set(query, provider, results, ttl=1)
        
        # Should be in cache
        assert cache.get(query, provider) == results
        
        # Wait for expiration
        import time
        time.sleep(2)
        
        # Should be expired
        assert cache.get(query, provider) is None
        assert len(cache._cache) == 0
    
    def test_cache_max_size(self, cache):
        """Test maksymalnego rozmiaru cache"""
        # Fill cache to max size
        for i in range(11):
            cache.set(f"query_{i}", "wikipedia", [{"title": f"Test {i}"}])
        
        # Should have max_size entries
        assert len(cache._cache) == 10
        
        # Oldest should be evicted
        assert cache.get("query_0", "wikipedia") is None
    
    def test_cache_clear_expired(self, cache):
        """Test czyszczenia wygasłych wpisów"""
        # Add some entries
        cache.set("query1", "wikipedia", [{"title": "Test1"}], ttl=1)
        cache.set("query2", "wikipedia", [{"title": "Test2"}], ttl=3600)
        
        # Wait for first to expire
        import time
        time.sleep(2)
        
        # Clear expired
        expired_count = cache.clear_expired()
        
        assert expired_count == 1
        assert len(cache._cache) == 1
        assert cache.get("query2", "wikipedia") is not None
    
    def test_cache_stats(self, cache):
        """Test statystyk cache"""
        cache.set("query1", "wikipedia", [{"title": "Test1"}])
        cache.set("query2", "duck", [{"title": "Test2"}])
        
        stats = cache.get_stats()
        
        assert stats["total_entries"] == 2
        assert stats["active_entries"] == 2
        assert stats["max_size"] == 10


class TestOptimizedPrompts:
    """Testy dla optymalizacji promptów"""
    
    def test_get_optimized_prompt(self):
        """Test pobierania zoptymalizowanego promptu"""
        prompt = get_optimized_prompt("simple_response", query="test query")
        
        assert "test query" in prompt
        assert "Krótka odpowiedź" in prompt
    
    def test_get_optimized_prompt_cache(self):
        """Test cache'owania promptów"""
        # Clear cache first
        clear_prompt_cache()
        
        # Get same prompt twice
        prompt1 = get_optimized_prompt("simple_response", query="test query")
        prompt2 = get_optimized_prompt("simple_response", query="test query")
        
        assert prompt1 == prompt2
        
        # Check cache stats
        stats = get_cache_stats()
        assert stats["cache_size"] > 0
    
    def test_get_prompt_template(self):
        """Test szablonów promptów"""
        template = get_prompt_template("weather", location="Warszawa")
        
        assert "system" in template
        assert "user" in template
        assert "Warszawa" in template["user"]
    
    def test_get_prompt_template_missing_params(self):
        """Test szablonów z brakującymi parametrami"""
        template = get_prompt_template("weather")  # No location
        
        assert "system" in template
        assert "user" in template
        # Should handle missing params gracefully


class TestDatabaseOptimizer:
    """Testy dla DatabaseOptimizer"""
    
    @pytest.fixture
    def mock_session(self):
        """Mock dla AsyncSession"""
        session = AsyncMock()
        session.execute = AsyncMock()
        session.commit = AsyncMock()
        session.rollback = AsyncMock()
        return session
    
    @pytest.fixture
    def optimizer(self, mock_session):
        """Fixture dla DatabaseOptimizer"""
        return DatabaseOptimizer(mock_session)
    
    @pytest.mark.asyncio
    async def test_get_conversations_with_messages(self, optimizer, mock_session):
        """Test pobierania konwersacji z wiadomościami"""
        # Mock result
        mock_result = MagicMock()
        mock_result.scalars.return_value.unique.return_value.all.return_value = []
        mock_session.execute.return_value = mock_result
        
        result = await optimizer.get_conversations_with_messages("test_session", limit=10)
        
        assert isinstance(result, list)
        mock_session.execute.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_rag_documents_optimized(self, optimizer, mock_session):
        """Test pobierania dokumentów RAG"""
        # Utwórz instancję RAGDocument
        rag_doc = RAGDocument(
            id=1,
            content="Test content",
            doc_metadata={},
            embedding_vector=[],
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        # Mock result
        mock_result = MagicMock()
        mock_result.all.return_value = [rag_doc]
        mock_session.execute.return_value = mock_result
        result = await optimizer.get_rag_documents_optimized(limit=10, include_content=True)
        assert isinstance(result, list)
        assert len(result) == 1
        assert result[0]["content"] == "Test content"
    
    @pytest.mark.asyncio
    async def test_get_statistics(self, optimizer, mock_session):
        """Test pobierania statystyk"""
        # Mock results for count queries
        mock_count_result = MagicMock()
        mock_count_result.scalar.return_value = 5
        mock_session.execute.return_value = mock_count_result
        
        result = await optimizer.get_statistics()
        
        assert isinstance(result, dict)
        assert "conversations_count" in result
        assert "messages_count" in result
    
    @pytest.mark.asyncio
    async def test_cleanup_old_data(self, optimizer, mock_session):
        """Test czyszczenia starych danych"""
        # Utwórz instancje Message i Conversation
        msg = Message(
            id=1,
            content="test",
            role="user",
            created_at=datetime.now(),
            conversation_id=1
        )
        conv = Conversation(
            id=1,
            session_id="sess1",
            created_at=datetime.now(),
            messages=[msg]
        )
        # Mock results
        mock_messages_result = MagicMock()
        mock_messages_result.scalars.return_value.all.return_value = [msg]
        mock_conversations_result = MagicMock()
        mock_conversations_result.scalars.return_value.all.return_value = [conv]
        mock_session.execute.side_effect = [mock_messages_result, mock_conversations_result]
        result = await optimizer.cleanup_old_data(days=30)
        assert isinstance(result, dict)
        assert "deleted_messages" in result
        assert "deleted_conversations" in result


class TestPerformanceIntegration:
    """Testy integracyjne wydajności"""
    
    @pytest.mark.asyncio
    async def test_cache_integration_with_search_agent(self):
        """Test integracji cache z SearchAgent"""
        from backend.agents.search_agent import SearchAgent
        
        # Create agent with cache enabled
        agent = SearchAgent(config={"cache_enabled": True})
        
        # Mock search providers
        agent.search_providers["wikipedia"] = AsyncMock()
        agent.search_providers["wikipedia"].search.return_value = [
            {"title": "Test", "snippet": "Test snippet"}
        ]
        
        # First search - should hit provider
        result1 = await agent.process_request("test query")
        assert len(result1) > 0
        
        # Second search - should hit cache
        result2 = await agent.process_request("test query")
        assert len(result2) > 0
        
        # Provider should only be called once
        agent.search_providers["wikipedia"].search.assert_called_once()
    
    def test_prompt_optimization_integration(self):
        """Test integracji optymalizacji promptów"""
        # Test that optimized prompts are shorter
        regular_prompt = "Odpowiedz na zapytanie użytkownika w sposób szczegółowy i wyczerpujący"
        optimized_prompt = get_optimized_prompt("simple_response", query="test")
        
        assert len(optimized_prompt) < len(regular_prompt)
        assert "Max 50 słów" in optimized_prompt 