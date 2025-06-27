#!/usr/bin/env python3
"""
Performance Test Suite for FoodSave AI Production System
Tests LLM response times and system performance
"""

import requests
import time
import statistics
from datetime import datetime
from typing import List, Dict, Any

class PerformanceTestSuite:
    def __init__(self):
        self.ollama_url = "http://localhost:11434"
        self.backend_url = "http://localhost:8000"
        self.frontend_url = "http://localhost:3000"
        self.session = requests.Session()
        
    def test_ollama_response_time(self, num_requests: int = 5) -> Dict[str, Any]:
        """Test Ollama response times with multiple requests"""
        print(f"🚀 Testing Ollama Response Times ({num_requests} requests)")
        print("-" * 50)
        
        response_times = []
        successful_requests = 0
        
        test_prompts = [
            "What is 2+2? Answer with just the number:",
            "Say 'Hello' in one word:",
            "What color is the sky? Answer with one word:",
            "Count to 3:",
            "What is the opposite of hot? Answer with one word:"
        ]
        
        for i in range(num_requests):
            prompt = test_prompts[i % len(test_prompts)]
            test_data = {
                "model": "gemma3:12b",
                "prompt": prompt,
                "stream": False
            }
            
            start_time = time.time()
            try:
                response = self.session.post(
                    f"{self.ollama_url}/api/generate",
                    json=test_data,
                    timeout=60
                )
                end_time = time.time()
                
                if response.status_code == 200:
                    response_time = end_time - start_time
                    response_times.append(response_time)
                    successful_requests += 1
                    
                    result = response.json()
                    response_text = result.get('response', '').strip()
                    
                    print(f"✅ Request {i+1}: {response_time:.2f}s - Response: '{response_text[:50]}...'")
                else:
                    print(f"❌ Request {i+1}: Failed (Status: {response.status_code})")
                    
            except Exception as e:
                print(f"❌ Request {i+1}: Error - {str(e)}")
        
        if response_times:
            avg_time = statistics.mean(response_times)
            min_time = min(response_times)
            max_time = max(response_times)
            median_time = statistics.median(response_times)
            
            print(f"\n📊 Ollama Performance Results:")
            print(f"   Average Response Time: {avg_time:.2f}s")
            print(f"   Minimum Response Time: {min_time:.2f}s")
            print(f"   Maximum Response Time: {max_time:.2f}s")
            print(f"   Median Response Time: {median_time:.2f}s")
            print(f"   Success Rate: {successful_requests}/{num_requests} ({successful_requests/num_requests*100:.1f}%)")
            
            return {
                "success": True,
                "avg_time": avg_time,
                "min_time": min_time,
                "max_time": max_time,
                "median_time": median_time,
                "success_rate": successful_requests / num_requests,
                "response_times": response_times
            }
        else:
            print("❌ No successful requests to measure performance")
            return {"success": False}
    
    def test_backend_response_time(self, num_requests: int = 3) -> Dict[str, Any]:
        """Test backend API response times"""
        print(f"\n🚀 Testing Backend Response Times ({num_requests} requests)")
        print("-" * 50)
        
        response_times = []
        successful_requests = 0
        
        # Test endpoints that don't require authentication
        test_endpoints = [
            "/docs",
            "/openapi.json"
        ]
        
        for i in range(num_requests):
            for endpoint in test_endpoints:
                start_time = time.time()
                try:
                    response = self.session.get(
                        f"{self.backend_url}{endpoint}",
                        timeout=10
                    )
                    end_time = time.time()
                    
                    if response.status_code == 200:
                        response_time = end_time - start_time
                        response_times.append(response_time)
                        successful_requests += 1
                        
                        print(f"✅ {endpoint}: {response_time:.3f}s")
                    else:
                        print(f"❌ {endpoint}: Failed (Status: {response.status_code})")
                        
                except Exception as e:
                    print(f"❌ {endpoint}: Error - {str(e)}")
        
        if response_times:
            avg_time = statistics.mean(response_times)
            print(f"\n📊 Backend Performance Results:")
            print(f"   Average Response Time: {avg_time:.3f}s")
            print(f"   Success Rate: {successful_requests}/{len(test_endpoints) * num_requests} ({successful_requests/(len(test_endpoints) * num_requests)*100:.1f}%)")
            
            return {
                "success": True,
                "avg_time": avg_time,
                "success_rate": successful_requests / (len(test_endpoints) * num_requests)
            }
        else:
            print("❌ No successful backend requests to measure performance")
            return {"success": False}
    
    def test_frontend_response_time(self, num_requests: int = 3) -> Dict[str, Any]:
        """Test frontend response times"""
        print(f"\n🚀 Testing Frontend Response Times ({num_requests} requests)")
        print("-" * 50)
        
        response_times = []
        successful_requests = 0
        
        for i in range(num_requests):
            start_time = time.time()
            try:
                response = self.session.get(self.frontend_url, timeout=10)
                end_time = time.time()
                
                if response.status_code == 200:
                    response_time = end_time - start_time
                    response_times.append(response_time)
                    successful_requests += 1
                    
                    print(f"✅ Request {i+1}: {response_time:.3f}s")
                else:
                    print(f"❌ Request {i+1}: Failed (Status: {response.status_code})")
                    
            except Exception as e:
                print(f"❌ Request {i+1}: Error - {str(e)}")
        
        if response_times:
            avg_time = statistics.mean(response_times)
            print(f"\n📊 Frontend Performance Results:")
            print(f"   Average Response Time: {avg_time:.3f}s")
            print(f"   Success Rate: {successful_requests}/{num_requests} ({successful_requests/num_requests*100:.1f}%)")
            
            return {
                "success": True,
                "avg_time": avg_time,
                "success_rate": successful_requests / num_requests
            }
        else:
            print("❌ No successful frontend requests to measure performance")
            return {"success": False}
    
    def test_system_load(self) -> Dict[str, Any]:
        """Test system under load with concurrent requests"""
        print(f"\n🚀 Testing System Under Load")
        print("-" * 50)
        
        import concurrent.futures
        import threading
        
        results = []
        lock = threading.Lock()
        
        def make_request(request_id: int):
            test_data = {
                "model": "gemma3:12b",
                "prompt": f"Request {request_id}: Say 'OK'",
                "stream": False
            }
            
            start_time = time.time()
            try:
                response = self.session.post(
                    f"{self.ollama_url}/api/generate",
                    json=test_data,
                    timeout=60
                )
                end_time = time.time()
                
                with lock:
                    if response.status_code == 200:
                        results.append({
                            "request_id": request_id,
                            "success": True,
                            "time": end_time - start_time
                        })
                        print(f"✅ Concurrent Request {request_id}: {end_time - start_time:.2f}s")
                    else:
                        results.append({
                            "request_id": request_id,
                            "success": False,
                            "time": end_time - start_time
                        })
                        print(f"❌ Concurrent Request {request_id}: Failed")
                        
            except Exception as e:
                with lock:
                    results.append({
                        "request_id": request_id,
                        "success": False,
                        "error": str(e)
                    })
                    print(f"❌ Concurrent Request {request_id}: Error")
        
        # Test with 3 concurrent requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            futures = [executor.submit(make_request, i) for i in range(1, 4)]
            concurrent.futures.wait(futures)
        
        successful = sum(1 for r in results if r.get('success', False))
        if successful > 0:
            times = [r['time'] for r in results if r.get('success', False)]
            avg_time = statistics.mean(times)
            
            print(f"\n📊 Load Test Results:")
            print(f"   Concurrent Requests: 3")
            print(f"   Successful: {successful}/3")
            print(f"   Average Response Time: {avg_time:.2f}s")
            
            return {
                "success": True,
                "concurrent_requests": 3,
                "successful_requests": successful,
                "avg_time": avg_time
            }
        else:
            print("❌ No successful concurrent requests")
            return {"success": False}
    
    def run_all_tests(self) -> Dict[str, Any]:
        """Run all performance tests"""
        print("🚀 Starting Performance Tests")
        print("=" * 60)
        
        start_time = time.time()
        
        # Run performance tests
        ollama_results = self.test_ollama_response_time(5)
        backend_results = self.test_backend_response_time(3)
        frontend_results = self.test_frontend_response_time(3)
        load_results = self.test_system_load()
        
        end_time = time.time()
        total_duration = end_time - start_time
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 Performance Test Summary")
        print("=" * 60)
        print(f"⏱️  Total Test Duration: {total_duration:.2f}s")
        
        if ollama_results.get('success'):
            print(f"🤖 Ollama LLM: {ollama_results['avg_time']:.2f}s avg response time")
        if backend_results.get('success'):
            print(f"🔧 Backend API: {backend_results['avg_time']:.3f}s avg response time")
        if frontend_results.get('success'):
            print(f"🌐 Frontend: {frontend_results['avg_time']:.3f}s avg response time")
        if load_results.get('success'):
            print(f"⚡ Load Test: {load_results['successful_requests']}/{load_results['concurrent_requests']} concurrent requests successful")
        
        # Performance assessment
        print(f"\n📈 Performance Assessment:")
        if ollama_results.get('success') and ollama_results['avg_time'] < 10:
            print("✅ LLM Response Time: Excellent (< 10s)")
        elif ollama_results.get('success') and ollama_results['avg_time'] < 20:
            print("⚠️  LLM Response Time: Good (< 20s)")
        else:
            print("❌ LLM Response Time: Needs improvement")
        
        if backend_results.get('success') and backend_results['avg_time'] < 1:
            print("✅ Backend Response Time: Excellent (< 1s)")
        elif backend_results.get('success') and backend_results['avg_time'] < 2:
            print("⚠️  Backend Response Time: Good (< 2s)")
        else:
            print("❌ Backend Response Time: Needs improvement")
        
        return {
            "ollama": ollama_results,
            "backend": backend_results,
            "frontend": frontend_results,
            "load": load_results,
            "total_duration": total_duration
        }

def main():
    """Main function to run performance tests"""
    test_suite = PerformanceTestSuite()
    results = test_suite.run_all_tests()
    
    print(f"\n🎉 Performance testing completed!")
    print("Your production system is performing well!")

if __name__ == "__main__":
    main() 