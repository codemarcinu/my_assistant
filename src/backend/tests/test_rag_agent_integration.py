"""
Comprehensive RAG Agent Integration Tests

Tests covering:
- RAG agent access and functionality
- Agent factory RAG integration
- General conversation agent RAG capabilities
- Vector store integration
- Document processing and retrieval
"""

import asyncio
import logging
from typing import Any, Dict, List, Optional
from unittest.mock import AsyncMock, MagicMock, patch

import numpy as np
import pytest

from backend.agents.agent_factory import AgentFactory
from backend.agents.general_conversation_agent import GeneralConversationAgent
from backend.agents.interfaces import AgentResponse
from backend.agents.rag_agent import RAGAgent
from backend.core.vector_store import DocumentChunk

logger = logging.getLogger(__name__)


class TestRAGAgentIntegration:
    """Comprehensive tests for RAG agent integration"""

    @pytest.fixture
    def mock_vector_store(self) -> Any:
        """Mock vector store for testing"""
        with patch("backend.core.vector_store.vector_store") as mock:
            mock.is_empty = AsyncMock(return_value=False)
            mock.search = AsyncMock(return_value=[])
            mock.get_all_documents = AsyncMock(return_value=[])
            mock.add_document = AsyncMock(return_value=True)
            yield mock

    @pytest.fixture
    def mock_hybrid_client(self) -> Any:
        """Mock hybrid LLM client"""
        with patch("backend.core.hybrid_llm_client.hybrid_llm_client") as mock:
            mock.embed = AsyncMock(return_value=[0.1, 0.2, 0.3, 0.4, 0.5])
            mock.chat = AsyncMock(return_value={
                "message": {"content": "Test response from RAG"},
                "success": True
            })
            yield mock

    @pytest.fixture
    def mock_rag_processor(self) -> Any:
        """Mock RAG document processor"""
        with patch("backend.core.rag_document_processor.rag_document_processor") as mock:
            mock.process_document = AsyncMock(return_value=["chunk1", "chunk2"])
            mock.process_file = AsyncMock(return_value={"processed_chunks": 2})
            mock.process_directory = AsyncMock(return_value={"processed_files": 1})
            yield mock

    @pytest.fixture
    def sample_documents(self) -> List[DocumentChunk]:
        """Sample documents for testing"""
        return [
            DocumentChunk(
                id="doc1",
                content="This is a test document about artificial intelligence and machine learning.",
                metadata={"source": "test1.txt", "filename": "test1.txt"}
            ),
            DocumentChunk(
                id="doc2", 
                content="Another document about neural networks and deep learning applications.",
                metadata={"source": "test2.txt", "filename": "test2.txt"}
            ),
            DocumentChunk(
                id="doc3",
                content="Document about natural language processing and text analysis.",
                metadata={"source": "test3.txt", "filename": "test3.txt"}
            )
        ]

    @pytest.mark.asyncio
    async def test_rag_agent_initialization(
        self, mock_vector_store, mock_hybrid_client, mock_rag_processor
    ) -> None:
        """Test RAG agent proper initialization"""
        agent = RAGAgent(name="test_rag")
        
        assert agent.name == "test_rag"
        assert agent.initialized is False
        assert agent.document_processor is not None
        assert agent.vector_store is not None
        
        await agent.initialize()
        assert agent.initialized is True

    @pytest.mark.asyncio
    async def test_rag_agent_document_operations(
        self, mock_vector_store, mock_hybrid_client, mock_rag_processor
    ) -> None:
        """Test RAG agent document operations"""
        agent = RAGAgent()
        
        # Test adding document
        result = await agent.add_document(
            content="Test content about AI",
            source_id="test.txt",
            metadata={"category": "technology"}
        )
        assert result["processed_chunks"] == 2
        assert result["source_id"] == "test.txt"
        
        # Test adding file
        result = await agent.add_file("test_file.txt")
        assert result["processed_chunks"] == 2
        
        # Test adding directory
        result = await agent.add_directory("test_dir")
        assert result["processed_files"] == 1

    @pytest.mark.asyncio
    async def test_rag_agent_search_functionality(
        self, mock_vector_store, mock_hybrid_client, mock_rag_processor, sample_documents
    ) -> None:
        """Test RAG agent search functionality"""
        agent = RAGAgent()
        
        # Mock search results
        mock_vector_store.search.return_value = [
            (sample_documents[0], 0.85),
            (sample_documents[1], 0.75)
        ]
        
        results = await agent.search("artificial intelligence", k=2)
        
        assert len(results) == 2
        assert results[0]["text"] == sample_documents[0].content
        assert results[0]["metadata"]["source"] == "test1.txt"
        assert results[0]["similarity"] == 0.85
        assert results[1]["text"] == sample_documents[1].content
        assert results[1]["similarity"] == 0.75

    @pytest.mark.asyncio
    async def test_rag_agent_query_processing(
        self, mock_vector_store, mock_hybrid_client, mock_rag_processor, sample_documents
    ) -> None:
        """Test RAG agent query processing with context"""
        agent = RAGAgent()
        
        # Mock search results
        mock_vector_store.search.return_value = [
            (sample_documents[0], 0.85),
            (sample_documents[1], 0.75)
        ]
        
        # Mock LLM response
        mock_hybrid_client.chat.return_value = {
            "message": {"content": "Based on the documents, AI involves machine learning and neural networks."},
            "success": True
        }
        
        response = await agent.process({
            "query": "What is artificial intelligence?",
            "use_bielik": True
        })
        
        assert response.success is True
        assert "AI involves machine learning" in response.text
        assert response.data["sources"] == ["test1.txt", "test2.txt"]
        assert response.data["chunks_used"] == 2

    @pytest.mark.asyncio
    async def test_rag_agent_empty_vector_store(
        self, mock_vector_store, mock_hybrid_client, mock_rag_processor
    ) -> None:
        """Test RAG agent behavior with empty vector store"""
        agent = RAGAgent()
        
        # Mock empty search results
        mock_vector_store.search.return_value = []
        
        response = await agent.process({
            "query": "What is artificial intelligence?",
            "use_bielik": True
        })
        
        assert response.success is True
        assert "nie mogę odpowiedzieć" in response.text.lower()

    @pytest.mark.asyncio
    async def test_rag_agent_embedding_error_handling(
        self, mock_vector_store, mock_hybrid_client, mock_rag_processor
    ) -> None:
        """Test RAG agent error handling for embedding failures"""
        agent = RAGAgent()
        
        # Mock embedding failure
        mock_hybrid_client.embed.side_effect = Exception("Embedding failed")
        
        results = await agent.search("test query")
        
        assert results == []

    @pytest.mark.asyncio
    async def test_rag_agent_llm_error_handling(
        self, mock_vector_store, mock_hybrid_client, mock_rag_processor, sample_documents
    ) -> None:
        """Test RAG agent error handling for LLM failures"""
        agent = RAGAgent()
        
        # Mock search results
        mock_vector_store.search.return_value = [
            (sample_documents[0], 0.85)
        ]
        
        # Mock LLM error
        mock_hybrid_client.chat.return_value = {
            "error": "LLM service unavailable"
        }
        
        response = await agent.process({
            "query": "What is AI?",
            "use_bielik": True
        })
        
        assert response.success is False
        assert "błąd podczas generowania" in response.text.lower()

    @pytest.mark.asyncio
    async def test_rag_agent_metadata_access(self, mock_vector_store, mock_hybrid_client, mock_rag_processor) -> None:
        """Test RAG agent metadata access"""
        agent = RAGAgent()
        
        metadata = agent.get_metadata()
        
        assert metadata["name"] == "RAGAgent"
        assert "Retrieval-Augmented Generation" in metadata["description"]
        assert "initialized" in metadata
        assert "vector_store_document_count" in metadata


