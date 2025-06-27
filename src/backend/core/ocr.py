import io
import logging
import tempfile
import tracemalloc
import threading
import time
from typing import Any, Dict, List, Optional

import fitz  # Import biblioteki PyMuPDF
import pytesseract
from PIL import Image, ImageEnhance
from pydantic import BaseModel

from backend.core.decorators import handle_exceptions

logger = logging.getLogger(__name__)


class OCRResult(BaseModel):
    """Model wyniku OCR"""

    text: str
    confidence: float
    metadata: Dict[str, Any] = {}


class OCRProcessor:
    """Główna klasa do przetwarzania OCR z optymalizacją dla polskich paragonów"""

    def __init__(
        self, languages: List[str] = ["eng"], tesseract_config: Optional[str] = None
    ) -> None:
        self.languages = languages
        self.default_config = tesseract_config or self._get_default_receipt_config()

    def _get_default_receipt_config(self) -> str:
        """Generuje domyślną konfigurację Tesseract zoptymalizowaną dla paragonów"""
        return r"--oem 3 --psm 6"

    def _get_tesseract_config(self) -> str:
        """Generuje konfigurację Tesseract z uwzględnieniem języków i optymalizacji dla paragonów"""
        # Specjalna konfiguracja dla paragonów polskich sklepów
        receipt_config = (
            "--oem 3 --psm 6 "
            "-c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            "abcdefghijklmnopqrstuvwxyzĄĆĘŁŃÓŚŹŻąćęłńóśźż.,:-/%()[] "
        )
        # Use English as default, with fallback to no language specification
        # Check if Polish is available, if not use English only
        available_langs = ["eng"]  # Always include English
        if "pol" in self.languages:
            # Check if Polish language data is actually available
            try:
                import subprocess
                result = subprocess.run(["tesseract", "--list-langs"], 
                                      capture_output=True, text=True, timeout=5)
                if "pol" in result.stdout:
                    available_langs.append("pol")
            except Exception:
                logger.warning("Could not check available languages, using English only")
        
        lang_part = f"-l {'+'.join(available_langs)}"
        return f"{receipt_config} {lang_part}"

    def _get_fallback_config(self) -> str:
        """Fallback configuration without language specification"""
        return (
            "--oem 3 --psm 6 "
            "-c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            "abcdefghijklmnopqrstuvwxyzĄĆĘŁŃÓŚŹŻąćęłńóśźż.,:-/%()[] "
        )

    def _preprocess_receipt_image(self, image: Image.Image) -> Image.Image:
        """Preprocessing obrazu paragonu dla lepszego OCR"""
        try:
            # Konwersja do skali szarości
            if image.mode != "L":
                image = image.convert("L")

            # Zwiększenie kontrastu
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(1.5)

            # Zwiększenie ostrości
            enhancer = ImageEnhance.Sharpness(image)
            image = enhancer.enhance(1.2)

            # Zmiana rozmiaru jeśli obraz jest za mały
            width, height = image.size
            if width < 800 or height < 600:
                # Zachowaj proporcje
                ratio = max(800 / width, 600 / height)
                new_width = int(width * ratio)
                new_height = int(height * ratio)
                image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)

            logger.info(
                "Obraz paragonu przetworzony",
                extra={
                    "original_size": f"{width}x{height}",
                    "final_size": f"{image.size[0]}x{image.size[1]}",
                    "mode": image.mode,
                },
            )

            return image
        except Exception as e:
            logger.warning(f"Błąd podczas preprocessingu obrazu: {e}")
            return image

    def process_image(
        self, image_bytes: bytes, config: Optional[str] = None
    ) -> OCRResult:
        """Przetwarza obraz na tekst z context managerem i preprocessingiem"""
        try:
            with Image.open(io.BytesIO(image_bytes)) as image:
                # Preprocessing obrazu dla lepszego OCR
                processed_image = self._preprocess_receipt_image(image)

                config = config or self._get_tesseract_config()
                data = pytesseract.image_to_data(
                    processed_image, config=config, output_type=pytesseract.Output.DICT
                )

                text = "\n".join([line for line in data["text"] if line.strip()])
                avg_conf = (
                    sum(conf for conf in data["conf"] if conf > 0) / len(data["conf"])
                    if data["conf"]
                    else 0
                )

                logger.info(
                    "OCR przetwarzanie obrazu zakończone",
                    extra={
                        "confidence": avg_conf,
                        "text_length": len(text),
                        "language": self.languages[0] if self.languages else "unknown",
                    },
                )

                return OCRResult(
                    text=text,
                    confidence=avg_conf,
                    metadata={
                        "source": "image",
                        "pages": 1,
                        "language": self.languages[0] if self.languages else "unknown",
                        "preprocessing_applied": True,
                    },
                )
        except Exception as e:
            logger.error(f"OCR image processing error: {e}")
            return OCRResult(text="", confidence=0, metadata={"error": str(e)})

    def process_pdf(self, pdf_bytes: bytes, config: Optional[str] = None) -> OCRResult:
        """Przetwarza plik PDF na tekst z context managerem i cleanup"""
        try:
            full_text = []
            with tempfile.NamedTemporaryFile(delete=True, suffix=".pdf") as tmp_pdf:
                tmp_pdf.write(pdf_bytes)
                tmp_pdf.flush()
                pdf_document = fitz.open(tmp_pdf.name)

                for page_num in range(len(pdf_document)):
                    page = pdf_document.load_page(page_num)
                    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                    with Image.frombytes(
                        "RGB", (pix.width, pix.height), pix.samples
                    ) as image:
                        page_result = self.process_image(image.tobytes(), config=config)
                        full_text.append(page_result.text)

            logger.info(
                "OCR przetwarzanie PDF zakończone",
                extra={
                    "pages": len(full_text),
                    "language": self.languages[0] if self.languages else "unknown",
                },
            )

            return OCRResult(
                text="\n".join(full_text),
                confidence=0,  # PDF confidence calculation would be more complex
                metadata={
                    "source": "pdf",
                    "pages": len(full_text),
                    "language": self.languages[0] if self.languages else "unknown",
                },
            )
        except Exception as e:
            logger.error(f"OCR PDF processing error: {e}")
            return OCRResult(text="", confidence=0, metadata={"error": str(e)})

    def process_images_batch(
        self, images: List[bytes], config: Optional[str] = None
    ) -> List[OCRResult]:
        """Batch processing obrazów z monitoringiem pamięci"""
        tracemalloc.start()
        results = []
        for i, img_bytes in enumerate(images):
            logger.info(f"Przetwarzanie obrazu {i+1}/{len(images)}")
            result = self.process_image(img_bytes, config=config)
            results.append(result)
        current, peak = tracemalloc.get_traced_memory()
        logger.info(
            f"OCR batch images: memory usage={current/1024/1024:.2f}MB, peak={peak/1024/1024:.2f}MB"
        )
        tracemalloc.stop()
        return results

    def process_pdfs_batch(
        self, pdfs: List[bytes], config: Optional[str] = None
    ) -> List[OCRResult]:
        """Batch processing PDF z monitoringiem pamięci"""
        tracemalloc.start()
        results = []
        for i, pdf_bytes in enumerate(pdfs):
            logger.info(f"Przetwarzanie PDF {i+1}/{len(pdfs)}")
            result = self.process_pdf(pdf_bytes, config=config)
            results.append(result)
        current, peak = tracemalloc.get_traced_memory()
        logger.info(
            f"OCR batch PDFs: memory usage={current/1024/1024:.2f}MB, peak={peak/1024/1024:.2f}MB"
        )
        tracemalloc.stop()
        return results


