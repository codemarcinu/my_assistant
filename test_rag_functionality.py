#!/usr/bin/env python3
"""
Simple test script to verify RAG database management functionality
"""

import asyncio
import sys
import os
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from backend.core.rag_integration import RAGDatabaseIntegration
from backend.core.rag_document_processor import RAGDocumentProcessor


async def test_rag_functionality():
    """Test basic RAG functionality"""
    print("Testing RAG Database Management Functionality...")
    
    # Initialize RAG components
    rag_processor = RAGDocumentProcessor()
    rag_integration = RAGDatabaseIntegration(rag_processor)
    
    print("✓ RAG components initialized")
    
    # Test getting stats
    try:
        stats = await rag_integration.get_rag_stats()
        print(f"✓ RAG Stats: {stats}")
    except Exception as e:
        print(f"✗ Error getting RAG stats: {e}")
    
    # Test listing directories
    try:
        directories = await rag_integration.list_rag_directories()
        print(f"✓ Directories: {directories}")
    except Exception as e:
        print(f"✗ Error listing directories: {e}")
    
    # Test creating directory
    try:
        success = await rag_integration.create_rag_directory("test_directory")
        print(f"✓ Create directory result: {success}")
    except Exception as e:
        print(f"✗ Error creating directory: {e}")
    
    # Test searching documents
    try:
        search_results = await rag_integration.search_documents_in_rag("test query", k=5)
        print(f"✓ Search results: {search_results}")
    except Exception as e:
        print(f"✗ Error searching documents: {e}")
    
    # Test deleting directory
    try:
        count = await rag_integration.delete_rag_directory("test_directory", None)
        print(f"✓ Delete directory result: {count}")
    except Exception as e:
        print(f"✗ Error deleting directory: {e}")
    
    print("\nRAG Database Management test completed!")


if __name__ == "__main__":
    asyncio.run(test_rag_functionality()) 