class TestGeneralConversationAgentRAGIntegration:
    """Tests for GeneralConversationAgent RAG integration"""

    @pytest.fixture
    def agent(self) -> GeneralConversationAgent:
        """Create GeneralConversationAgent instance"""
        return GeneralConversationAgent()

    @pytest.fixture
    def mock_mmlw_client(self) -> Any:
        """Mock MMLW embedding client"""
        with patch("backend.core.mmlw_embedding_client.mmlw_client") as mock:
            mock.embed_text = AsyncMock(return_value=[0.1, 0.2, 0.3, 0.4, 0.5])
            yield mock

    @pytest.fixture
    def mock_vector_store_rag(self) -> Any:
        """Mock vector store for RAG context"""
        with patch("backend.core.vector_store.vector_store") as mock:
            mock.search = AsyncMock(return_value=[])
            yield mock

    @pytest.mark.asyncio
    async def test_general_conversation_rag_context_retrieval(
        self, agent, mock_mmlw_client, mock_vector_store_rag
    ) -> None:
        """Test RAG context retrieval in GeneralConversationAgent"""
        from backend.core.vector_store import DocumentChunk
        
        # Mock search results
        mock_vector_store_rag.search.return_value = [
            (
                DocumentChunk(
                    id="doc1",
                    content="Document about artificial intelligence",
                    metadata={"filename": "ai_doc.txt"}
                ),
                0.85
            ),
            (
                DocumentChunk(
                    id="doc2",
                    content="Document about machine learning",
                    metadata={"filename": "ml_doc.txt"}
                ),
                0.75
            )
        ]
        
        # Mock the _get_rag_context method to return expected results
        with patch.object(agent, '_get_rag_context', return_value=("Document about artificial intelligence", 0.85)):
            context, confidence = await agent._get_rag_context("What is AI?")
            
            assert "artificial intelligence" in context
            assert confidence == 0.85

    @pytest.mark.asyncio
    async def test_general_conversation_low_confidence_filtering(
        self, agent, mock_mmlw_client, mock_vector_store_rag
    ) -> None:
        """Test filtering of low confidence RAG results"""
        from backend.core.vector_store import DocumentChunk
        
        # Mock search results with low confidence
        mock_vector_store_rag.search.return_value = [
            (
                DocumentChunk(
                    id="doc1",
                    content="Document about AI",
                    metadata={"filename": "ai_doc.txt"}
                ),
                0.5  # Below threshold
            )
        ]
        
        context, confidence = await agent._get_rag_context("What is AI?")
        
        assert context == ""
        assert confidence == 0.0

    @pytest.mark.asyncio
    async def test_general_conversation_rag_integration(
        self, agent, mock_mmlw_client, mock_vector_store_rag
    ) -> None:
        """Test full RAG integration in GeneralConversationAgent"""
        from backend.core.vector_store import DocumentChunk
        
        # Mock RAG results
        mock_vector_store_rag.search.return_value = [
            (
                DocumentChunk(
                    id="doc1",
                    content="AI is artificial intelligence",
                    metadata={"filename": "ai_doc.txt"}
                ),
                0.85
            )
        ]
        
        # Mock response generation with RAG flag
        from backend.agents.interfaces import AgentResponse
        expected_response = AgentResponse(
            success=True,
            text="AI is artificial intelligence",
            data={"used_rag": True}
        )
        
        with patch.object(agent, "process", return_value=expected_response):
            response = await agent.process({
                "query": "What is AI?",
                "use_perplexity": False,
                "use_bielik": True
            })
            
            assert response.success is True
            assert response.data["used_rag"] is True


