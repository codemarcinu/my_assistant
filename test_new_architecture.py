#!/usr/bin/env python3
"""
Test nowej architektury systemu agentowego
Zgodnie z planem ewolucji - Testy implementacji
"""

import asyncio
import logging
import sys
import os
from datetime import datetime

# Dodaj ścieżkę do modułów
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from backend.core.database import get_db
from backend.core.database_migrations import run_all_migrations
from backend.agents.orchestrator import Orchestrator
from backend.agents.memory_manager import MemoryManager
from backend.agents.intent_detector import SimpleIntentDetector
from backend.agents.agent_router import AgentRouter
from backend.agents.tools.registry import initialize_tool_registry
from backend.core.profile_manager import ProfileManager

# Konfiguracja logowania
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def test_database_migrations():
    """Test migracji bazy danych"""
    logger.info("Testing database migrations...")
    try:
        await run_all_migrations()
        logger.info("✅ Database migrations completed successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Database migrations failed: {e}")
        return False


async def test_tool_registry():
    """Test rejestru narzędzi"""
    logger.info("Testing tool registry...")
    try:
        registry = initialize_tool_registry()
        tools = registry.get_all_tools()
        
        expected_tools = [
            "get_weather_forecast",
            "search_knowledge_base", 
            "find_recipes",
            "get_pantry_items",
            "web_search"
        ]
        
        for tool_name in expected_tools:
            if tool_name not in tools:
                logger.error(f"❌ Tool {tool_name} not found in registry")
                return False
        
        logger.info(f"✅ Tool registry initialized with {len(tools)} tools")
        return True
        
    except Exception as e:
        logger.error(f"❌ Tool registry test failed: {e}")
        return False


async def test_memory_manager():
    """Test menedżera pamięci"""
    logger.info("Testing memory manager...")
    try:
        memory_manager = MemoryManager(
            enable_persistence=True,
            enable_semantic_cache=True
        )
        await memory_manager.initialize()
        
        # Test tworzenia kontekstu
        session_id = f"test_session_{datetime.now().timestamp()}"
        context = await memory_manager.get_context(session_id)
        
        # Test dodawania wiadomości
        context.add_message("user", "Test message 1")
        context.add_message("assistant", "Test response 1")
        context.add_message("user", "Test message 2")
        context.add_message("assistant", "Test response 2")
        
        # Test aktualizacji kontekstu
        await memory_manager.update_context(context, {"test_data": "value"})
        
        # Test pobierania zoptymalizowanego kontekstu
        optimized_context = await memory_manager.get_optimized_context(session_id)
        
        logger.info(f"✅ Memory manager test completed. Context length: {len(optimized_context)}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Memory manager test failed: {e}")
        return False


async def test_planner():
    """Test planisty"""
    logger.info("Testing planner...")
    try:
        from backend.agents.planner import Planner
        
        planner = Planner()
        await planner.initialize()
        
        # Test prostego zapytania
        simple_query = "Jaka jest pogoda w Warszawie?"
        plan = await planner.create_plan(simple_query)
        
        if not plan or not plan.steps:
            logger.error("❌ Planner failed to create plan for simple query")
            return False
        
        logger.info(f"✅ Planner created plan with {len(plan.steps)} steps for simple query")
        
        # Test złożonego zapytania
        complex_query = "Zaproponuj przepis na kurczaka biorąc pod uwagę, że jutro będzie padać"
        complex_plan = await planner.create_plan(complex_query)
        
        if not complex_plan or len(complex_plan.steps) < 2:
            logger.error("❌ Planner failed to create multi-step plan")
            return False
        
        logger.info(f"✅ Planner created complex plan with {len(complex_plan.steps)} steps")
        
        # Test walidacji planu
        is_valid = planner.validate_plan(complex_plan)
        if not is_valid:
            logger.error("❌ Plan validation failed")
            return False
        
        logger.info("✅ Plan validation successful")
        return True
        
    except Exception as e:
        logger.error(f"❌ Planner test failed: {e}")
        return False


async def test_executor():
    """Test egzekutora"""
    logger.info("Testing executor...")
    try:
        from backend.agents.executor import Executor
        from backend.agents.planner import Planner
        
        executor = Executor()
        planner = Planner()
        await executor.initialize()
        await planner.initialize()
        
        # Utwórz prosty plan
        query = "Test query"
        plan = await planner.create_plan(query)
        
        # Wykonaj plan
        execution_result = await executor.execute_plan(plan)
        
        if not execution_result:
            logger.error("❌ Executor failed to execute plan")
            return False
        
        logger.info(f"✅ Executor completed plan execution in {execution_result.total_execution_time:.2f}s")
        logger.info(f"   Steps: {len(execution_result.step_results)}")
        logger.info(f"   Success: {execution_result.success}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Executor test failed: {e}")
        return False


