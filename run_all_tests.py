#!/usr/bin/env python3
"""
Master Test Runner for FoodSave AI Production System
Runs all tests: E2E, Performance, and Health Check
"""

import subprocess
import time
import json
from datetime import datetime
from typing import Dict, Any

def run_test(test_name: str, script_path: str) -> Dict[str, Any]:
    """Run a test script and capture results"""
    print(f"\n{'='*60}")
    print(f"🚀 Running {test_name}")
    print(f"{'='*60}")
    
    start_time = time.time()
    
    try:
        result = subprocess.run(['python3', script_path], 
                              capture_output=True, text=True, timeout=300)
        
        end_time = time.time()
        duration = end_time - start_time
        
        return {
            "test_name": test_name,
            "script": script_path,
            "success": result.returncode == 0,
            "duration": duration,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "return_code": result.returncode
        }
        
    except subprocess.TimeoutExpired:
        return {
            "test_name": test_name,
            "script": script_path,
            "success": False,
            "duration": 300,
            "error": "Timeout after 5 minutes",
            "return_code": -1
        }
    except Exception as e:
        return {
            "test_name": test_name,
            "script": script_path,
            "success": False,
            "error": str(e),
            "return_code": -1
        }

def generate_summary_report(results: list) -> str:
    """Generate a summary report of all test results"""
    print(f"\n{'='*60}")
    print("📊 COMPREHENSIVE TEST SUMMARY")
    print(f"{'='*60}")
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"Generated: {timestamp}")
    
    # Calculate statistics
    total_tests = len(results)
    successful_tests = sum(1 for r in results if r['success'])
    total_duration = sum(r['duration'] for r in results)
    
    print(f"\n📈 Test Statistics:")
    print(f"   Total Tests: {total_tests}")
    print(f"   Successful: {successful_tests}")
    print(f"   Failed: {total_tests - successful_tests}")
    print(f"   Success Rate: {(successful_tests/total_tests)*100:.1f}%")
    print(f"   Total Duration: {total_duration:.2f}s")
    
    # Individual test results
    print(f"\n📋 Individual Test Results:")
    for result in results:
        status = "✅ PASS" if result['success'] else "❌ FAIL"
        print(f"   {status} - {result['test_name']} ({result['duration']:.2f}s)")
        
        if not result['success'] and result.get('error'):
            print(f"      Error: {result['error']}")
    
    # Overall assessment
    print(f"\n🎯 Overall Assessment:")
    if successful_tests == total_tests:
        print("   🎉 ALL TESTS PASSED - Production system is fully operational!")
        overall_status = "EXCELLENT"
    elif successful_tests >= total_tests * 0.8:
        print("   ✅ MOST TESTS PASSED - Production system is operational with minor issues")
        overall_status = "GOOD"
    elif successful_tests >= total_tests * 0.6:
        print("   ⚠️  SOME TESTS FAILED - Production system needs attention")
        overall_status = "FAIR"
    else:
        print("   ❌ MANY TESTS FAILED - Production system has significant issues")
        overall_status = "POOR"
    
    return overall_status

def main():
    """Main function to run all tests"""
    print("🚀 Starting Comprehensive Production Testing")
    print("This will run E2E, Performance, and Health Check tests")
    
    # Define test scripts
    tests = [
        ("E2E Tests", "e2e_test_production.py"),
        ("Performance Tests", "performance_test.py"),
        ("Health Check", "production_health_check.py")
    ]
    
    # Run all tests
    results = []
    for test_name, script_path in tests:
        result = run_test(test_name, script_path)
        results.append(result)
        
        # Print test output
        if result['stdout']:
            print(result['stdout'])
        if result['stderr']:
            print(f"STDERR: {result['stderr']}")
    
    # Generate summary
    overall_status = generate_summary_report(results)
    
    # Save comprehensive results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"comprehensive_test_results_{timestamp}.json"
    
    with open(filename, 'w') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "overall_status": overall_status,
            "results": results
        }, f, indent=2, default=str)
    
    print(f"\n📄 Comprehensive test results saved to: {filename}")
    
    # Final recommendation
    print(f"\n🎯 Final Recommendation:")
    if overall_status == "EXCELLENT":
        print("   🎉 Your production system is ready for deployment!")
        print("   All components are working correctly and performing well.")
        return 0
    elif overall_status == "GOOD":
        print("   ✅ Your production system is operational.")
        print("   Minor issues detected but system is functional.")
        return 0
    elif overall_status == "FAIR":
        print("   ⚠️  Your production system needs attention.")
        print("   Some components have issues that should be addressed.")
        return 1
    else:
        print("   ❌ Your production system has significant issues.")
        print("   Major problems detected that need immediate attention.")
        return 1

if __name__ == "__main__":
    exit(main()) 