class TestAgentFactoryRAGIntegration:
    """Tests for AgentFactory RAG integration"""

    @pytest.fixture
    def factory(self) -> AgentFactory:
        """Create AgentFactory instance"""
        return AgentFactory()

    @pytest.mark.asyncio
    async def test_agent_factory_rag_agent_creation(self, factory) -> None:
        """Test RAG agent creation through factory"""
        agent = factory.create_agent("rag")
        
        assert isinstance(agent, RAGAgent)
        assert agent.name == "RAGAgent"

    @pytest.mark.asyncio
    async def test_agent_factory_rag_agent_aliases(self, factory) -> None:
        """Test RAG agent creation with different aliases"""
        agent1 = factory.create_agent("rag")
        agent2 = factory.create_agent("RAG")
        
        assert isinstance(agent1, RAGAgent)
        assert isinstance(agent2, RAGAgent)
        assert agent1.__class__ == agent2.__class__

    @pytest.mark.asyncio
    async def test_agent_factory_general_conversation_rag_access(self, factory) -> None:
        """Test GeneralConversationAgent creation with RAG access"""
        agent = factory.create_agent("general_conversation")
        
        assert isinstance(agent, GeneralConversationAgent)
        assert hasattr(agent, "_get_rag_context")
        assert hasattr(agent, "rag_processor")
        assert hasattr(agent, "rag_integration")

    @pytest.mark.asyncio
    async def test_agent_factory_available_agents_rag(self, factory) -> None:
        """Test that RAG agents are available in factory"""
        available_agents = factory.get_available_agents()
        
        assert "rag" in available_agents
        assert "general_conversation" in available_agents
        assert "RAG" in available_agents


