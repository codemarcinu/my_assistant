#!/usr/bin/env python3
"""Simple API test script"""

import sys
import asyncio
sys.path.append('src/backend')

from backend.core.llm_client import llm_client

async def test_api(model_name):
    """Test our LLM API"""
    try:
        print(f"Testing LLM API with model: {model_name} ...")
        response = await llm_client.chat(
            model_name, 
            [{'role': 'user', 'content': 'Hello'}], 
            stream=False
        )
        print('API Response:', response)
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    model = sys.argv[1] if len(sys.argv) > 1 else 'mistral:7b'
    success = asyncio.run(test_api(model))
    sys.exit(0 if success else 1) 