#!/usr/bin/env python3
"""
Test script for GPU Vector Store functionality
"""

import numpy as np
import logging
import asyncio

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_gpu_vector_store():
    """Test GPU Vector Store functionality"""
    try:
        from src.backend.core.vector_store_gpu import GPUVectorStore
        
        # Test VectorStore with GPU
        vs = GPUVectorStore(dimension=768, use_gpu=True)
        
        # Check if GPU is actually being used
        stats = vs._stats
        gpu_enabled = stats.get("gpu_enabled", False)
        
        logger.info(f"GPU VectorStore enabled: {gpu_enabled}")
        logger.info(f"Device: {vs.device}")
        
        # Test adding documents
        test_docs = [
            ("This is a test document about AI", {"source": "test1"}),
            ("Another document about machine learning", {"source": "test2"}),
            ("A third document about deep learning", {"source": "test3"}),
        ]
        
        # Create test embeddings
        test_embeddings = [
            np.random.random(768).astype(np.float32),
            np.random.random(768).astype(np.float32),
            np.random.random(768).astype(np.float32),
        ]
        
        # Add documents
        for i, (text, metadata) in enumerate(test_docs):
            from src.backend.core.vector_store_gpu import DocumentChunk
            doc = DocumentChunk(
                id=f"test_doc_{i}",
                content=text,
                metadata=metadata,
                embedding=test_embeddings[i]
            )
            await vs.add_documents([doc])
        
        logger.info(f"Added {len(test_docs)} documents")
        
        # Test search
        query_embedding = np.random.random(768).astype(np.float32)
        results = await vs.search(query_embedding, k=2)
        
        logger.info(f"Search returned {len(results)} results")
        for doc, similarity in results:
            logger.info(f"  - {doc.id}: {similarity:.4f}")
        
        # Test statistics
        stats = await vs.get_stats()
        logger.info(f"Vector store stats: {stats}")
        
        if gpu_enabled:
            logger.info("✅ GPU VectorStore test PASSED")
        else:
            logger.warning("⚠️ GPU VectorStore using CPU fallback")
            
        return gpu_enabled
        
    except Exception as e:
        logger.error(f"❌ GPU VectorStore test FAILED: {e}")
        return False

async def test_performance():
    """Test performance comparison"""
    try:
        from src.backend.core.vector_store_gpu import GPUVectorStore
        import time
        
        # Create vector store
        vs = GPUVectorStore(dimension=768, use_gpu=True)
        
        # Generate test data
        num_docs = 1000
        dimension = 768
        
        logger.info(f"Generating {num_docs} test documents...")
        
        # Create test embeddings
        embeddings = np.random.random((num_docs, dimension)).astype(np.float32)
        
        # Add documents
        start_time = time.time()
        for i in range(num_docs):
            from src.backend.core.vector_store_gpu import DocumentChunk
            doc = DocumentChunk(
                id=f"perf_doc_{i}",
                content=f"Test document {i}",
                metadata={"source": f"perf_test_{i}"},
                embedding=embeddings[i]
            )
            await vs.add_documents([doc])
        
        add_time = time.time() - start_time
        logger.info(f"Added {num_docs} documents in {add_time:.2f}s")
        
        # Test search performance
        query_embedding = np.random.random(dimension).astype(np.float32)
        
        start_time = time.time()
        results = await vs.search(query_embedding, k=10)
        search_time = time.time() - start_time
        
        logger.info(f"Search completed in {search_time:.4f}s")
        logger.info(f"Found {len(results)} results")
        
        # Performance metrics
        docs_per_second = num_docs / add_time
        search_time_ms = search_time * 1000
        
        logger.info(f"Performance metrics:")
        logger.info(f"  - Add rate: {docs_per_second:.1f} docs/sec")
        logger.info(f"  - Search time: {search_time_ms:.2f}ms")
        logger.info(f"  - GPU enabled: {vs._stats.get('gpu_enabled', False)}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Performance test FAILED: {e}")
        return False

async def main():
    """Main test function"""
    logger.info("🧪 Testing GPU Vector Store functionality...")
    
    # Test basic functionality
    basic_ok = await test_gpu_vector_store()
    
    # Test performance
    perf_ok = await test_performance()
    
    # Summary
    logger.info("\n📊 Test Results:")
    logger.info(f"Basic functionality: {'✅ PASS' if basic_ok else '❌ FAIL'}")
    logger.info(f"Performance test: {'✅ PASS' if perf_ok else '❌ FAIL'}")
    
    if basic_ok and perf_ok:
        logger.info("🎉 All GPU Vector Store tests passed!")
    else:
        logger.info("⚠️ Some tests failed. Check the logs above for details.")

if __name__ == "__main__":
    asyncio.run(main()) 