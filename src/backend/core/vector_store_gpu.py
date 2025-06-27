"""
GPU-Accelerated Vector Store Implementation using PyTorch
Alternative to FAISS GPU when not available
"""

import asyncio
import logging
import os
import weakref
from contextlib import asynccontextmanager
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, AsyncGenerator, Callable, Dict, List, Optional, Tuple

import numpy as np

logger = logging.getLogger(__name__)

try:
    import torch
    TORCH_AVAILABLE = True
    GPU_AVAILABLE = torch.cuda.is_available()
    if GPU_AVAILABLE:
        DEVICE = torch.device('cuda')
        logger.info(f"PyTorch GPU available: {torch.cuda.get_device_name()}")
    else:
        DEVICE = torch.device('cpu')
        logger.info("PyTorch GPU not available, using CPU")
except ImportError:
    TORCH_AVAILABLE = False
    GPU_AVAILABLE = False
    DEVICE = None
    logger.warning("PyTorch not available")


@dataclass
class DocumentChunk:
    """Document chunk with metadata and embedding support"""

    id: str
    content: str
    metadata: Dict[str, Any]
    embedding: Optional[np.ndarray] = None
    created_at: Optional[str] = None

    def __post_init__(self) -> None:
        if self.created_at is None:
            self.created_at = datetime.now().isoformat()