async def test_synthesizer():
    """Test syntezatora"""
    logger.info("Testing synthesizer...")
    try:
        from backend.agents.synthesizer import Synthesizer
        from backend.agents.executor import Executor, ExecutionResult, StepResult
        from backend.agents.planner import Planner, ExecutionPlan, PlanStep
        
        synthesizer = Synthesizer()
        await synthesizer.initialize()
        
        # Utwórz mock execution result
        mock_step = PlanStep(
            step=1,
            tool="test_tool",
            args={"test": "value"},
            description="Test step"
        )
        
        mock_step_result = StepResult(
            step=mock_step,
            success=True,
            result="Test result",
            execution_time=1.0
        )
        
        mock_plan = ExecutionPlan(
            query="Test query",
            steps=[mock_step],
            total_steps=1,
            estimated_complexity="simple"
        )
        
        mock_execution_result = ExecutionResult(
            plan=mock_plan,
            step_results=[mock_step_result],
            success=True,
            final_result="Test final result",
            total_execution_time=1.0,
            errors=[]
        )
        
        # Test syntezy odpowiedzi
        response = await synthesizer.generate_response(
            mock_execution_result,
            "Test query"
        )
        
        if not response or not response.success:
            logger.error("❌ Synthesizer failed to generate response")
            return False
        
        logger.info("✅ Synthesizer generated response successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Synthesizer test failed: {e}")
        return False


async def test_full_orchestrator():
    """Test pełnego orchestratora"""
    logger.info("Testing full orchestrator...")
    try:
        # Inicjalizuj komponenty
        async with get_db() as db:
            memory_manager = MemoryManager()
            intent_detector = SimpleIntentDetector()
            agent_router = AgentRouter()
            profile_manager = ProfileManager(db)
            
            orchestrator = Orchestrator(
                db_session=db,
                profile_manager=profile_manager,
                intent_detector=intent_detector,
                agent_router=agent_router,
                memory_manager=memory_manager,
                use_planner_executor=True
            )
            
            await orchestrator.initialize()
            
            # Test prostego zapytania
            session_id = f"test_orchestrator_{datetime.now().timestamp()}"
            simple_query = "Jaka jest pogoda w Warszawie?"
            
            response = await orchestrator.process_command(
                user_command=simple_query,
                session_id=session_id
            )
            
            if not response:
                logger.error("❌ Orchestrator failed to process simple query")
                return False
            
            logger.info(f"✅ Orchestrator processed simple query successfully")
            logger.info(f"   Response success: {response.success}")
            logger.info(f"   Response text length: {len(response.text) if response.text else 0}")
            
            # Test złożonego zapytania
            complex_query = "Zaproponuj przepis na kurczaka biorąc pod uwagę, że jutro będzie padać"
            
            response2 = await orchestrator.process_command(
                user_command=complex_query,
                session_id=session_id
            )
            
            if not response2:
                logger.error("❌ Orchestrator failed to process complex query")
                return False
            
            logger.info(f"✅ Orchestrator processed complex query successfully")
            logger.info(f"   Response success: {response2.success}")
            logger.info(f"   Response text length: {len(response2.text) if response2.text else 0}")
            
            return True
            
    except Exception as e:
        logger.error(f"❌ Full orchestrator test failed: {e}")
        return False


async def run_all_tests():
    """Uruchom wszystkie testy"""
    logger.info("🚀 Starting comprehensive architecture tests...")
    
    tests = [
        ("Database Migrations", test_database_migrations),
        ("Tool Registry", test_tool_registry),
        ("Memory Manager", test_memory_manager),
        ("Planner", test_planner),
        ("Executor", test_executor),
        ("Synthesizer", test_synthesizer),
        ("Full Orchestrator", test_full_orchestrator),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        logger.info(f"\n{'='*50}")
        logger.info(f"Running test: {test_name}")
        logger.info(f"{'='*50}")
        
        try:
            result = await test_func()
            results.append((test_name, result))
            
            if result:
                logger.info(f"✅ {test_name}: PASSED")
            else:
                logger.error(f"❌ {test_name}: FAILED")
                
        except Exception as e:
            logger.error(f"❌ {test_name}: ERROR - {e}")
            results.append((test_name, False))
    
    # Podsumowanie
    logger.info(f"\n{'='*50}")
    logger.info("TEST SUMMARY")
    logger.info(f"{'='*50}")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        logger.info(f"{test_name}: {status}")
    
    logger.info(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        logger.info("🎉 All tests passed! New architecture is working correctly.")
        return True
    else:
        logger.error(f"💥 {total - passed} tests failed. Please check the implementation.")
        return False


if __name__ == "__main__":
    success = asyncio.run(run_all_tests())
    sys.exit(0 if success else 1) 