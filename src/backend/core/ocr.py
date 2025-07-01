import io
import logging
import tempfile
import tracemalloc
import threading
import time
from typing import Any, Dict, List, Optional
import cv2
import numpy as np

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
        return r"--oem 1 --psm 6"  # Zmieniono na LSTM (oem 1) zgodnie z rekomendacjami

    def _get_tesseract_config(self) -> str:
        """Generuje konfigurację Tesseract z uwzględnieniem języków i optymalizacji dla paragonów"""
        # Specjalna konfiguracja dla paragonów polskich sklepów - ulepszona zgodnie z rekomendacjami audytu
        receipt_config = (
            "--oem 1 --psm 6 "  # LSTM engine, uniform block of text
            "-c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            "abcdefghijklmnopqrstuvwxyzĄĆĘŁŃÓŚŹŻąćęłńóśźż.,:-/%()[] "
            "-c tessedit_pageseg_mode=6 "  # Uniform block of text
            "-c tessedit_ocr_engine_mode=1 "  # LSTM only
            "-c preserve_interword_spaces=1 "  # Zachowaj spacje między słowami
            "-c textord_heavy_nr=1 "  # Lepsze rozpoznawanie numerów
            "-c textord_min_linesize=2.0 "  # Minimalny rozmiar linii
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
        """Fallback configuration without language specification - ulepszona wersja"""
        return (
            "--oem 1 --psm 6 "
            "-c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            "abcdefghijklmnopqrstuvwxyzĄĆĘŁŃÓŚŹŻąćęłńóśźż.,:-/%()[] "
            "-c tessedit_pageseg_mode=6 "
            "-c tessedit_ocr_engine_mode=1 "
            "-c preserve_interword_spaces=1 "
            "-c textord_heavy_nr=1 "
            "-c textord_min_linesize=2.0 "
        )

    def _detect_receipt_contour(self, image: np.ndarray) -> Optional[np.ndarray]:
        """Wykrywa kontur paragonu i koryguje perspektywę - ulepszona wersja"""
        try:
            # Konwersja do skali szarości
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Zastosuj Gaussian blur aby zredukować szum
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            
            # Wykryj krawędzie z lepszymi parametrami
            edges = cv2.Canny(blurred, 30, 200, apertureSize=3)
            
            # Morfologiczne operacje aby połączyć krawędzie
            kernel = np.ones((3, 3), np.uint8)
            edges = cv2.dilate(edges, kernel, iterations=1)
            edges = cv2.erode(edges, kernel, iterations=1)
            
            # Znajdź kontury
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if not contours:
                logger.info("Nie znaleziono konturów w obrazie")
                return None
            
            # Znajdź największy kontur (prawdopodobnie paragon)
            largest_contour = max(contours, key=cv2.contourArea)
            
            # Sprawdź czy kontur ma odpowiedni rozmiar (min 15% obrazu)
            contour_area = cv2.contourArea(largest_contour)
            image_area = image.shape[0] * image.shape[1]
            
            if contour_area < image_area * 0.15:
                logger.info(f"Kontur za mały: {contour_area/image_area:.2%} obrazu")
                return None
            
            # Aproksymuj kontur do wielokąta z lepszą tolerancją
            epsilon = 0.03 * cv2.arcLength(largest_contour, True)
            approx = cv2.approxPolyDP(largest_contour, epsilon, True)
            
            # Jeśli mamy 4 punkty, to prawdopodobnie prostokąt (paragon)
            if len(approx) == 4:
                logger.info("Znaleziono prostokątny kontur paragonu")
                return approx
            
            # Jeśli mamy więcej punktów, spróbuj znaleźć najlepszy prostokąt
            if len(approx) > 4:
                # Znajdź najmniejszy prostokąt zawierający kontur
                rect = cv2.minAreaRect(largest_contour)
                box = cv2.boxPoints(rect)
                box = np.int0(box)
                logger.info("Użyto minimalnego prostokąta zawierającego")
                return box
            
            logger.info(f"Nieprawidłowa liczba punktów konturu: {len(approx)}")
            return None
            
        except Exception as e:
            logger.warning(f"Błąd podczas wykrywania konturu: {e}")
            return None

    def _perspective_correction(self, image: np.ndarray, contour: np.ndarray) -> np.ndarray:
        """Koryguje perspektywę paragonu - ulepszona wersja"""
        try:
            # Sortuj punkty konturu
            pts = contour.reshape(4, 2)
            rect = np.zeros((4, 2), dtype="float32")
            
            # Suma współrzędnych (lewy górny)
            s = pts.sum(axis=1)
            rect[0] = pts[np.argmin(s)]
            rect[2] = pts[np.argmax(s)]
            
            # Różnica współrzędnych (prawy górny)
            diff = np.diff(pts, axis=1)
            rect[1] = pts[np.argmin(diff)]
            rect[3] = pts[np.argmax(diff)]
            
            # Oblicz wymiary nowego obrazu
            widthA = np.sqrt(((rect[2][0] - rect[3][0]) ** 2) + ((rect[2][1] - rect[3][1]) ** 2))
            widthB = np.sqrt(((rect[1][0] - rect[0][0]) ** 2) + ((rect[1][1] - rect[0][1]) ** 2))
            maxWidth = max(int(widthA), int(widthB))
            
            heightA = np.sqrt(((rect[1][0] - rect[2][0]) ** 2) + ((rect[1][1] - rect[2][1]) ** 2))
            heightB = np.sqrt(((rect[0][0] - rect[3][0]) ** 2) + ((rect[0][1] - rect[3][1]) ** 2))
            maxHeight = max(int(heightA), int(heightB))
            
            # Punkty docelowe
            dst = np.array([
                [0, 0],
                [maxWidth - 1, 0],
                [maxWidth - 1, maxHeight - 1],
                [0, maxHeight - 1]
            ], dtype="float32")
            
            # Oblicz macierz transformacji
            M = cv2.getPerspectiveTransform(rect, dst)
            
            # Zastosuj transformację
            warped = cv2.warpPerspective(image, M, (maxWidth, maxHeight))
            
            logger.info(f"Korekcja perspektywy: {image.shape} -> {warped.shape}")
            return warped
            
        except Exception as e:
            logger.warning(f"Błąd podczas korekcji perspektywy: {e}")
            return image

    def _adaptive_threshold(self, image: np.ndarray) -> np.ndarray:
        """Zastosuj adaptacyjny threshold dla lepszego kontrastu - ulepszona wersja"""
        try:
            # Konwersja do skali szarości jeśli potrzebne
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image
            
            # Zastosuj CLAHE (Contrast Limited Adaptive Histogram Equalization)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
            enhanced = clahe.apply(gray)
            
            # Zastosuj adaptacyjny threshold
            thresh = cv2.adaptiveThreshold(
                enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 2
            )
            
            # Morfologiczne operacje aby usunąć szum i połączyć linie
            kernel = np.ones((2, 2), np.uint8)
            thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
            thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
            
            return thresh
            
        except Exception as e:
            logger.warning(f"Błąd podczas adaptacyjnego threshold: {e}")
            return image

    def _scale_to_300_dpi(self, image: np.ndarray) -> np.ndarray:
        """Skaluje obraz do 300 DPI dla lepszego OCR - ulepszona wersja"""
        try:
            # Oblicz wymagany rozmiar dla 300 DPI
            # 300 DPI = 118.11 pikseli na cm
            # Standardowy paragon: 80mm x 200mm = 8cm x 20cm
            target_width = int(8.0 * 118.11)  # ~945 pikseli
            target_height = int(20.0 * 118.11)  # ~2362 pikseli
            
            # Zachowaj proporcje oryginalnego obrazu
            h, w = image.shape[:2]
            aspect_ratio = w / h
            
            if aspect_ratio > 1:  # Szeroki obraz
                new_width = target_width
                new_height = int(target_width / aspect_ratio)
            else:  # Wysoki obraz
                new_height = target_height
                new_width = int(target_height * aspect_ratio)
            
            # Skaluj obraz z wysoką jakością
            scaled = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_LANCZOS4)
            
            logger.info(f"Skalowanie do 300 DPI: {image.shape} -> {scaled.shape}")
            return scaled
            
        except Exception as e:
            logger.warning(f"Błąd podczas skalowania do 300 DPI: {e}")
            return image

    def _enhance_contrast_and_sharpness(self, image: np.ndarray) -> np.ndarray:
        """Zwiększa kontrast i ostrość obrazu"""
        try:
            # Zwiększenie kontrastu
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image
            enhanced = clahe.apply(gray)
            
            # Zwiększenie ostrości
            kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
            sharpened = cv2.filter2D(enhanced, -1, kernel)
            
            # Dodatkowe ulepszenie kontrastu
            enhanced_final = cv2.convertScaleAbs(sharpened, alpha=1.2, beta=10)
            
            return enhanced_final
            
        except Exception as e:
            logger.warning(f"Błąd podczas ulepszania kontrastu i ostrości: {e}")
            return image

    def _preprocess_receipt_image(self, image: Image.Image) -> Image.Image:
        """Zaawansowany preprocessing obrazu paragonu dla lepszego OCR - ulepszona wersja"""
        try:
            # Konwersja PIL Image do OpenCV format
            if image.mode == 'RGBA':
                image = image.convert('RGB')
            
            # Konwersja do numpy array
            img_array = np.array(image)
            
            # Konwersja RGB do BGR (OpenCV format)
            if len(img_array.shape) == 3:
                img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
            
            # 1. Wykryj kontur paragonu
            contour = self._detect_receipt_contour(img_array)
            
            # 2. Korekcja perspektywy jeśli wykryto kontur
            if contour is not None:
                img_array = self._perspective_correction(img_array, contour)
                logger.info("Zastosowano korekcję perspektywy")
            
            # 3. Skaluj do 300 DPI
            img_array = self._scale_to_300_dpi(img_array)
            logger.info("Przeskalowano do 300 DPI")
            
            # 4. Ulepsz kontrast i ostrość
            img_array = self._enhance_contrast_and_sharpness(img_array)
            logger.info("Ulepszono kontrast i ostrość")
            
            # 5. Adaptacyjny threshold
            img_array = self._adaptive_threshold(img_array)
            logger.info("Zastosowano adaptacyjny threshold")
            
            # Konwersja z powrotem do PIL Image
            processed_image = Image.fromarray(img_array)
            
            logger.info(
                "Preprocessing obrazu zakończony",
                extra={
                    "original_size": image.size,
                    "processed_size": processed_image.size,
                    "contour_detected": contour is not None
                }
            )
            
            return processed_image
            
        except Exception as e:
            logger.error(f"Błąd podczas preprocessingu obrazu: {e}")
            return image

    def process_image(
        self, image_bytes: bytes, config: Optional[str] = None
    ) -> OCRResult:
        """Przetwarza obraz na tekst z context managerem i preprocessingiem - ulepszona wersja"""
        start_time = time.time()
        preprocessing_steps = []
        
        try:
            with Image.open(io.BytesIO(image_bytes)) as image:
                # Log original image metadata
                original_metadata = {
                    "size": image.size,
                    "mode": image.mode,
                    "format": image.format,
                    "file_size_bytes": len(image_bytes)
                }
                
                # Preprocessing obrazu dla lepszego OCR
                processed_image = self._preprocess_receipt_image(image)
                preprocessing_steps.append("image_preprocessing")
                
                # Log preprocessing metadata
                preprocessing_metadata = {
                    "original_size": original_metadata["size"],
                    "processed_size": processed_image.size,
                    "preprocessing_steps": preprocessing_steps
                }

                config = config or self._get_tesseract_config()
                
                # Log Tesseract configuration
                logger.info(
                    "Rozpoczynam OCR z ulepszoną konfiguracją",
                    extra={
                        "tesseract_config": config,
                        "languages": self.languages,
                        "preprocessing_applied": True
                    }
                )
                
                data = pytesseract.image_to_data(
                    processed_image, config=config, output_type=pytesseract.Output.DICT
                )

                text = "\n".join([line for line in data["text"] if line.strip()])
                avg_conf = (
                    sum(conf for conf in data["conf"] if conf > 0) / len(data["conf"])
                    if data["conf"]
                    else 0
                )

                # Calculate processing time
                processing_time = time.time() - start_time
                
                # Enhanced metadata
                enhanced_metadata = {
                    "source": "image",
                    "pages": 1,
                    "language": self.languages[0] if self.languages else "unknown",
                    "preprocessing_applied": True,
                    "preprocessing_steps": preprocessing_steps,
                    "original_metadata": original_metadata,
                    "preprocessing_metadata": preprocessing_metadata,
                    "tesseract_config": config,
                    "processing_time_seconds": processing_time,
                    "text_blocks": len([line for line in data["text"] if line.strip()]),
                    "confidence_distribution": {
                        "high": len([conf for conf in data["conf"] if conf > 80]),
                        "medium": len([conf for conf in data["conf"] if 50 <= conf <= 80]),
                        "low": len([conf for conf in data["conf"] if conf < 50])
                    }
                }

                logger.info(
                    "OCR przetwarzanie obrazu zakończone pomyślnie",
                    extra={
                        "confidence": avg_conf,
                        "text_length": len(text),
                        "language": self.languages[0] if self.languages else "unknown",
                        "processing_time_seconds": processing_time,
                        "preprocessing_steps": preprocessing_steps,
                        "text_blocks": enhanced_metadata["text_blocks"]
                    },
                )

                return OCRResult(
                    text=text,
                    confidence=avg_conf,
                    metadata=enhanced_metadata,
                )
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error(
                f"OCR image processing error: {e}",
                extra={
                    "processing_time_seconds": processing_time,
                    "preprocessing_steps": preprocessing_steps,
                    "error_type": type(e).__name__
                }
            )
            return OCRResult(
                text="", 
                confidence=0, 
                metadata={
                    "error": str(e),
                    "processing_time_seconds": processing_time,
                    "preprocessing_steps": preprocessing_steps
                }
            )

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