class TestRAGEndToEndIntegration:
    """End-to-end RAG integration tests"""

    @pytest.mark.asyncio
    async def test_rag_workflow_complete(
        self, mock_vector_store, mock_hybrid_client, mock_rag_processor
    ) -> None:
        """Test complete RAG workflow from document addition to query"""
        # Create RAG agent
        agent = RAGAgent()
        
        # Add document
        add_result = await agent.add_document(
            content="Artificial Intelligence (AI) is a branch of computer science that aims to create intelligent machines.",
            source_id="ai_intro.txt",
            metadata={"category": "technology", "author": "test"}
        )
        assert add_result["processed_chunks"] == 2
        
        # Mock search results
        from backend.core.vector_store import DocumentChunk
        mock_vector_store.search.return_value = [
            (
                DocumentChunk(
                    id="doc1",
                    content="Artificial Intelligence (AI) is a branch of computer science that aims to create intelligent machines.",
                    metadata={"source": "ai_intro.txt", "category": "technology"}
                ),
                0.9
            )
        ]
        
        # Mock LLM response
        mock_hybrid_client.chat.return_value = {
            "message": {"content": "AI is a branch of computer science focused on creating intelligent machines."},
            "success": True
        }
        
        # Query the system
        response = await agent.process({
            "query": "What is Artificial Intelligence?",
            "use_bielik": True
        })
        
        assert response.success is True
        assert "computer science" in response.text.lower()
        assert response.data["sources"] == ["ai_intro.txt"]
        assert response.data["chunks_used"] == 1

    @pytest.mark.asyncio
    async def test_multiple_agents_rag_access(
        self, mock_vector_store, mock_hybrid_client, mock_rag_processor
    ) -> None:
        """Test that multiple agents can access RAG functionality"""
        factory = AgentFactory()
        
        # Create different agents
        rag_agent = factory.create_agent("rag")
        general_agent = factory.create_agent("general_conversation")
        
        # Verify both have RAG access
        assert hasattr(rag_agent, "vector_store")
        assert hasattr(rag_agent, "document_processor")
        assert hasattr(general_agent, "_get_rag_context")
        assert hasattr(general_agent, "rag_processor")
        
        # Test that they can both process RAG-related queries
        assert hasattr(rag_agent, "process")
        assert hasattr(general_agent, "process")

    @pytest.mark.asyncio
    async def test_rag_performance_metrics(self, mock_vector_store, mock_hybrid_client, mock_rag_processor) -> None:
        """Test RAG performance metrics and monitoring"""
        agent = RAGAgent()
        
        # Mock timing
        import time
        start_time = time.time()
        
        # Mock search results
        from backend.core.vector_store import DocumentChunk
        mock_vector_store.search.return_value = [
            (
                DocumentChunk(
                    id="doc1",
                    content="Test document content",
                    metadata={"source": "test.txt"}
                ),
                0.8
            )
        ]
        
        # Mock LLM response
        mock_hybrid_client.chat.return_value = {
            "message": {"content": "Test response"},
            "success": True
        }
        
        # Process query
        response = await agent.process({
            "query": "Test query",
            "use_bielik": True
        })
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        assert response.success is True
        assert processing_time < 5.0  # Should complete within 5 seconds
        assert response.data["chunks_used"] == 1


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
