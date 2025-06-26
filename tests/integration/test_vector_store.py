"""
Testy integracyjne dla Vector Store

Testuje rzeczywiste operacje na vector store:
- Dodawanie dokumentów
- Wyszukiwanie
- Persystencja danych
- Wydajność
"""

import pytest
import tempfile
import os
import numpy as np
from pathlib import Path
from typing import List, Dict, Any

from backend.core.vector_store import VectorStore
from backend.core.rag_document_processor import RAGDocumentProcessor
from backend.infrastructure.vector_store.vector_store_impl import EnhancedVectorStoreImpl


class TestVectorStoreIntegration:
    """Testy integracyjne dla Vector Store"""
    
    @pytest.fixture
    def temp_vector_store(self):
        """Tworzy tymczasowy vector store do testów"""
        with tempfile.TemporaryDirectory() as temp_dir:
            store_path = Path(temp_dir) / "test_store"
            store_path.mkdir(exist_ok=True)
            
            # Mock LLM client for embeddings
            mock_llm_client = pytest.Mock()
            mock_llm_client.embed.return_value = [0.1, 0.2, 0.3, 0.4, 0.5]
            
            vector_store = EnhancedVectorStoreImpl(llm_client=mock_llm_client)
            yield vector_store
    
    @pytest.fixture
    def sample_documents(self):
        """Fixture z przykładowymi dokumentami"""
        return [
            {
                "id": "doc1",
                "content": "Python is a programming language",
                "metadata": {"category": "programming", "language": "python"}
            },
            {
                "id": "doc2", 
                "content": "FastAPI is a web framework for Python",
                "metadata": {"category": "web", "language": "python"}
            },
            {
                "id": "doc3",
                "content": "Machine learning uses algorithms to learn patterns",
                "metadata": {"category": "AI", "language": "general"}
            },
            {
                "id": "doc4",
                "content": "Data science combines statistics and programming",
                "metadata": {"category": "data", "language": "general"}
            },
            {
                "id": "doc5",
                "content": "Artificial intelligence mimics human intelligence",
                "metadata": {"category": "AI", "language": "general"}
            }
        ]
    
    @pytest.mark.asyncio
    async def test_add_and_search_documents(self, temp_vector_store, sample_documents):
        """Test dodawania dokumentów i wyszukiwania"""
        # Dodaj dokumenty
        for doc in sample_documents:
            await temp_vector_store.add_document(
                content=doc["content"],
                metadata=doc["metadata"]
            )
        
        # Wyszukaj odpowiednie dokumenty
        query_embedding = np.array([0.1, 0.2, 0.3, 0.4, 0.5], dtype=np.float32)
        results = await temp_vector_store.search(query_embedding, k=3)
        
        assert isinstance(results, list)
        assert len(results) > 0
        assert all(isinstance(result, tuple) for result in results)
        assert all(len(result) == 2 for result in results)  # (document, score)
        
        # Sprawdź czy wyniki zawierają odpowiednie treści
        result_contents = [doc.content for doc, _ in results]
        assert any("Python" in content for content in result_contents)
        assert any("machine learning" in content.lower() for content in result_contents)
    
    @pytest.mark.asyncio
    async def test_search_with_metadata_filter(self, temp_vector_store, sample_documents):
        """Test wyszukiwania z filtrem metadanych"""
        # Dodaj dokumenty
        for doc in sample_documents:
            await temp_vector_store.add_document(
                content=doc["content"],
                metadata=doc["metadata"]
            )
        
        # Wyszukaj tylko dokumenty z kategorii AI
        query_embedding = np.array([0.1, 0.2, 0.3, 0.4, 0.5], dtype=np.float32)
        results = await temp_vector_store.search(
            query_embedding=query_embedding,
            k=5,
            filter_metadata={"category": "AI"}
        )
        
        assert isinstance(results, list)
        # Sprawdź czy wszystkie wyniki mają kategorię AI
        for doc, _ in results:
            assert doc.metadata.get("category") == "AI"
    
    @pytest.mark.asyncio
    async def test_search_similarity_threshold(self, temp_vector_store, sample_documents):
        """Test wyszukiwania z progiem podobieństwa"""
        # Dodaj dokumenty
        for doc in sample_documents:
            await temp_vector_store.add_document(
                content=doc["content"],
                metadata=doc["metadata"]
            )
        
        # Wyszukaj z wysokim progiem podobieństwa
        query_embedding = np.array([0.1, 0.2, 0.3, 0.4, 0.5], dtype=np.float32)
        results = await temp_vector_store.search(
            query_embedding=query_embedding,
            k=5,
            similarity_threshold=0.8
        )
        
        assert isinstance(results, list)
        # Sprawdź czy wszystkie wyniki mają wysokie podobieństwo
        for _, score in results:
            assert score >= 0.8
    
    @pytest.mark.asyncio
    async def test_vector_store_persistence(self, temp_vector_store, sample_documents):
        """Test persystencji danych vector store"""
        # Dodaj dokument
        doc = sample_documents[0]
        await temp_vector_store.add_document(
            content=doc["content"],
            metadata=doc["metadata"]
        )
        
        # Zapisz i załaduj ponownie
        await temp_vector_store.save_index_async()
        await temp_vector_store.load_index_async()
        
        # Wyszukiwanie powinno nadal działać
        query_embedding = np.array([0.1, 0.2, 0.3, 0.4, 0.5], dtype=np.float32)
        results = await temp_vector_store.search(query_embedding, k=1)
        
        assert len(results) == 1
        assert "Python" in results[0][0].content
    
    @pytest.mark.asyncio
    async def test_batch_operations(self, temp_vector_store, sample_documents):
        """Test operacji wsadowych"""
        # Przygotuj dane wsadowe
        batch_data = [
            (doc["content"], doc["metadata"]) for doc in sample_documents
        ]
        
        # Dodaj wsadowo
        for content, metadata in batch_data:
            await temp_vector_store.add_document(content, metadata)
        
        # Sprawdź czy wszystkie zostały dodane
        query_embedding = np.array([0.1, 0.2, 0.3, 0.4, 0.5], dtype=np.float32)
        results = await temp_vector_store.search(query_embedding, k=10)
        
        assert len(results) >= len(sample_documents)
    
    @pytest.mark.asyncio
    async def test_empty_vector_store(self, temp_vector_store):
        """Test pustego vector store"""
        # Sprawdź czy jest pusty
        is_empty = await temp_vector_store.is_empty()
        assert is_empty is True
        
        # Wyszukiwanie w pustym store
        query_embedding = np.array([0.1, 0.2, 0.3, 0.4, 0.5], dtype=np.float32)
        results = await temp_vector_store.search(query_embedding, k=5)
        
        assert len(results) == 0
    
    @pytest.mark.asyncio
    async def test_get_stats(self, temp_vector_store, sample_documents):
        """Test pobierania statystyk"""
        # Dodaj dokumenty
        for doc in sample_documents[:3]:  # Dodaj tylko 3 dokumenty
            await temp_vector_store.add_document(
                content=doc["content"],
                metadata=doc["metadata"]
            )
        
        # Pobierz statystyki
        stats = await temp_vector_store.get_stats()
        
        assert isinstance(stats, dict)
        assert "total_documents" in stats or "total_chunks" in stats
        assert stats.get("total_documents", stats.get("total_chunks", 0)) >= 3
    
    @pytest.mark.asyncio
    async def test_clear_all(self, temp_vector_store, sample_documents):
        """Test czyszczenia wszystkich dokumentów"""
        # Dodaj dokumenty
        for doc in sample_documents:
            await temp_vector_store.add_document(
                content=doc["content"],
                metadata=doc["metadata"]
            )
        
        # Wyczyść wszystkie
        await temp_vector_store.clear_all()
        
        # Sprawdź czy jest pusty
        is_empty = await temp_vector_store.is_empty()
        assert is_empty is True
        
        # Wyszukiwanie powinno zwrócić puste wyniki
        query_embedding = np.array([0.1, 0.2, 0.3, 0.4, 0.5], dtype=np.float32)
        results = await temp_vector_store.search(query_embedding, k=5)
        
        assert len(results) == 0


