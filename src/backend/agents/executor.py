"""
Egzekutor Planów - wykonuje plany utworzone przez planistę
Zgodnie z planem ewolucji - Faza 2: Rdzeń Inteligencji
"""

import asyncio
import logging
from typing import Any, Callable, Dict, List, Optional
from dataclasses import dataclass

from backend.agents.planner import ExecutionPlan, PlanStep
from backend.agents.tools.registry import tool_registry
from backend.agents.interfaces import AgentResponse
from backend.agents.general_conversation_agent import GeneralConversationAgent

logger = logging.getLogger(__name__)


@dataclass
class StepResult:
    """Wynik wykonania kroku"""
    step: PlanStep
    success: bool
    result: Any
    error: Optional[str] = None
    execution_time: float = 0.0


@dataclass
class ExecutionResult:
    """Wynik wykonania całego planu"""
    plan: ExecutionPlan
    step_results: List[StepResult]
    success: bool
    final_result: Any
    total_execution_time: float
    errors: List[str]


class Executor:
    """Egzekutor planów - wykonuje kroki planu i zarządza wynikami"""
    
    def __init__(self):
        self.tool_registry = tool_registry
        self.general_conversation_agent = GeneralConversationAgent()
        self._initialized = False
        self._stream_callback: Optional[Callable[[Dict[str, Any]], None]] = None
    
    async def initialize(self) -> None:
        """Inicjalizuj egzekutora"""
        if self._initialized:
            return
        
        self.tool_registry = tool_registry
        self._initialized = True
        logger.info("Executor initialized")
    
    def set_stream_callback(self, callback: Callable[[Dict[str, Any]], None]) -> None:
        """Ustaw callback dla streamingu statusu"""
        self._stream_callback = callback
    
    async def execute_plan(
        self, 
        plan: ExecutionPlan, 
        context: Optional[Dict[str, Any]] = None
    ) -> ExecutionResult:
        """
        Wykonaj plan krok po kroku
        
        Args:
            plan: Plan do wykonania
            context: Dodatkowy kontekst
            
        Returns:
            ExecutionResult z wynikami wszystkich kroków
        """
        start_time = asyncio.get_event_loop().time()
        step_results = []
        errors = []
        
        logger.info(f"Starting execution of plan with {len(plan.steps)} steps")
        
        # Wyślij informację o rozpoczęciu
        self._send_stream_event("plan_started", {
            "total_steps": len(plan.steps),
            "complexity": plan.estimated_complexity
        })
        
        try:
            # Wykonuj kroki sekwencyjnie
            for i, step in enumerate(plan.steps):
                step_start_time = asyncio.get_event_loop().time()
                
                # Wyślij informację o rozpoczęciu kroku
                self._send_stream_event("step_started", {
                    "step_number": i + 1,
                    "total_steps": len(plan.steps),
                    "tool": step.tool,
                    "description": step.description
                })
                
                try:
                    # Wykonaj krok
                    step_result = await self._execute_step(step, context, step_results)
                    step_results.append(step_result)
                    
                    # Wyślij informację o zakończeniu kroku
                    self._send_stream_event("step_completed", {
                        "step_number": i + 1,
                        "success": step_result.success,
                        "execution_time": step_result.execution_time
                    })
                    
                    # Jeśli krok się nie powiódł, dodaj błąd
                    if not step_result.success:
                        errors.append(f"Step {i + 1} failed: {step_result.error}")
                        logger.warning(f"Step {i + 1} failed: {step_result.error}")
                    
                except Exception as e:
                    error_msg = f"Unexpected error in step {i + 1}: {str(e)}"
                    errors.append(error_msg)
                    logger.error(error_msg, exc_info=True)
                    
                    # Utwórz wynik błędu
                    step_result = StepResult(
                        step=step,
                        success=False,
                        result=None,
                        error=error_msg,
                        execution_time=asyncio.get_event_loop().time() - step_start_time
                    )
                    step_results.append(step_result)
                    
                    # Wyślij informację o błędzie
                    self._send_stream_event("step_failed", {
                        "step_number": i + 1,
                        "error": error_msg
                    })
            
            # Wyślij informację o zakończeniu planu
            self._send_stream_event("plan_completed", {
                "total_steps": len(plan.steps),
                "successful_steps": len([r for r in step_results if r.success]),
                "failed_steps": len([r for r in step_results if not r.success])
            })
            
        except Exception as e:
            error_msg = f"Critical error during plan execution: {str(e)}"
            errors.append(error_msg)
            logger.error(error_msg, exc_info=True)
            
            # Wyślij informację o krytycznym błędzie
            self._send_stream_event("plan_failed", {
                "error": error_msg
            })
        
        total_execution_time = asyncio.get_event_loop().time() - start_time
        
        # Określ końcowy wynik
        final_result = self._determine_final_result(step_results, plan)
        success = len(errors) == 0 and any(r.success for r in step_results)
        
        execution_result = ExecutionResult(
            plan=plan,
            step_results=step_results,
            success=success,
            final_result=final_result,
            total_execution_time=total_execution_time,
            errors=errors
        )
        
        logger.info(f"Plan execution completed in {total_execution_time:.2f}s, success: {success}")
        return execution_result
    
    async def _execute_step(
        self, 
        step: PlanStep, 
        context: Optional[Dict[str, Any]], 
        previous_results: List[StepResult]
    ) -> StepResult:
        """Wykonaj pojedynczy krok planu"""
        step_start_time = asyncio.get_event_loop().time()
        
        try:
            if step.tool == "general_conversation":
                # Specjalne traktowanie dla general_conversation_agent
                result = await self._execute_general_conversation(step, context, previous_results)
            else:
                # Wykonaj narzędzie z rejestru
                result = await self._execute_tool(step, context, previous_results)
            
            execution_time = asyncio.get_event_loop().time() - step_start_time
            
            return StepResult(
                step=step,
                success=True,
                result=result,
                execution_time=execution_time
            )
            
        except Exception as e:
            execution_time = asyncio.get_event_loop().time() - step_start_time
            logger.error(f"Error executing step {step.step}: {e}")
            
            return StepResult(
                step=step,
                success=False,
                result=None,
                error=str(e),
                execution_time=execution_time
            )
    
    async def _execute_tool(
        self, 
        step: PlanStep, 
        context: Optional[Dict[str, Any]], 
        previous_results: List[StepResult]
    ) -> Any:
        """Wykonaj narzędzie z rejestru"""
        tool_def = self.tool_registry.get_tool(step.tool)
        if not tool_def:
            raise ValueError(f"Tool {step.tool} not found in registry")
        
        # Przygotuj argumenty, uwzględniając wyniki poprzednich kroków
        args = self._prepare_step_args(step.args, context, previous_results)
        
        # Wykonaj narzędzie
        if asyncio.iscoroutinefunction(tool_def.function):
            result = await tool_def.function(**args)
        else:
            result = tool_def.function(**args)
        
        logger.debug(f"Executed tool {step.tool} with result: {result}")
        return result
    
    async def _execute_general_conversation(
        self, 
        step: PlanStep, 
        context: Optional[Dict[str, Any]], 
        previous_results: List[StepResult]
    ) -> Any:
        """Wykonaj general_conversation_agent"""
        # Przygotuj dane wejściowe dla agenta
        input_data = {
            "query": step.args.get("query", ""),
            "context": context or {},
            "previous_results": [r.result for r in previous_results if r.success]
        }
        
        # Wywołaj agenta
        response = await self.general_conversation_agent.process(input_data)
        
        if response.success:
            return response.text or response.data
        else:
            raise Exception(f"General conversation agent failed: {response.error}")
    
    def _prepare_step_args(
        self, 
        step_args: Dict[str, Any], 
        context: Optional[Dict[str, Any]], 
        previous_results: List[StepResult]
    ) -> Dict[str, Any]:
        """Przygotuj argumenty kroku, uwzględniając kontekst i poprzednie wyniki"""
        args = step_args.copy()
        
        # Dodaj kontekst jeśli jest dostępny
        if context:
            args["context"] = context
        
        # Dodaj wyniki poprzednich kroków
        if previous_results:
            args["previous_results"] = [r.result for r in previous_results if r.success]
        
        # Przykład: jeśli poprzedni krok zwrócił pogodę, użyj jej w następnym kroku
        for i, result in enumerate(previous_results):
            if result.success and result.result:
                args[f"step_{i+1}_result"] = result.result
        
        return args
    
    def _determine_final_result(
        self, 
        step_results: List[StepResult], 
        plan: ExecutionPlan
    ) -> Any:
        """Określ końcowy wynik na podstawie wyników kroków"""
        if not step_results:
            return None
        
        # Jeśli jest tylko jeden krok, zwróć jego wynik
        if len(step_results) == 1:
            return step_results[0].result
        
        # Jeśli wszystkie kroki się powiodły, zwróć ostatni wynik
        successful_results = [r for r in step_results if r.success]
        if len(successful_results) == len(step_results):
            return successful_results[-1].result
        
        # Jeśli niektóre kroki się nie powiodły, zwróć kombinację wyników
        results = [r.result for r in successful_results if r.result is not None]
        if results:
            return results
        
        return None
    
    def _send_stream_event(self, event_type: str, data: Dict[str, Any]) -> None:
        """Wyślij zdarzenie przez stream callback"""
        if self._stream_callback:
            try:
                event_data = {
                    "type": event_type,
                    "timestamp": asyncio.get_event_loop().time(),
                    **data
                }
                self._stream_callback(event_data)
            except Exception as e:
                logger.warning(f"Error sending stream event: {e}")
    
    def get_execution_summary(self, result: ExecutionResult) -> str:
        """Pobierz podsumowanie wykonania"""
        summary = f"Wykonanie planu: '{result.plan.query}'\n"
        summary += f"Czas wykonania: {result.total_execution_time:.2f}s\n"
        summary += f"Status: {'SUKCES' if result.success else 'BŁĄD'}\n"
        summary += f"Kroki: {len([r for r in result.step_results if r.success])}/{len(result.step_results)} udane\n\n"
        
        for i, step_result in enumerate(result.step_results):
            status = "✓" if step_result.success else "✗"
            summary += f"{status} Krok {i+1}: {step_result.step.description}\n"
            if not step_result.success:
                summary += f"   Błąd: {step_result.error}\n"
            summary += f"   Czas: {step_result.execution_time:.2f}s\n\n"
        
        if result.errors:
            summary += "Błędy:\n"
            for error in result.errors:
                summary += f"- {error}\n"
        
        return summary 