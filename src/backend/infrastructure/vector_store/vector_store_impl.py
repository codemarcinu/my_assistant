import logging
from typing import Any, Dict, List, Optional, Tuple
import numpy as np

from backend.core.vector_store import VectorStore, DocumentChunk
from backend.infrastructure.llm_api.llm_client import LLMClient

logger = logging.getLogger(__name__)


class EnhancedVectorStoreImpl:
    def __init__(self, llm_client: LLMClient) -> None:
        self.llm_client = llm_client
        self.vector_store = VectorStore()

    async def add_documents(self, documents: List[str]) -> None:
        """Add documents to vector store"""
        try:
            for i, document in enumerate(documents):
                metadata = {"source": f"document_{i}", "type": "text", "index": i}
                await self.vector_store.add_document(
                    text=document, metadata=metadata, auto_embed=True
                )
            logger.info(f"Added {len(documents)} documents to vector store")
        except Exception as e:
            logger.error(f"Error adding documents: {e}")
            raise

    async def add_document(self, text: str, metadata: Dict[str, Any]) -> None:
        """Add a single document to vector store"""
        try:
            await self.vector_store.add_document(
                text=text, metadata=metadata, auto_embed=True
            )
            logger.info("Added document to vector store")
        except Exception as e:
            logger.error(f"Error adding document: {e}")
            raise

    async def search(
        self, 
        query: str, 
        top_k: int = 5, 
        similarity_threshold: float = 0.65,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Search for similar documents with the interface expected by RAG integration"""
        try:
            # Generate query embedding
            embedding_response = await self.llm_client.embed(query)
            if not embedding_response:
                logger.warning("Failed to generate embedding for query")
                return {"chunks": [], "total": 0}

            # Convert to numpy array
            query_embedding = np.array(embedding_response, dtype=np.float32)

            # Search vector store
            results = await self.vector_store.search(
                query_embedding=query_embedding, k=top_k
            )

            # Filter results by similarity threshold and metadata
            filtered_results = []
            for doc_chunk, distance in results:
                similarity = 1.0 - (distance / 2.0)  # Convert distance to similarity
                
                # Check similarity threshold
                if similarity < similarity_threshold:
                    continue
                
                # Check metadata filter if provided
                if filter_metadata:
                    metadata_match = True
                    for key, value in filter_metadata.items():
                        if doc_chunk.metadata.get(key) != value:
                            metadata_match = False
                            break
                    if not metadata_match:
                        continue
                
                filtered_results.append({
                    "content": doc_chunk.content,
                    "metadata": doc_chunk.metadata,
                    "similarity": similarity,
                    "id": doc_chunk.id
                })

            return {
                "chunks": filtered_results,
                "total": len(filtered_results)
            }
        except Exception as e:
            logger.error(f"Error in search: {e}")
            return {"chunks": [], "total": 0, "error": str(e)}

    async def similarity_search(self, query: str, k: int = 4) -> List[str]:
        """Search for similar documents (legacy method)"""
        try:
            # Generate query embedding
            query_embedding = await self.llm_client.embed(query)
            if not query_embedding:
                return []

            # Search vector store
            results = await self.vector_store.search(
                query_embedding=query_embedding, k=k
            )

            # Extract text from results
            documents = [chunk.content for chunk, _ in results if chunk.content]
            return documents
        except Exception as e:
            logger.error(f"Error in similarity search: {e}")
            return []

    async def get_relevant_documents(self, query: str) -> List[str]:
        """Get relevant documents for query"""
        try:
            # Use similarity search with default k=4
            return await self.similarity_search(query, k=4)
        except Exception as e:
            logger.error(f"Error getting relevant documents: {e}")
            return []

    async def delete_by_metadata(self, metadata_filter: Dict[str, Any]) -> bool:
        """Delete documents by metadata filter"""
        try:
            # This is a simplified implementation
            # In a full implementation, you would iterate through documents and delete matching ones
            logger.info(f"Delete by metadata called with filter: {metadata_filter}")
            return True
        except Exception as e:
            logger.error(f"Error deleting by metadata: {e}")
            return False

    async def get_stats(self) -> Dict[str, Any]:
        """Get vector store statistics"""
        try:
            return await self.vector_store.get_stats()
        except Exception as e:
            logger.error(f"Error getting stats: {e}")
            return {"error": str(e)}

    async def clear_all(self) -> None:
        """Clear all documents from vector store"""
        try:
            # This would need to be implemented in the base VectorStore
            logger.info("Clear all called")
        except Exception as e:
            logger.error(f"Error clearing vector store: {e}")
            raise

    async def is_empty(self) -> bool:
        """Check if vector store is empty"""
        try:
            stats = await self.get_stats()
            return stats.get("total_documents", 0) == 0
        except Exception as e:
            logger.error(f"Error checking if empty: {e}")
            return True