@handle_exceptions(max_retries=1)
def _extract_text_from_image_obj(
    image: Image.Image, config: Optional[str] = None, timeout: int = 25
) -> str:
    """
    Prywatna funkcja pomocnicza, która wykonuje OCR na obiekcie obrazu PIL z timeout.
    """
    # Użyj konfiguracji zoptymalizowanej dla paragonów
    custom_config = (
        config
        or r"--oem 3 --psm 6 -l eng -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzĄĆĘŁŃÓŚŹŻąćęłńóśźż.,:-/%()[] "
    )
    
    def ocr_with_timeout():
        try:
            return pytesseract.image_to_string(image, config=custom_config)
        except Exception as e:
            # If language-specific config fails, try without language specification
            if "tessdata" in str(e) and "pol.traineddata" in str(e):
                logger.warning("Polish language data not found, falling back to English")
                fallback_config = r"--oem 3 --psm 6 -l eng -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzĄĆĘŁŃÓŚŹŻąćęłńóśźż.,:-/%()[] "
                try:
                    return pytesseract.image_to_string(image, config=fallback_config)
                except Exception as e2:
                    logger.warning("English language also failed, trying without language specification")
                    basic_config = r"--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzĄĆĘŁŃÓŚŹŻąćęłńóśźż.,:-/%()[] "
                    return pytesseract.image_to_string(image, config=basic_config)
            else:
                # For other errors, try basic config
                logger.warning(f"OCR failed with custom config, trying basic config: {e}")
                basic_config = r"--oem 3 --psm 6"
                return pytesseract.image_to_string(image, config=basic_config)
    
    # Run OCR with timeout using threading
    result = [None]
    exception = [None]
    
    def run_ocr():
        try:
            result[0] = ocr_with_timeout()
        except Exception as e:
            exception[0] = e
    
    thread = threading.Thread(target=run_ocr)
    thread.daemon = True
    thread.start()
    thread.join(timeout=timeout)
    
    if thread.is_alive():
        logger.error(f"OCR processing timed out after {timeout} seconds")
        raise TimeoutError(f"OCR processing timed out after {timeout} seconds")
    
    if exception[0]:
        logger.error(f"OCR processing failed: {exception[0]}")
        raise exception[0]
    
    return result[0]


