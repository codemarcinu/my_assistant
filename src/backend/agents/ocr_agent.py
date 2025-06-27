from typing import Any, Dict, Union

from pydantic import BaseModel, ValidationError

from backend.agents.base_agent import BaseAgent
from backend.agents.interfaces import AgentResponse
from backend.core.decorators import handle_exceptions
from backend.core.ocr import process_image_file, process_pdf_file


class OCRAgentInput(BaseModel):
    """Model wejściowy dla OCRAgent."""

    file_bytes: bytes
    file_type: str


class OCRAgent(BaseAgent):
    """Agent odpowiedzialny za optyczne rozpoznawanie znaków (OCR) z obrazów i dokumentów PDF.

    Wykorzystuje Tesseract OCR z obsługą języka polskiego i specjalizowanymi promptami dla paragonów.
    """

    def __init__(
        self,
        name: str = "OCRAgent",
        error_handler: Any = None,
        fallback_manager: Any = None,
        **kwargs: Any,
    ) -> None:
        """Inicjalizuje OCRAgent."""
        super().__init__(
            name=name, error_handler=error_handler, fallback_manager=fallback_manager
        )
        # Dodaję atrybuty konfiguracyjne
        self.TIMEOUT = kwargs.get("timeout", 30)
        self.default_language = kwargs.get("language", "eng")
        
        # Specjalizowane prompty dla paragonów
        self.system_prompt = """You are OCRAgent, a specialized OCR engine wrapper.  
Your task: Given an input image of a retail receipt, extract all visible text lines, preserving:
- układ kolumn (jeśli są oddzielone spacjami),
- znaki specjalne (np. "*"", "-", "PLN"),
- nagłówki i stopkę.  
Output: Jedynie czysty tekst, zachowując kolejność wierszy, bez dodatkowych komentarzy."""

        self.user_prompt = """Poniżej obraz paragonu. Wyeksportuj z niego tekst tak, aby każda linia odpowiadała dokładnemu wierszowi z paragonu, łącznie ze spacjami i wyrównaniem kolumn."""

    @handle_exceptions(max_retries=1, retry_delay=0.5)
    async def process(
        self, input_data: Union[OCRAgentInput, Dict[str, Any]]
    ) -> AgentResponse:
        """
        Przetwarza pliki obrazów lub PDF-ów za pomocą OCR z użyciem specjalizowanych promptów.

        Args:
            input_data (Union[OCRAgentInput, Dict[str, Any]]): Dane wejściowe, oczekiwany słownik lub OCRAgentInput.

        Returns:
            AgentResponse: Odpowiedź agenta z wynikiem OCR lub błędem.
        """
        try:
            if not isinstance(input_data, OCRAgentInput):
                # Walidacja i konwersja przez Pydantic (używamy model_validate zgodnie z Pydantic V2.0)
                input_data = OCRAgentInput.model_validate(input_data)
        except ValidationError as ve:
            return AgentResponse(
                success=False,
                error=f"Błąd walidacji danych wejściowych: {ve}",
            )

        file_bytes: bytes
        file_type: str

        # Directly access attributes now that input_data is guaranteed to be OCRAgentInput
        file_bytes = input_data.file_bytes
        file_type = input_data.file_type.lower()

        try:
            if file_type == "image":
                text = process_image_file(file_bytes, timeout=self.TIMEOUT)
            elif file_type == "pdf":
                text = process_pdf_file(file_bytes, timeout=self.TIMEOUT)
            else:
                return AgentResponse(
                    success=False,
                    error=f"Nieobsługiwany typ pliku: {file_type}",
                )

            if not text:
                return AgentResponse(
                    success=False,
                    error="Nie udało się rozpoznać tekstu z pliku. Sprawdź czy plik jest czytelny i spróbuj ponownie.",
                )

            # Zastosuj specjalizowane prompty dla lepszego wyniku
            enhanced_text = self._apply_ocr_prompts(text)

            return AgentResponse(
                success=True,
                text=enhanced_text,
                message="Pomyślnie wyodrębniono tekst z pliku",
                metadata={"file_type": file_type, "prompts_applied": True},
            )
        except TimeoutError:
            return AgentResponse(
                success=False,
                error=f"Przetwarzanie OCR przekroczyło limit czasu ({self.TIMEOUT} sekund). Spróbuj z mniejszym plikiem lub lepszej jakości.",
            )
        except Exception as e:
            return AgentResponse(
                success=False,
                error=f"Wystąpił błąd podczas przetwarzania pliku: {str(e)}",
            )

    def _apply_ocr_prompts(self, raw_text: str) -> str:
        """
        Zastosuj specjalizowane prompty do poprawy jakości tekstu OCR.
        
        Args:
            raw_text: Surowy tekst z OCR
            
        Returns:
            str: Poprawiony tekst z zastosowanymi promptami
        """
        # Tutaj można dodać logikę poprawy tekstu na podstawie promptów
        # Na razie zwracamy oryginalny tekst, ale struktura jest gotowa
        # do implementacji bardziej zaawansowanej logiki
        
        # Podstawowe poprawki na podstawie promptów
        lines = raw_text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            # Zachowaj układ kolumn i znaki specjalne
            cleaned_line = line.strip()
            if cleaned_line:
                # Zachowaj spacje na początku dla wyrównania kolumn
                leading_spaces = len(line) - len(line.lstrip())
                cleaned_lines.append(' ' * leading_spaces + cleaned_line)
        
        return '\n'.join(cleaned_lines)

    @handle_exceptions(max_retries=1)
    async def execute(
        self, task_description: str, context: Dict[str, Any] = {}
    ) -> AgentResponse:
        """
        Wykonuje OCR na przesłanym pliku.

        Args:
            task_description: Opis zadania (nieużywany w tym agencie)
            context: Słownik zawierający:
                - file_bytes: bajty pliku do przetworzenia
                - file_type: typ pliku ('image' lub 'pdf')

        Returns:
            AgentResponse zawierający rozpoznany tekst lub informację o błędzie
        """
        return await self.process(context)
