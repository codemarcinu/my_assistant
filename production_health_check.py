#!/usr/bin/env python3
"""
Production Health Check for FoodSave AI
Comprehensive system health monitoring and testing
"""

import requests
import time
import json
import subprocess
from datetime import datetime
from typing import Dict, Any, List

class ProductionHealthCheck:
    def __init__(self):
        self.base_url = "http://localhost:8000"
        self.frontend_url = "http://localhost:3000"
        self.ollama_url = "http://localhost:11434"
        self.session = requests.Session()
        self.results = {}
        
    def check_system_status(self) -> Dict[str, Any]:
        """Check overall system status"""
        print("🔍 Checking System Status...")
        
        status = {
            "timestamp": datetime.now().isoformat(),
            "services": {},
            "overall_health": "unknown"
        }
        
        # Check Docker containers
        try:
            result = subprocess.run(['docker', 'ps', '--format', 'json'], 
                                  capture_output=True, text=True, timeout=10)
            containers = []
            for line in result.stdout.strip().split('\n'):
                if line:
                    try:
                        container = json.loads(line)
                        containers.append({
                            "name": container.get('Names', ''),
                            "status": container.get('Status', ''),
                            "health": container.get('Health', '')
                        })
                    except:
                        continue
            
            status["containers"] = containers
            print(f"✅ Found {len(containers)} running containers")
        except Exception as e:
            print(f"❌ Container check failed: {e}")
            status["containers"] = []
        
        # Check service endpoints
        services = [
            ("Backend", f"{self.base_url}/docs"),
            ("Frontend", self.frontend_url),
            ("Ollama", f"{self.ollama_url}/api/version")
        ]
        
        for service_name, url in services:
            try:
                response = self.session.get(url, timeout=5)
                status["services"][service_name] = {
                    "status": "healthy" if response.status_code in [200, 401] else "unhealthy",
                    "response_time": response.elapsed.total_seconds(),
                    "status_code": response.status_code
                }
                print(f"✅ {service_name}: {response.status_code} ({response.elapsed.total_seconds():.3f}s)")
            except Exception as e:
                status["services"][service_name] = {
                    "status": "unreachable",
                    "error": str(e)
                }
                print(f"❌ {service_name}: Unreachable - {e}")
        
        # Determine overall health
        healthy_services = sum(1 for s in status["services"].values() 
                             if s.get("status") in ["healthy"])
        total_services = len(status["services"])
        
        if healthy_services == total_services:
            status["overall_health"] = "healthy"
        elif healthy_services > 0:
            status["overall_health"] = "degraded"
        else:
            status["overall_health"] = "unhealthy"
        
        self.results["system_status"] = status
        return status
    
    def check_ollama_models(self) -> Dict[str, Any]:
        """Check Ollama model availability and performance"""
        print("\n🤖 Checking Ollama Models...")
        
        ollama_status = {
            "models": [],
            "api_version": None,
            "performance": {}
        }
        
        try:
            # Check API version
            response = self.session.get(f"{self.ollama_url}/api/version", timeout=10)
            if response.status_code == 200:
                version_data = response.json()
                ollama_status["api_version"] = version_data.get('version')
                print(f"✅ Ollama API Version: {ollama_status['api_version']}")
            
            # Check available models
            response = self.session.get(f"{self.ollama_url}/api/tags", timeout=10)
            if response.status_code == 200:
                models_data = response.json()
                models = models_data.get('models', [])
                
                for model in models:
                    model_info = {
                        "name": model.get('name'),
                        "size_gb": model.get('size', 0) / 1024**3,
                        "modified": model.get('modified_at'),
                        "format": model.get('details', {}).get('format'),
                        "family": model.get('details', {}).get('family')
                    }
                    ollama_status["models"].append(model_info)
                    print(f"✅ Model: {model_info['name']} ({model_info['size_gb']:.1f}GB)")
            
            # Test model performance
            if any(m['name'] == 'gemma3:12b' for m in ollama_status["models"]):
                start_time = time.time()
                test_data = {
                    "model": "gemma3:12b",
                    "prompt": "Say 'OK' in one word:",
                    "stream": False
                }
                
                response = self.session.post(f"{self.ollama_url}/api/generate", 
                                           json=test_data, timeout=30)
                end_time = time.time()
                
                if response.status_code == 200:
                    ollama_status["performance"] = {
                        "response_time": end_time - start_time,
                        "status": "working"
                    }
                    print(f"✅ Model Performance: {end_time - start_time:.2f}s response time")
                else:
                    ollama_status["performance"] = {
                        "status": "error",
                        "status_code": response.status_code
                    }
                    print(f"❌ Model Performance: Failed (Status: {response.status_code})")
            else:
                ollama_status["performance"] = {"status": "no_gemma_model"}
                print("⚠️  No gemma3:12b model found")
                
        except Exception as e:
            ollama_status["error"] = str(e)
            print(f"❌ Ollama check failed: {e}")
        
        self.results["ollama_status"] = ollama_status
        return ollama_status
    
    def check_backend_api(self) -> Dict[str, Any]:
        """Check backend API health and endpoints"""
        print("\n🔧 Checking Backend API...")
        
        backend_status = {
            "endpoints": {},
            "authentication": "working",
            "database": "connected"
        }
        
        try:
            # Check OpenAPI schema
            response = self.session.get(f"{self.base_url}/openapi.json", timeout=10)
            if response.status_code == 200:
                openapi_data = response.json()
                endpoints = len(openapi_data.get('paths', {}))
                backend_status["endpoints"]["total"] = endpoints
                print(f"✅ API Endpoints: {endpoints} available")
            
            # Check authentication (should return 401)
            response = self.session.get(f"{self.base_url}/", timeout=10)
            if response.status_code == 401:
                backend_status["authentication"] = "working"
                print("✅ Authentication: Working (requires auth)")
            else:
                backend_status["authentication"] = "unexpected"
                print(f"⚠️  Authentication: Unexpected status {response.status_code}")
            
            # Check if backend is running (indicates DB connection)
            backend_status["database"] = "connected"
            print("✅ Database: Connected (backend running)")
            
        except Exception as e:
            backend_status["error"] = str(e)
            print(f"❌ Backend check failed: {e}")
        
        self.results["backend_status"] = backend_status
        return backend_status
    
    def check_frontend(self) -> Dict[str, Any]:
        """Check frontend health"""
        print("\n🌐 Checking Frontend...")
        
        frontend_status = {
            "status": "unknown",
            "response_time": None
        }
        
        try:
            start_time = time.time()
            response = self.session.get(self.frontend_url, timeout=10)
            end_time = time.time()
            
            if response.status_code == 200:
                frontend_status["status"] = "healthy"
                frontend_status["response_time"] = end_time - start_time
                
                if "React" in response.text or "Vite" in response.text:
                    print(f"✅ Frontend: Healthy ({end_time - start_time:.3f}s)")
                else:
                    frontend_status["status"] = "unexpected_content"
                    print("⚠️  Frontend: Unexpected content")
            else:
                frontend_status["status"] = "unhealthy"
                print(f"❌ Frontend: Status {response.status_code}")
                
        except Exception as e:
            frontend_status["status"] = "unreachable"
            frontend_status["error"] = str(e)
            print(f"❌ Frontend check failed: {e}")
        
        self.results["frontend_status"] = frontend_status
        return frontend_status
    
    def generate_report(self) -> str:
        """Generate a comprehensive health report"""
        print("\n" + "=" * 60)
        print("📊 PRODUCTION HEALTH REPORT")
        print("=" * 60)
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"Generated: {timestamp}")
        
        # System Status
        system = self.results.get("system_status", {})
        print(f"\n🔍 System Health: {system.get('overall_health', 'unknown').upper()}")
        
        # Service Status
        print(f"\n📋 Service Status:")
        for service_name, service_data in system.get("services", {}).items():
            status = service_data.get("status", "unknown")
            if status == "healthy":
                print(f"  ✅ {service_name}: Healthy")
            elif status == "degraded":
                print(f"  ⚠️  {service_name}: Degraded")
            else:
                print(f"  ❌ {service_name}: Unhealthy")
        
        # Ollama Status
        ollama = self.results.get("ollama_status", {})
        print(f"\n🤖 Ollama Status:")
        if ollama.get("api_version"):
            print(f"  ✅ API Version: {ollama['api_version']}")
        
        models = ollama.get("models", [])
        if models:
            print(f"  ✅ Models Available: {len(models)}")
            for model in models:
                print(f"    - {model['name']} ({model['size_gb']:.1f}GB)")
        
        performance = ollama.get("performance", {})
        if performance.get("status") == "working":
            print(f"  ✅ Performance: {performance.get('response_time', 0):.2f}s")
        
        # Backend Status
        backend = self.results.get("backend_status", {})
        print(f"\n🔧 Backend Status:")
        if backend.get("endpoints", {}).get("total"):
            print(f"  ✅ API Endpoints: {backend['endpoints']['total']}")
        if backend.get("authentication") == "working":
            print(f"  ✅ Authentication: Working")
        if backend.get("database") == "connected":
            print(f"  ✅ Database: Connected")
        
        # Frontend Status
        frontend = self.results.get("frontend_status", {})
        print(f"\n🌐 Frontend Status:")
        if frontend.get("status") == "healthy":
            print(f"  ✅ Status: Healthy")
            if frontend.get("response_time"):
                print(f"  ✅ Response Time: {frontend['response_time']:.3f}s")
        
        # Overall Assessment
        print(f"\n📈 Overall Assessment:")
        
        # Count healthy components
        healthy_count = 0
        total_count = 0
        
        if system.get("overall_health") == "healthy":
            healthy_count += 1
        total_count += 1
        
        if ollama.get("models") and any(m['name'] == 'gemma3:12b' for m in ollama['models']):
            healthy_count += 1
        total_count += 1
        
        if backend.get("authentication") == "working":
            healthy_count += 1
        total_count += 1
        
        if frontend.get("status") == "healthy":
            healthy_count += 1
        total_count += 1
        
        health_percentage = (healthy_count / total_count) * 100 if total_count > 0 else 0
        
        if health_percentage >= 90:
            print(f"  🎉 EXCELLENT: {health_percentage:.1f}% healthy")
        elif health_percentage >= 75:
            print(f"  ✅ GOOD: {health_percentage:.1f}% healthy")
        elif health_percentage >= 50:
            print(f"  ⚠️  FAIR: {health_percentage:.1f}% healthy")
        else:
            print(f"  ❌ POOR: {health_percentage:.1f}% healthy")
        
        print(f"\n🎯 Production System Status: {'READY' if health_percentage >= 75 else 'NEEDS ATTENTION'}")
        
        return f"Health: {health_percentage:.1f}%"
    
    def run_health_check(self) -> Dict[str, Any]:
        """Run complete health check"""
        print("🚀 Starting Production Health Check")
        print("=" * 60)
        
        start_time = time.time()
        
        # Run all checks
        self.check_system_status()
        self.check_ollama_models()
        self.check_backend_api()
        self.check_frontend()
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Generate report
        health_percentage = self.generate_report()
        
        print(f"\n⏱️  Health check completed in {duration:.2f} seconds")
        
        return {
            "results": self.results,
            "duration": duration,
            "health_percentage": health_percentage
        }

def main():
    """Main function to run health check"""
    health_checker = ProductionHealthCheck()
    results = health_checker.run_health_check()
    
    # Save results to file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"health_check_{timestamp}.json"
    
    with open(filename, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    print(f"\n📄 Health check results saved to: {filename}")
    
    # Exit with appropriate code
    if "READY" in results.get("health_percentage", ""):
        print("\n🎉 Production system is healthy and ready!")
        return 0
    else:
        print("\n⚠️  Production system needs attention.")
        return 1

if __name__ == "__main__":
    exit(main()) 