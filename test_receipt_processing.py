#!/usr/bin/env python3
"""
Test script for receipt processing workflow
"""

import requests
import time
import json
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8000"
TEST_IMAGE_PATH = "tests/fixtures/test_receipt.jpg"

def test_receipt_processing():
    """Test the complete receipt processing workflow"""
    
    print("🧪 Testing Receipt Processing Workflow")
    print("=" * 50)
    
    # Step 1: Check system health
    print("\n1. Checking system health...")
    health_response = requests.get(f"{BASE_URL}/api/v3/receipts/health")
    if health_response.status_code == 200:
        health_data = health_response.json()
        print(f"✅ System healthy: {health_data['data']['status']}")
        print(f"   Workers available: {health_data['data']['workers_available']}")
        print(f"   Tasks registered: {health_data['data']['tasks_registered']}")
    else:
        print(f"❌ Health check failed: {health_response.status_code}")
        return False
    
    # Step 2: Upload receipt
    print("\n2. Uploading receipt...")
    if not Path(TEST_IMAGE_PATH).exists():
        print(f"❌ Test image not found: {TEST_IMAGE_PATH}")
        return False
    
    with open(TEST_IMAGE_PATH, 'rb') as f:
        files = {'file': ('test_receipt.jpg', f, 'image/jpeg')}
        data = {'session_id': 'test_session_123'}
        
        upload_response = requests.post(
            f"{BASE_URL}/api/v3/receipts/process",
            files=files,
            data=data
        )
    
    if upload_response.status_code == 202:
        upload_data = upload_response.json()
        job_id = upload_data['data']['job_id']
        print(f"✅ Receipt uploaded successfully")
        print(f"   Job ID: {job_id}")
        print(f"   Filename: {upload_data['data']['filename']}")
        print(f"   File size: {upload_data['data']['file_size']} bytes")
    else:
        print(f"❌ Upload failed: {upload_response.status_code}")
        print(f"   Response: {upload_response.text}")
        return False
    
    # Step 3: Monitor task progress
    print("\n3. Monitoring task progress...")
    max_attempts = 30  # 30 seconds
    attempt = 0
    
    while attempt < max_attempts:
        status_response = requests.get(f"{BASE_URL}/api/v3/receipts/status/{job_id}")
        
        if status_response.status_code == 200:
            status_data = status_response.json()
            task_status = status_data['data']['status']
            
            print(f"   Attempt {attempt + 1}: Status = {task_status}")
            
            if task_status == 'SUCCESS':
                print("✅ Task completed successfully!")
                result = status_data['data'].get('result', {})
                print(f"   Processing time: {result.get('processing_time', 'N/A')}")
                print(f"   OCR text length: {len(result.get('ocr_text', ''))}")
                return True
            elif task_status == 'FAILURE':
                print("❌ Task failed!")
                error = status_data['data'].get('error', 'Unknown error')
                print(f"   Error: {error}")
                return False
            elif task_status == 'PROGRESS':
                progress_info = status_data['data']
                step = progress_info.get('step', 'Unknown')
                progress = progress_info.get('progress', 0)
                message = progress_info.get('message', '')
                print(f"   Progress: {progress}% - {step}: {message}")
            elif task_status in ['PENDING', 'STARTED']:
                print(f"   Task is {task_status.lower()}, waiting...")
            
        else:
            print(f"❌ Status check failed: {status_response.status_code}")
            print(f"   Response: {status_response.text}")
            return False
        
        time.sleep(1)
        attempt += 1
    
    print("❌ Task timed out after 30 seconds")
    return False

def test_frontend_integration():
    """Test frontend accessibility"""
    print("\n4. Testing frontend integration...")
    
    try:
        frontend_response = requests.get("http://localhost:3000", timeout=5)
        if frontend_response.status_code == 200:
            print("✅ Frontend is accessible")
            return True
        else:
            print(f"❌ Frontend returned status: {frontend_response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Frontend not accessible: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting Receipt Processing System Test")
    print("=" * 60)
    
    # Test receipt processing
    receipt_success = test_receipt_processing()
    
    # Test frontend
    frontend_success = test_frontend_integration()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    print(f"Receipt Processing: {'✅ PASS' if receipt_success else '❌ FAIL'}")
    print(f"Frontend Integration: {'✅ PASS' if frontend_success else '❌ FAIL'}")
    
    if receipt_success and frontend_success:
        print("\n🎉 All tests passed! The receipt processing system is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Please check the logs for more details.") 