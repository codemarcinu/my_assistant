#!/usr/bin/env python3
"""
Simple test script to verify knowledge verification functionality
"""

import asyncio
import sys
import os
import pytest

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

@pytest.mark.asyncio
async def test_knowledge_verification():
    """Test the knowledge verification functionality"""
    try:
        from backend.integrations.web_search import web_search
        from backend.agents.search_agent import SearchAgent
        from backend.core.vector_store import VectorStore
        from backend.core.hybrid_llm_client import hybrid_llm_client
        
        print("🔍 Testing Knowledge Verification System")
        print("=" * 50)
        
        # Test 1: Basic web search
        print("\n1. Testing basic web search...")
        try:
            results = await web_search.search("artificial intelligence", max_results=3)
            print(f"✅ Found {len(results)} results")
            for i, result in enumerate(results, 1):
                print(f"   {i}. {result['title']} (Verified: {result.get('knowledge_verified', False)})")
        except Exception as e:
            print(f"❌ Basic search failed: {e}")
        
        # Test 2: Search with verification
        print("\n2. Testing search with verification...")
        try:
            verification_result = await web_search.search_with_verification("machine learning", max_results=3)
            print(f"✅ Found {verification_result['total_results']} results")
            print(f"📊 Knowledge verification score: {verification_result['knowledge_verification_score']:.2f}")
            print(f"🔄 Cached: {verification_result['cached']}")
            
            verified_count = sum(1 for r in verification_result['results'] if r['knowledge_verified'])
            print(f"✅ Verified sources: {verified_count}/{len(verification_result['results'])}")
        except Exception as e:
            print(f"❌ Verification search failed: {e}")
        
        # Test 3: SearchAgent with knowledge verification
        print("\n3. Testing SearchAgent with knowledge verification...")
        try:
            vector_store = VectorStore()
            search_agent = SearchAgent(
                vector_store=vector_store,
                llm_client=hybrid_llm_client
            )
            
            response = await search_agent.process({
                "query": "Python programming language",
                "use_perplexity": False,
                "verify_knowledge": True
            })
            
            print(f"✅ SearchAgent response success: {response.success}")
            
            # Consume the stream
            result_text = ""
            async for chunk in response.text_stream:
                result_text += chunk
            
            print(f"📝 Response length: {len(result_text)} characters")
            if "Wskaźnik wiarygodności" in result_text:
                print("✅ Knowledge verification information found in response")
            else:
                print("⚠️ No knowledge verification information in response")
                
        except Exception as e:
            print(f"❌ SearchAgent test failed: {e}")
        
        # Test 4: Knowledge claim verification
        print("\n4. Testing knowledge claim verification...")
        try:
            verification_result = await search_agent.verify_knowledge_claim(
                "Python is a programming language",
                "programming languages"
            )
            
            print(f"✅ Claim: {verification_result['claim']}")
            print(f"📊 Verified: {verification_result['verified']}")
            print(f"🎯 Confidence score: {verification_result['confidence_score']:.2f}")
            print(f"📈 High confidence sources: {verification_result['high_confidence_sources']}")
            print(f"📊 Total sources: {verification_result['total_sources']}")
            
        except Exception as e:
            print(f"❌ Knowledge claim verification failed: {e}")
        
        print("\n" + "=" * 50)
        print("🎉 Knowledge verification system test completed!")
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Make sure all dependencies are installed")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    asyncio.run(test_knowledge_verification()) 