class GPUVectorStore:
    """GPU-accelerated vector store using PyTorch with cosine similarity"""

    def __init__(self, dimension: int = 768, use_gpu: bool = True) -> None:
        self.dimension = dimension
        self.use_gpu = use_gpu and TORCH_AVAILABLE and GPU_AVAILABLE
        
        if self.use_gpu:
            self.device = torch.device('cuda')
            logger.info("Using GPU-accelerated vector store")
        else:
            self.device = torch.device('cpu')
            logger.info("Using CPU vector store")

        # Store vectors as PyTorch tensors
        self.vectors: Optional[torch.Tensor] = None
        self.vector_ids: List[str] = []
        
        # Use weak references to avoid memory leaks
        self._documents: Dict[str, weakref.ref[DocumentChunk]] = {}
        
        # Memory management
        self._max_documents = 10000
        self._cleanup_threshold = 8000
        self._cleanup_lock = asyncio.Lock()

        # Cache for frequently accessed vectors
        self._vector_cache: Dict[str, np.ndarray] = {}
        self._cache_max_size = 1000
        self._cache_hits = 0
        self._cache_misses = 0

        # Performance tracking
        self._stats = {
            "total_documents": 0,
            "total_vectors": 0,
            "last_cleanup": 0.0,
            "cleanup_count": 0,
            "cache_hits": 0,
            "cache_misses": 0,
            "gpu_enabled": self.use_gpu,
        }

        # Track chunks since last save
        self.chunks_since_save = 0

    def _cleanup_callback(self, weak_ref) -> None:
        """Callback when document is garbage collected"""
        for doc_id, ref in list(self._documents.items()):
            if ref is weak_ref:
                del self._documents[doc_id]
                if doc_id in self._vector_cache:
                    del self._vector_cache[doc_id]
                logger.debug(f"Cleaned up garbage collected document: {doc_id}")
                break

    def _get_cached_embedding(self, doc_id: str) -> Optional[np.ndarray]:
        """Get embedding from cache"""
        if doc_id in self._vector_cache:
            self._stats["cache_hits"] = int(self._stats.get("cache_hits", 0)) + 1
            return self._vector_cache[doc_id]
        self._stats["cache_misses"] = int(self._stats.get("cache_misses", 0)) + 1
        return None

    def _cache_embedding(self, doc_id: str, embedding: np.ndarray) -> None:
        """Cache embedding with LRU eviction"""
        if len(self._vector_cache) >= self._cache_max_size:
            # Remove oldest entry (simple LRU)
            oldest_key = next(iter(self._vector_cache))
            del self._vector_cache[oldest_key]
        self._vector_cache[doc_id] = embedding

    def _cosine_similarity(self, query: torch.Tensor, vectors: torch.Tensor) -> torch.Tensor:
        """Compute cosine similarity between query and vectors"""
        # Normalize vectors
        query_norm = torch.nn.functional.normalize(query, p=2, dim=1)
        vectors_norm = torch.nn.functional.normalize(vectors, p=2, dim=1)
        
        # Compute cosine similarity
        similarity = torch.mm(query_norm, vectors_norm.t())
        return similarity.squeeze()

    async def add_document(
        self, text: str, metadata: Dict[str, Any], auto_embed: bool = False
    ) -> None:
        """Add a single document to the vector store"""
        # Create a simple document chunk
        doc = DocumentChunk(
            id=f"doc_{len(self._documents)}", content=text, metadata=metadata
        )

        # Generate embedding if auto_embed is True
        if auto_embed:
            try:
                # Import here to avoid circular imports
                from backend.core.llm_client import llm_client

                # Use default embedding model
                embedding_response = await llm_client.embed(model="nomic-embed-text", text=text)
                if embedding_response and "embedding" in embedding_response:
                    doc.embedding = np.array(
                        embedding_response["embedding"], dtype=np.float32
                    )
            except Exception as e:
                logger.warning(f"Failed to auto-generate embedding: {e}")

        await self.add_documents([doc])

    async def add_documents(self, documents: List[DocumentChunk]) -> None:
        """Add documents to vector store with memory management and caching"""
        if len(self._documents) + len(documents) >= self._max_documents:
            await self._cleanup_old_documents()
            
        embeddings = []
        for doc in documents:
            if doc.embedding is not None:
                embeddings.append(doc.embedding)
                self._cache_embedding(doc.id, doc.embedding)
                self._documents[doc.id] = weakref.ref(doc, self._cleanup_callback)
                self.vector_ids.append(doc.id)
                self._stats["total_documents"] = (
                    int(self._stats.get("total_documents", 0)) + 1
                )
                self.chunks_since_save += 1
                
        if embeddings:
            # Convert to PyTorch tensor and move to device
            embeddings_tensor = torch.tensor(embeddings, dtype=torch.float32, device=self.device)
            
            if self.vectors is None:
                self.vectors = embeddings_tensor
            else:
                self.vectors = torch.cat([self.vectors, embeddings_tensor], dim=0)
                
            self._stats["total_vectors"] = self.vectors.shape[0]
            logger.debug(f"Added {len(documents)} documents to vector store")

    async def search(
        self, query_embedding: np.ndarray, k: int = 5
    ) -> List[Tuple[DocumentChunk, float]]:
        """Search for similar documents using cosine similarity"""
        try:
            if self.vectors is None or self.vectors.shape[0] == 0:
                logger.warning("Vector store is empty, no search results available")
                return []

            # Convert query to PyTorch tensor
            query_tensor = torch.tensor(query_embedding, dtype=torch.float32, device=self.device)
            if query_tensor.ndim == 1:
                query_tensor = query_tensor.unsqueeze(0)

            # Compute similarities
            similarities = self._cosine_similarity(query_tensor, self.vectors)
            
            # Get top-k results
            top_k_values, top_k_indices = torch.topk(similarities, min(k, len(similarities)))
            
            results = []
            for i, (similarity, idx) in enumerate(zip(top_k_values.cpu().numpy(), top_k_indices.cpu().numpy())):
                if idx < len(self.vector_ids):
                    doc_id = self.vector_ids[idx]
                    
                    # Try cache first
                    cached_embedding = self._get_cached_embedding(doc_id)
                    if cached_embedding is not None:
                        # Create minimal document chunk with cached data
                        doc = DocumentChunk(
                            id=doc_id,
                            content="",  # Content not cached for memory efficiency
                            metadata={"cached": True},
                            embedding=cached_embedding,
                        )
                        results.append((doc, float(similarity)))

            return results

        except Exception as e:
            logger.error(f"Error in GPU vector search: {e}")
            return []

    async def search_text(
        self, query: str, k: int = 5, min_similarity: float = 0.0
    ) -> List[Dict[str, Any]]:
        """Search for similar documents by text query"""
        try:
            # Import here to avoid circular imports
            from backend.core.llm_client import llm_client

            # Get query embedding
            embedding_response = await llm_client.embed(model="nomic-embed-text", text=query)
            if not embedding_response or "embedding" not in embedding_response:
                logger.error("Failed to get query embedding")
                return []

            query_embedding = np.array(embedding_response["embedding"], dtype=np.float32)
            
            # Search for similar documents
            results = await self.search(query_embedding, k)
            
            # Filter by similarity threshold and format results
            formatted_results = []
            for doc, similarity in results:
                if similarity >= min_similarity:
                    formatted_results.append({
                        "id": doc.id,
                        "content": doc.content,
                        "metadata": doc.metadata,
                        "similarity": similarity
                    })
            
            return formatted_results

        except Exception as e:
            logger.error(f"Error in text search: {e}")
            return []

    async def get_document(self, doc_id: str) -> Optional[DocumentChunk]:
        """Get document by ID"""
        if doc_id in self._documents:
            doc_ref = self._documents[doc_id]
            doc = doc_ref()
            if doc is not None:
                return doc
        return None

    async def remove_document(self, doc_id: str) -> bool:
        """Remove document by ID"""
        if doc_id in self._documents:
            # Find index in vectors
            if doc_id in self.vector_ids:
                idx = self.vector_ids.index(doc_id)
                # Remove from vectors tensor
                if self.vectors is not None:
                    mask = torch.ones(self.vectors.shape[0], dtype=torch.bool, device=self.device)
                    mask[idx] = False
                    self.vectors = self.vectors[mask]
                self.vector_ids.pop(idx)
            
            # Remove from documents and cache
            del self._documents[doc_id]
            if doc_id in self._vector_cache:
                del self._vector_cache[doc_id]
            
            self._stats["total_documents"] = max(0, self._stats["total_documents"] - 1)
            return True
        return False

    async def _cleanup_old_documents(self) -> None:
        """Clean up old documents to manage memory"""
        async with self._cleanup_lock:
            if len(self._documents) < self._cleanup_threshold:
                return

            logger.info(f"Cleaning up old documents. Current: {len(self._documents)}")
            
            # Remove oldest documents (simple FIFO)
            documents_to_remove = len(self._documents) - self._cleanup_threshold
            for _ in range(documents_to_remove):
                if self.vector_ids:
                    doc_id = self.vector_ids.pop(0)
                    if doc_id in self._documents:
                        del self._documents[doc_id]
                    if doc_id in self._vector_cache:
                        del self._vector_cache[doc_id]

            # Rebuild vectors tensor
            if self.vector_ids:
                embeddings = []
                for doc_id in self.vector_ids:
                    cached = self._get_cached_embedding(doc_id)
                    if cached is not None:
                        embeddings.append(cached)
                
                if embeddings:
                    self.vectors = torch.tensor(embeddings, dtype=torch.float32, device=self.device)
                else:
                    self.vectors = None
            else:
                self.vectors = None

            self._stats["cleanup_count"] = int(self._stats.get("cleanup_count", 0)) + 1
            self._stats["last_cleanup"] = datetime.now().timestamp()
            logger.info(f"Cleanup completed. Remaining: {len(self._documents)}")

    async def get_stats(self) -> Dict[str, Any]:
        """Get vector store statistics"""
        return {
            **self._stats,
            "cache_size": len(self._vector_cache),
            "cache_hit_rate": (
                self._stats["cache_hits"] / (self._stats["cache_hits"] + self._stats["cache_misses"])
                if (self._stats["cache_hits"] + self._stats["cache_misses"]) > 0
                else 0.0
            ),
            "device": str(self.device),
        }

    async def get_statistics(self) -> Dict[str, Any]:
        """Alias for get_stats"""
        return await self.get_stats()

    async def is_empty(self) -> bool:
        """Check if vector store is empty"""
        return self.vectors is None or self.vectors.shape[0] == 0

    async def clear_all(self) -> None:
        """Clear all documents and vectors"""
        self.vectors = None
        self.vector_ids.clear()
        self._documents.clear()
        self._vector_cache.clear()
        self._stats["total_documents"] = 0
        self._stats["total_vectors"] = 0
        logger.info("Vector store cleared")

    async def save_index_async(self) -> None:
        """Save index asynchronously"""
        if self.vectors is not None:
            # Save vectors as numpy array
            vectors_np = self.vectors.cpu().numpy()
            np.save("vectors.npy", vectors_np)
            
            # Save metadata
            import json
            metadata = {
                "vector_ids": self.vector_ids,
                "stats": self._stats,
                "dimension": self.dimension
            }
            with open("vectors_metadata.json", "w") as f:
                json.dump(metadata, f)
            
            self.chunks_since_save = 0
            logger.info("Vector store saved")

    @asynccontextmanager
    async def context_manager(self) -> AsyncGenerator["GPUVectorStore", None]:
        """Context manager for vector store"""
        try:
            yield self
        finally:
            await self.save_index_async()

    async def __aenter__(self) -> "GPUVectorStore":
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        await self.save_index_async()


# Global instance with GPU support
gpu_vector_store = GPUVectorStore(dimension=768, use_gpu=True) 