@handle_exceptions(max_retries=1, retry_delay=0.5)
def process_image_file(
    file_bytes: bytes, config: Optional[str] = None, timeout: int = 25
) -> Optional[str]:
    """
    Przetwarza plik obrazu (jpg, png) i wyciąga z niego tekst z preprocessingiem i timeout.
    """
    try:
        logger.info("OCR: Rozpoczynam odczyt pliku obrazu...")
        with Image.open(io.BytesIO(file_bytes)) as image:
            # Preprocessing obrazu dla lepszego OCR
            processor = OCRProcessor()
            processed_image = processor._preprocess_receipt_image(image)
            text = _extract_text_from_image_obj(processed_image, config=config, timeout=timeout)
        logger.info("OCR: Odczyt obrazu zakończony sukcesem.")
        return text
    except TimeoutError:
        logger.error("OCR: Timeout podczas przetwarzania obrazu")
        return None
    except Exception as e:
        logger.error(f"Błąd podczas przetwarzania obrazu: {e}")
        return None


@handle_exceptions(max_retries=1, retry_delay=1.0)
def process_pdf_file(file_bytes: bytes, config: Optional[str] = None, timeout: int = 30) -> Optional[str]:
    """
    Przetwarza plik PDF, konwertując każdą stronę na obraz i odczytując tekst z timeout.
    """
    try:
        logger.info("OCR: Rozpoczynam odczyt pliku PDF...")
        full_text = []
        with tempfile.NamedTemporaryFile(delete=True, suffix=".pdf") as tmp_pdf:
            tmp_pdf.write(file_bytes)
            tmp_pdf.flush()
            pdf_document = fitz.open(tmp_pdf.name)

            for page_num in range(len(pdf_document)):
                page = pdf_document.load_page(page_num)
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                with Image.frombytes(
                    "RGB", (pix.width, pix.height), pix.samples
                ) as image:
                    page_text = _extract_text_from_image_obj(image, config=config, timeout=timeout//len(pdf_document))
                    full_text.append(page_text)

        logger.info(
            f"OCR: Odczyt PDF (stron: {len(pdf_document)}) zakończony sukcesem."
        )
        return "\n".join(full_text)

    except TimeoutError:
        logger.error("OCR: Timeout podczas przetwarzania PDF")
        return None
    except Exception as e:
        logger.error(f"Błąd podczas przetwarzania PDF: {e}")
        return None
