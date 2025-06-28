"""
Agent Planisty - Rdzeń inteligencji systemu agentowego
Zgodnie z planem ewolucji - Faza 2: Rdzeń Inteligencji
"""

import json
import logging
from typing import Any, Dict, List, Optional
from dataclasses import dataclass

from backend.core.llm_client import llm_client
from backend.settings import settings
from backend.agents.tools.registry import tool_registry
from backend.core.utils import extract_json_from_text

logger = logging.getLogger(__name__)


@dataclass
class PlanStep:
    """Krok w planie wykonania"""
    step: int
    tool: str
    args: Dict[str, Any]
    description: str
    expected_result: Optional[str] = None


@dataclass
class ExecutionPlan:
    """Plan wykonania zadania"""
    query: str
    steps: List[PlanStep]
    total_steps: int
    estimated_complexity: str  # 'simple', 'medium', 'complex'


class Planner:
    """Agent planisty - tworzy wieloetapowe plany wykonania zadań"""
    
    def __init__(self):
        self.tool_registry = tool_registry
        self._initialized = False
    
    async def initialize(self) -> None:
        """Inicjalizuj planistę"""
        if self._initialized:
            return
        
        # Inicjalizuj rejestr narzędzi
        self.tool_registry = tool_registry
        self._initialized = True
        logger.info("Planner initialized")
    
    async def create_plan(self, query: str, context: Optional[Dict[str, Any]] = None) -> ExecutionPlan:
        """
        Twórz plan wykonania dla zapytania użytkownika
        
        Args:
            query: Zapytanie użytkownika
            context: Dodatkowy kontekst (np. historia konwersacji)
            
        Returns:
            ExecutionPlan z krokami do wykonania
        """
        try:
            # Przygotuj prompt dla planisty
            system_prompt = self._create_planner_prompt()
            user_prompt = self._create_user_prompt(query, context)
            
            # Wywołaj LLM do utworzenia planu
            response = await llm_client.chat(
                model=settings.DEFAULT_MODEL,  # Użyj mocniejszego modelu dla planowania
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                stream=False,
                options={"temperature": 0.1}  # Niska temperatura dla spójności
            )
            
            if isinstance(response, dict) and response.get("message"):
                content = response["message"]["content"]
                plan_data = self._parse_plan_response(content)
                
                if plan_data:
                    execution_plan = self._create_execution_plan(query, plan_data)
                    logger.info(f"Created execution plan with {len(execution_plan.steps)} steps")
                    return execution_plan
                else:
                    logger.warning("Failed to parse plan response, creating fallback plan")
                    return self._create_fallback_plan(query)
            else:
                logger.error("Invalid response from LLM for plan creation")
                return self._create_fallback_plan(query)
                
        except Exception as e:
            logger.error(f"Error creating plan: {e}")
            return self._create_fallback_plan(query)
    
    def _create_planner_prompt(self) -> str:
        """Twórz prompt systemowy dla planisty"""
        available_tools = self.tool_registry.format_tools_for_planner()
        
        return f"""
Jesteś ekspertem w planowaniu zadań. Twoim zadaniem jest stworzenie szczegółowego planu wykonania zapytania użytkownika używając dostępnych narzędzi.

Zawsze zwracaj odpowiedź w formacie JSON z następującą strukturą:
{{
    "steps": [
        {{
            "step": 1,
            "tool": "nazwa_narzędzia",
            "args": {{"arg1": "wartość1", "arg2": "wartość2"}},
            "description": "Opis tego kroku",
            "expected_result": "Co oczekujemy otrzymać"
        }}
    ],
    "total_steps": 3,
    "estimated_complexity": "simple|medium|complex"
}}

Dostępne narzędzia:
{available_tools}

Zasady planowania:
1. Analizuj zapytanie użytkownika i rozbij je na logiczne kroki
2. Używaj tylko dostępnych narzędzi
3. Każdy krok powinien mieć jasny cel i oczekiwany wynik
4. Planuj sekwencyjnie - wyniki jednego kroku mogą być potrzebne w następnym
5. Uwzględniaj kontekst rozmowy jeśli jest dostępny
6. Jeśli zapytanie jest proste, użyj tylko jednego kroku
7. Jeśli zapytanie jest złożone, rozbij je na kilka kroków

Przykłady:
- Zapytanie: "Jaka jest pogoda w Warszawie?" -> 1 krok (get_weather_forecast)
- Zapytanie: "Zaproponuj przepis na kurczaka biorąc pod uwagę, że jutro będzie padać" -> 2 kroki (get_weather_forecast + find_recipes)
"""
    
    def _create_user_prompt(self, query: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Twórz prompt użytkownika"""
        prompt = f"Zapytanie użytkownika: {query}"
        
        if context:
            if context.get("conversation_summary"):
                prompt += f"\n\nKontekst rozmowy: {context['conversation_summary']}"
            if context.get("user_preferences"):
                prompt += f"\nPreferencje użytkownika: {context['user_preferences']}"
        
        prompt += "\n\nStwórz plan wykonania tego zapytania:"
        return prompt
    
    def _parse_plan_response(self, content: str) -> Optional[Dict[str, Any]]:
        """Parsuj odpowiedź LLM na strukturę planu"""
        try:
            # Spróbuj wyciągnąć JSON z odpowiedzi
            json_str = extract_json_from_text(content)
            if json_str:
                plan_data = json.loads(json_str)
                
                # Waliduj strukturę
                if "steps" in plan_data and isinstance(plan_data["steps"], list):
                    return plan_data
                else:
                    logger.warning("Invalid plan structure in response")
                    return None
            else:
                logger.warning("No valid JSON found in plan response")
                return None
                
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing plan JSON: {e}")
            return None
        except Exception as e:
            logger.error(f"Error parsing plan response: {e}")
            return None
    
    def _create_execution_plan(self, query: str, plan_data: Dict[str, Any]) -> ExecutionPlan:
        """Twórz obiekt ExecutionPlan z danych"""
        steps = []
        
        for step_data in plan_data.get("steps", []):
            step = PlanStep(
                step=step_data.get("step", len(steps) + 1),
                tool=step_data.get("tool", ""),
                args=step_data.get("args", {}),
                description=step_data.get("description", ""),
                expected_result=step_data.get("expected_result")
            )
            steps.append(step)
        
        return ExecutionPlan(
            query=query,
            steps=steps,
            total_steps=plan_data.get("total_steps", len(steps)),
            estimated_complexity=plan_data.get("estimated_complexity", "medium")
        )
    
    def _create_fallback_plan(self, query: str) -> ExecutionPlan:
        """Twórz plan awaryjny dla prostych zapytań"""
        # Dla prostych zapytań, użyj general_conversation_agent
        fallback_step = PlanStep(
            step=1,
            tool="general_conversation",
            args={"query": query},
            description="Odpowiedz na zapytanie użytkownika",
            expected_result="Odpowiedź na zapytanie"
        )
        
        return ExecutionPlan(
            query=query,
            steps=[fallback_step],
            total_steps=1,
            estimated_complexity="simple"
        )
    
    def validate_plan(self, plan: ExecutionPlan) -> bool:
        """Sprawdź czy plan jest poprawny"""
        if not plan.steps:
            return False
        
        for step in plan.steps:
            # Sprawdź czy narzędzie istnieje w rejestrze
            if step.tool != "general_conversation" and not self.tool_registry.get_tool(step.tool):
                logger.warning(f"Tool {step.tool} not found in registry")
                return False
            
            # Sprawdź wymagane argumenty
            if step.tool != "general_conversation":
                tool_def = self.tool_registry.get_tool(step.tool)
                if tool_def:
                    missing_args = [arg for arg in tool_def.required_args if arg not in step.args]
                    if missing_args:
                        logger.warning(f"Missing required arguments for tool {step.tool}: {missing_args}")
                        return False
        
        return True
    
    def get_plan_summary(self, plan: ExecutionPlan) -> str:
        """Pobierz podsumowanie planu"""
        summary = f"Plan wykonania dla: '{plan.query}'\n"
        summary += f"Złożoność: {plan.estimated_complexity}\n"
        summary += f"Liczba kroków: {plan.total_steps}\n\n"
        
        for step in plan.steps:
            summary += f"Krok {step.step}: {step.description}\n"
            summary += f"  Narzędzie: {step.tool}\n"
            if step.args:
                summary += f"  Argumenty: {step.args}\n"
            if step.expected_result:
                summary += f"  Oczekiwany wynik: {step.expected_result}\n"
            summary += "\n"
        
        return summary 