class TestRAGDocumentProcessorIntegration:
    """Testy integracyjne dla RAG Document Processor"""
    
    @pytest.fixture
    def temp_processor(self):
        """Tworzy tymczasowy processor do testów"""
        with tempfile.TemporaryDirectory() as temp_dir:
            store_path = Path(temp_dir) / "test_store"
            store_path.mkdir(exist_ok=True)
            
            # Mock LLM client
            mock_llm_client = pytest.Mock()
            mock_llm_client.embed.return_value = [0.1, 0.2, 0.3, 0.4, 0.5]
            
            vector_store = EnhancedVectorStoreImpl(llm_client=mock_llm_client)
            processor = RAGDocumentProcessor(vector_store=vector_store)
            
            yield processor
    
    @pytest.mark.asyncio
    async def test_process_document_integration(self, temp_processor):
        """Test integracyjnego przetwarzania dokumentu"""
        content = """
        Machine learning is a subset of artificial intelligence that focuses on the development 
        of computer programs that can access data and use it to learn for themselves. 
        The process of learning begins with observations or data, such as examples, direct 
        experience, or instruction, in order to look for patterns in data and make better 
        decisions in the future based on the examples that we provide.
        """
        source_id = "ml_intro"
        metadata = {"category": "AI", "topic": "machine_learning"}
        
        result = await temp_processor.process_document(content, source_id, metadata)
        
        assert isinstance(result, list)
        assert len(result) > 0
        
        # Sprawdź strukturę wyników
        for chunk_info in result:
            assert "chunk_id" in chunk_info
            assert "chunk_index" in chunk_info
            assert "source" in chunk_info
            assert chunk_info["source"] == source_id
    
    @pytest.mark.asyncio
    async def test_process_batch_integration(self, temp_processor):
        """Test integracyjnego przetwarzania wsadowego"""
        batch = [
            ("Python programming language", {"category": "programming", "language": "python"}),
            ("Data science applications", {"category": "data", "language": "general"}),
            ("Web development with FastAPI", {"category": "web", "language": "python"}),
        ]
        
        result = await temp_processor.process_batch(batch)
        
        assert isinstance(result, list)
        assert len(result) > 0
        
        # Sprawdź czy wszystkie dokumenty zostały przetworzone
        sources = set(chunk["source"] for chunk in result)
        assert len(sources) >= 3  # Powinny być przynajmniej 3 źródła
    
    @pytest.mark.asyncio
    async def test_chunk_text_integration(self, temp_processor):
        """Test integracyjnego dzielenia tekstu"""
        long_text = """
        This is a very long document that should be split into multiple chunks.
        Each chunk should contain a reasonable amount of text that can be processed
        by the embedding model. The chunking process should preserve the semantic
        meaning of the text while ensuring that no chunk is too large or too small.
        
        The second paragraph continues with more content about document processing
        and how it relates to natural language processing tasks. This paragraph
        should be split into its own chunk or combined with adjacent text based
        on the chunking strategy used by the processor.
        
        Finally, this third paragraph provides additional context about the
        importance of proper text chunking in RAG systems and how it affects
        the quality of search results and generated responses.
        """
        
        chunks = temp_processor.chunk_text(long_text)
        
        assert isinstance(chunks, list)
        assert len(chunks) > 1  # Powinno być podzielone na więcej niż jeden chunk
        
        # Sprawdź czy chunki nie są puste
        for chunk in chunks:
            assert len(chunk.strip()) > 0
        
        # Sprawdź czy wszystkie chunki razem zawierają oryginalny tekst
        combined_text = " ".join(chunks)
        assert "machine learning" in combined_text.lower() or "document processing" in combined_text.lower()
    
    @pytest.mark.asyncio
    async def test_embed_text_integration(self, temp_processor):
        """Test integracyjnego generowania embeddings"""
        test_texts = [
            "Simple test text",
            "More complex text with multiple words and concepts",
            "Technical text about machine learning algorithms and neural networks"
        ]
        
        for text in test_texts:
            embedding = await temp_processor.embed_text(text)
            
            assert isinstance(embedding, list)
            assert len(embedding) > 0
            assert all(isinstance(val, (int, float)) for val in embedding)
    
    @pytest.mark.asyncio
    async def test_get_stats_integration(self, temp_processor):
        """Test integracyjnego pobierania statystyk"""
        # Przetwórz kilka dokumentów
        documents = [
            ("First document", "doc1"),
            ("Second document", "doc2"),
            ("Third document", "doc3"),
        ]
        
        for content, source_id in documents:
            await temp_processor.process_document(content, source_id)
        
        # Pobierz statystyki
        stats = await temp_processor.get_stats()
        
        assert isinstance(stats, dict)
        assert "total_processed" in stats
        assert "total_chunks" in stats
        assert "vector_store_stats" in stats
        
        # Sprawdź czy statystyki są rozsądne
        assert stats["total_processed"] >= 3
        assert stats["total_chunks"] >= 3


