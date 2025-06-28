"""
Syntezator Odpowiedzi - generuje finalną, spójną odpowiedź na podstawie wyników wykonania planu
Zgodnie z planem ewolucji - Faza 2: Rdzeń Inteligencji
"""

import logging
from typing import Any, Dict, List, Optional

from backend.core.llm_client import llm_client
from backend.settings import settings
from backend.agents.executor import ExecutionResult, StepResult
from backend.agents.interfaces import AgentResponse

logger = logging.getLogger(__name__)


class Synthesizer:
    """Syntezator odpowiedzi - łączy wyniki kroków w spójną odpowiedź"""
    
    def __init__(self):
        self._initialized = False
    
    async def initialize(self) -> None:
        """Inicjalizuj syntezator"""
        if self._initialized:
            return
        
        self._initialized = True
        logger.info("Synthesizer initialized")
    
    async def generate_response(
        self, 
        execution_result: ExecutionResult,
        original_query: str,
        context: Optional[Dict[str, Any]] = None
    ) -> AgentResponse:
        """
        Generuj finalną odpowiedź na podstawie wyników wykonania planu
        
        Args:
            execution_result: Wynik wykonania planu
            original_query: Oryginalne zapytanie użytkownika
            context: Dodatkowy kontekst
            
        Returns:
            AgentResponse z finalną odpowiedzią
        """
        try:
            if not execution_result.success:
                return self._generate_error_response(execution_result, original_query)
            
            # Przygotuj dane dla syntezatora
            synthesis_data = self._prepare_synthesis_data(execution_result, context)
            
            # Wygeneruj odpowiedź używając LLM
            response_text = await self._synthesize_with_llm(original_query, synthesis_data)
            
            # Utwórz AgentResponse
            return AgentResponse(
                success=True,
                text=response_text,
                data={
                    "execution_summary": self._create_execution_summary(execution_result),
                    "steps_executed": len(execution_result.step_results),
                    "execution_time": execution_result.total_execution_time,
                    "plan_complexity": execution_result.plan.estimated_complexity
                }
            )
            
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return self._generate_fallback_response(execution_result, original_query)
    
    def _prepare_synthesis_data(
        self, 
        execution_result: ExecutionResult, 
        context: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Przygotuj dane do syntezy odpowiedzi"""
        synthesis_data = {
            "original_query": execution_result.plan.query,
            "successful_steps": [],
            "failed_steps": [],
            "step_results": [],
            "context": context or {}
        }
        
        for i, step_result in enumerate(execution_result.step_results):
            step_info = {
                "step_number": i + 1,
                "tool": step_result.step.tool,
                "description": step_result.step.description,
                "success": step_result.success,
                "result": step_result.result,
                "execution_time": step_result.execution_time
            }
            
            synthesis_data["step_results"].append(step_info)
            
            if step_result.success:
                synthesis_data["successful_steps"].append(step_info)
            else:
                synthesis_data["failed_steps"].append(step_info)
        
        return synthesis_data
    
    async def _synthesize_with_llm(
        self, 
        original_query: str, 
        synthesis_data: Dict[str, Any]
    ) -> str:
        """Syntezuj odpowiedź używając LLM"""
        system_prompt = self._create_synthesizer_prompt()
        user_prompt = self._create_synthesis_user_prompt(original_query, synthesis_data)
        
        try:
            response = await llm_client.chat(
                model=settings.DEFAULT_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                stream=False,
                options={"temperature": 0.3}  # Średnia temperatura dla kreatywności
            )
            
            if isinstance(response, dict) and response.get("message"):
                return response["message"]["content"]
            else:
                logger.warning("Invalid response from LLM for synthesis")
                return self._create_fallback_synthesis(original_query, synthesis_data)
                
        except Exception as e:
            logger.error(f"Error in LLM synthesis: {e}")
            return self._create_fallback_synthesis(original_query, synthesis_data)
    
    def _create_synthesizer_prompt(self) -> str:
        """Twórz prompt systemowy dla syntezatora"""
        return """
Jesteś ekspertem w syntetyzowaniu informacji i tworzeniu spójnych, naturalnych odpowiedzi.

Twoim zadaniem jest połączenie wyników z różnych kroków wykonania w jedną, płynną odpowiedź dla użytkownika.

Zasady syntezy:
1. Odpowiedź powinna być naturalna i płynna, jakby była napisana przez człowieka
2. Uwzględnij wszystkie istotne informacje z wykonanych kroków
3. Jeśli niektóre kroki się nie powiodły, wyjaśnij to w odpowiedzi
4. Używaj kontekstu rozmowy jeśli jest dostępny
5. Odpowiedź powinna być dostosowana do stylu rozmowy użytkownika
6. Jeśli zapytanie wymagało kilku kroków, wyjaśnij logicznie połączenie między nimi
7. Bądź pomocny i przyjazny

Przykład:
- Jeśli użytkownik pytał o przepis na kurczaka biorąc pod uwagę pogodę, połącz informacje o pogodzie z sugestiami przepisów
- Jeśli niektóre kroki się nie powiodły, wyjaśnij co udało się zrobić i co poszło nie tak
"""
    
    def _create_synthesis_user_prompt(
        self, 
        original_query: str, 
        synthesis_data: Dict[str, Any]
    ) -> str:
        """Twórz prompt użytkownika dla syntezy"""
        prompt = f"Oryginalne zapytanie użytkownika: {original_query}\n\n"
        
        # Dodaj informacje o kontekście
        if synthesis_data.get("context"):
            context = synthesis_data["context"]
            if context.get("conversation_summary"):
                prompt += f"Kontekst rozmowy: {context['conversation_summary']}\n\n"
            if context.get("user_preferences"):
                prompt += f"Preferencje użytkownika: {context['user_preferences']}\n\n"
        
        # Dodaj informacje o wykonanych krokach
        prompt += "Wykonane kroki:\n"
        for step_info in synthesis_data["step_results"]:
            status = "✓" if step_info["success"] else "✗"
            prompt += f"{status} Krok {step_info['step_number']}: {step_info['description']}\n"
            if step_info["success"] and step_info["result"]:
                prompt += f"   Wynik: {step_info['result']}\n"
            elif not step_info["success"]:
                prompt += f"   Błąd: Krok się nie powiódł\n"
            prompt += "\n"
        
        prompt += "Stwórz spójną, naturalną odpowiedź dla użytkownika na podstawie powyższych informacji:"
        return prompt
    
    def _create_fallback_synthesis(
        self, 
        original_query: str, 
        synthesis_data: Dict[str, Any]
    ) -> str:
        """Twórz podstawową syntezę bez LLM"""
        successful_results = [step["result"] for step in synthesis_data["successful_steps"] if step["result"]]
        
        if not successful_results:
            return "Przepraszam, nie udało się przetworzyć Twojego zapytania. Wystąpiły błędy podczas wykonywania zadania."
        
        if len(successful_results) == 1:
            return str(successful_results[0])
        
        # Połącz wyniki w prosty sposób
        response = f"Oto wyniki dla Twojego zapytania '{original_query}':\n\n"
        for i, result in enumerate(successful_results, 1):
            response += f"{i}. {result}\n\n"
        
        return response
    
    def _generate_error_response(
        self, 
        execution_result: ExecutionResult, 
        original_query: str
    ) -> AgentResponse:
        """Generuj odpowiedź błędu"""
        error_message = f"Przepraszam, wystąpiły błędy podczas przetwarzania zapytania '{original_query}'.\n\n"
        
        if execution_result.errors:
            error_message += "Błędy:\n"
            for error in execution_result.errors:
                error_message += f"- {error}\n"
        
        successful_steps = [r for r in execution_result.step_results if r.success]
        if successful_steps:
            error_message += f"\nUdało się wykonać {len(successful_steps)} z {len(execution_result.step_results)} kroków."
        
        return AgentResponse(
            success=False,
            text=error_message,
            error="Plan execution failed",
            data={
                "execution_summary": self._create_execution_summary(execution_result),
                "errors": execution_result.errors,
                "successful_steps": len(successful_steps),
                "total_steps": len(execution_result.step_results)
            }
        )
    
    def _generate_fallback_response(
        self, 
        execution_result: ExecutionResult, 
        original_query: str
    ) -> AgentResponse:
        """Generuj odpowiedź awaryjną"""
        return AgentResponse(
            success=False,
            text=f"Przepraszam, wystąpił nieoczekiwany błąd podczas przetwarzania zapytania '{original_query}'. Spróbuj ponownie.",
            error="Synthesis failed",
            data={
                "execution_summary": self._create_execution_summary(execution_result)
            }
        )
    
    def _create_execution_summary(self, execution_result: ExecutionResult) -> Dict[str, Any]:
        """Twórz podsumowanie wykonania"""
        successful_steps = [r for r in execution_result.step_results if r.success]
        
        return {
            "total_steps": len(execution_result.step_results),
            "successful_steps": len(successful_steps),
            "failed_steps": len(execution_result.step_results) - len(successful_steps),
            "execution_time": execution_result.total_execution_time,
            "complexity": execution_result.plan.estimated_complexity,
            "errors": execution_result.errors
        } 