class TestVectorStorePerformance:
    """Testy wydajności vector store"""
    
    @pytest.fixture
    def performance_vector_store(self):
        """Vector store do testów wydajności"""
        with tempfile.TemporaryDirectory() as temp_dir:
            store_path = Path(temp_dir) / "perf_store"
            store_path.mkdir(exist_ok=True)
            
            # Mock LLM client
            mock_llm_client = pytest.Mock()
            mock_llm_client.embed.return_value = [0.1, 0.2, 0.3, 0.4, 0.5]
            
            vector_store = EnhancedVectorStoreImpl(llm_client=mock_llm_client)
            return vector_store
    
    @pytest.mark.asyncio
    async def test_bulk_insert_performance(self, performance_vector_store):
        """Test wydajności masowego dodawania dokumentów"""
        import time
        
        # Przygotuj dużą liczbę dokumentów
        num_documents = 100
        documents = [
            (f"Document {i} content about various topics", {"id": f"doc_{i}"})
            for i in range(num_documents)
        ]
        
        # Mierz czas dodawania
        start_time = time.time()
        
        for content, metadata in documents:
            await performance_vector_store.add_document(content, metadata)
        
        end_time = time.time()
        insertion_time = end_time - start_time
        
        # Sprawdź czy dodawanie nie trwało zbyt długo
        assert insertion_time < 30.0  # Maksymalnie 30 sekund
        
        # Sprawdź czy wszystkie dokumenty zostały dodane
        query_embedding = np.array([0.1, 0.2, 0.3, 0.4, 0.5], dtype=np.float32)
        results = await performance_vector_store.search(query_embedding, k=num_documents)
        
        assert len(results) >= num_documents // 2  # Przynajmniej połowa powinna być znaleziona
    
    @pytest.mark.asyncio
    async def test_search_performance(self, performance_vector_store):
        """Test wydajności wyszukiwania"""
        import time
        
        # Dodaj dokumenty
        num_documents = 50
        for i in range(num_documents):
            await performance_vector_store.add_document(
                f"Document {i} with unique content {i}",
                {"id": f"doc_{i}"}
            )
        
        # Mierz czas wyszukiwania
        query_embedding = np.array([0.1, 0.2, 0.3, 0.4, 0.5], dtype=np.float32)
        
        start_time = time.time()
        results = await performance_vector_store.search(query_embedding, k=10)
        end_time = time.time()
        
        search_time = end_time - start_time
        
        # Wyszukiwanie powinno być szybkie
        assert search_time < 5.0  # Maksymalnie 5 sekund
        assert len(results) > 0
    
    @pytest.mark.asyncio
    async def test_memory_usage(self, performance_vector_store):
        """Test użycia pamięci"""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss
        
        # Dodaj dokumenty
        for i in range(100):
            await performance_vector_store.add_document(
                f"Document {i} with content",
                {"id": f"doc_{i}"}
            )
        
        final_memory = process.memory_info().rss
        memory_increase = final_memory - initial_memory
        
        # Zwiększenie pamięci nie powinno być zbyt duże (MB)
        memory_increase_mb = memory_increase / 1024 / 1024
        assert memory_increase_mb < 500  # Maksymalnie 500MB 