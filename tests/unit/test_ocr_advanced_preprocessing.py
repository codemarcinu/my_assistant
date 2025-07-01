"""
Testy dla zaawansowanego preprocessingu OCR z detekcją konturów, korekcją perspektywy i adaptacyjnym progowaniem.
"""

import io
from unittest.mock import MagicMock, Mock, patch
import numpy as np
import pytest
from PIL import Image, ImageEnhance

from backend.core.ocr import OCRProcessor


class TestOCRAdvancedPreprocessing:
    """Testy dla zaawansowanego preprocessingu OCR."""

    @pytest.fixture
    def ocr_processor(self):
        """Tworzy instancję OCRProcessor do testów."""
        return OCRProcessor()

    @pytest.fixture
    def sample_receipt_image(self):
        """Tworzy przykładowy obraz paragonu z konturami."""
        # Tworzy obraz z prostokątnym konturem paragonu
        image = Image.new("RGB", (400, 300), color="white")
        # Dodaj prostokątny kontur paragonu
        for x in range(50, 350):
            for y in range(30, 270):
                if x == 50 or x == 349 or y == 30 or y == 269:
                    image.putpixel((x, y), (0, 0, 0))
        return image

    @pytest.fixture
    def sample_receipt_image_bytes(self):
        """Tworzy bajty przykładowego obrazu paragonu."""
        image = Image.new("RGB", (400, 300), color="white")
        # Dodaj tekst paragonu
        for x in range(100, 300):
            for y in range(100, 200):
                if x % 20 == 0 or y % 20 == 0:
                    image.putpixel((x, y), (0, 0, 0))
        
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format="PNG")
        return img_byte_arr.getvalue()

    def test_enhanced_contour_detection(self, ocr_processor, sample_receipt_image):
        """Test ulepszonej detekcji konturów paragonu."""
        # Mock OpenCV functions
        with patch('backend.core.ocr.cv2') as mock_cv2:
            # Mock contour detection
            mock_contours = [np.array([[50, 30], [350, 30], [350, 270], [50, 270]], dtype=np.int32)]
            mock_cv2.findContours.return_value = (mock_contours, None)
            mock_cv2.contourArea.return_value = 80000  # Duży obszar
            mock_cv2.arcLength.return_value = 1000
            mock_cv2.approxPolyDP.return_value = np.array([[50, 30], [350, 30], [350, 270], [50, 270]], dtype=np.int32)
            mock_cv2.boundingRect.return_value = (50, 30, 300, 240)
            
            # Mock image conversion
            mock_cv2.cvtColor.return_value = np.array(sample_receipt_image)
            mock_cv2.COLOR_RGB2GRAY = 7
            
            result = ocr_processor._detect_receipt_contour(sample_receipt_image)
            
            assert result is not None
            assert len(result) == 4  # 4 punkty dla prostokąta
            mock_cv2.findContours.assert_called_once()

    def test_contour_detection_fallback_to_bounding_rect(self, ocr_processor, sample_receipt_image):
        """Test fallback do minimalnego prostokąta ograniczającego."""
        with patch('backend.core.ocr.cv2') as mock_cv2:
            # Mock brak konturów
            mock_cv2.findContours.return_value = ([], None)
            mock_cv2.boundingRect.return_value = (0, 0, 400, 300)
            
            # Mock image conversion
            mock_cv2.cvtColor.return_value = np.array(sample_receipt_image)
            mock_cv2.COLOR_RGB2GRAY = 7
            
            result = ocr_processor._detect_receipt_contour(sample_receipt_image)
            
            assert result is not None
            # Powinien zwrócić prostokąt ograniczający cały obraz
            assert len(result) == 4

    def test_perspective_correction(self, ocr_processor):
        """Test korekcji perspektywy."""
        # Mock OpenCV functions
        with patch('backend.core.ocr.cv2') as mock_cv2:
            # Mock perspective transform
            mock_cv2.getPerspectiveTransform.return_value = np.eye(3)
            mock_cv2.warpPerspective.return_value = np.array(Image.new("RGB", (400, 300), "white"))
            
            # Mock contour points
            contour_points = np.array([[50, 30], [350, 30], [350, 270], [50, 270]], dtype=np.int32)
            
            result = ocr_processor._correct_perspective(
                Image.new("RGB", (400, 300), "white"), 
                contour_points
            )
            
            assert result is not None
            mock_cv2.getPerspectiveTransform.assert_called_once()
            mock_cv2.warpPerspective.assert_called_once()

    def test_adaptive_thresholding_clahe(self, ocr_processor):
        """Test adaptacyjnego progowania z CLAHE."""
        with patch('backend.core.ocr.cv2') as mock_cv2:
            # Mock CLAHE
            mock_clahe = Mock()
            mock_cv2.createCLAHE.return_value = mock_clahe
            mock_clahe.apply.return_value = np.array(Image.new("L", (400, 300), 128))
            
            # Mock morphological operations
            mock_cv2.morphologyEx.return_value = np.array(Image.new("L", (400, 300), 128))
            mock_cv2.MORPH_CLOSE = 3
            mock_cv2.getStructuringElement.return_value = np.ones((3, 3))
            mock_cv2.MORPH_RECT = 0
            
            image = Image.new("L", (400, 300), 128)
            result = ocr_processor._apply_adaptive_thresholding(image)
            
            assert result is not None
            mock_cv2.createCLAHE.assert_called_once_with(clipLimit=2.0, tileGridSize=(8, 8))
            mock_clahe.apply.assert_called_once()

    def test_300_dpi_scaling(self, ocr_processor):
        """Test skalowania do 300 DPI."""
        # Tworzy mały obraz
        small_image = Image.new("RGB", (200, 150), "white")
        
        result = ocr_processor._scale_to_300_dpi(small_image)
        
        # Sprawdź czy obraz został powiększony
        assert result.size[0] > small_image.size[0]
        assert result.size[1] > small_image.size[1]
        
        # Sprawdź czy proporcje zostały zachowane
        original_ratio = small_image.size[0] / small_image.size[1]
        result_ratio = result.size[0] / result.size[1]
        assert abs(original_ratio - result_ratio) < 0.1

    def test_contrast_enhancement(self, ocr_processor):
        """Test zwiększania kontrastu."""
        # Tworzy obraz o niskim kontraście
        low_contrast_image = Image.new("RGB", (100, 100), (128, 128, 128))
        
        result = ocr_processor._enhance_contrast(low_contrast_image)
        
        assert result is not None
        assert result.size == low_contrast_image.size

    def test_sharpness_enhancement(self, ocr_processor):
        """Test zwiększania ostrości."""
        # Tworzy rozmyty obraz
        blurry_image = Image.new("RGB", (100, 100), "white")
        
        result = ocr_processor._enhance_sharpness(blurry_image)
        
        assert result is not None
        assert result.size == blurry_image.size

    def test_lstm_engine_configuration(self, ocr_processor):
        """Test konfiguracji silnika LSTM."""
        config = ocr_processor._get_default_receipt_config()
        
        # Sprawdź czy używa LSTM engine
        assert "--oem 1" in config  # LSTM engine
        assert "--psm 6" in config  # Uniform block of text
        assert "-l pol" in config   # Polish language

    @patch("backend.core.ocr.pytesseract")
    def test_process_image_with_advanced_preprocessing(
        self, mock_tesseract, ocr_processor, sample_receipt_image_bytes
    ):
        """Test przetwarzania obrazu z zaawansowanym preprocessingiem."""
        # Mock odpowiedzi Tesseract
        mock_data = {
            "text": ["Lidl", "Mleko 3.2% 1L 4,99 PLN", "RAZEM 4,99 PLN"],
            "conf": [95, 90, 85]
        }
        mock_tesseract.image_to_data.return_value = mock_data
        mock_tesseract.Output.DICT = "dict"
        
        # Mock OpenCV functions
        with patch('backend.core.ocr.cv2') as mock_cv2:
            mock_cv2.findContours.return_value = ([], None)
            mock_cv2.boundingRect.return_value = (0, 0, 400, 300)
            mock_cv2.cvtColor.return_value = np.array(Image.new("RGB", (400, 300), "white"))
            mock_cv2.COLOR_RGB2GRAY = 7
            mock_cv2.getPerspectiveTransform.return_value = np.eye(3)
            mock_cv2.warpPerspective.return_value = np.array(Image.new("RGB", (400, 300), "white"))
            mock_cv2.createCLAHE.return_value = Mock()
            mock_cv2.morphologyEx.return_value = np.array(Image.new("L", (400, 300), 128))
            mock_cv2.MORPH_CLOSE = 3
            mock_cv2.getStructuringElement.return_value = np.ones((3, 3))
            mock_cv2.MORPH_RECT = 0
        
        result = ocr_processor.process_image(sample_receipt_image_bytes)
        
        assert result.text == "Lidl\nMleko 3.2% 1L 4,99 PLN\nRAZEM 4,99 PLN"
        assert result.confidence > 0
        assert result.metadata["preprocessing_applied"] is True
        assert "contour_detection" in result.metadata
        assert "perspective_correction" in result.metadata
        assert "adaptive_thresholding" in result.metadata
        assert "dpi_scaling" in result.metadata

    def test_preprocessing_error_handling(self, ocr_processor):
        """Test obsługi błędów podczas preprocessingu."""
        # Symuluj błąd podczas detekcji konturów
        with patch('backend.core.ocr.cv2') as mock_cv2:
            mock_cv2.findContours.side_effect = Exception("OpenCV error")
            
            image = Image.new("RGB", (100, 100), "white")
            result = ocr_processor._detect_receipt_contour(image)
            
            # Powinien zwrócić None w przypadku błędu
            assert result is None

    def test_metadata_tracking(self, ocr_processor):
        """Test śledzenia metadanych preprocessingu."""
        metadata = {}
        
        # Symuluj różne kroki preprocessingu
        ocr_processor._add_preprocessing_step(metadata, "contour_detection", True)
        ocr_processor._add_preprocessing_step(metadata, "perspective_correction", True)
        ocr_processor._add_preprocessing_step(metadata, "adaptive_thresholding", True)
        
        assert metadata["preprocessing_steps"] == [
            "contour_detection",
            "perspective_correction", 
            "adaptive_thresholding"
        ]
        assert metadata["contour_detection"] is True
        assert metadata["perspective_correction"] is True
        assert metadata["adaptive_thresholding"] is True

    def test_confidence_distribution_calculation(self, ocr_processor):
        """Test obliczania rozkładu pewności."""
        # Mock dane pewności
        confidences = [95, 90, 85, 80, 75, 70, 65, 60, 55, 50]
        
        distribution = ocr_processor._calculate_confidence_distribution(confidences)
        
        assert "high_confidence" in distribution
        assert "medium_confidence" in distribution
        assert "low_confidence" in distribution
        assert distribution["high_confidence"] > 0
        assert distribution["medium_confidence"] > 0
        assert distribution["low_confidence"] > 0

    def test_processing_time_tracking(self, ocr_processor):
        """Test śledzenia czasu przetwarzania."""
        metadata = {}
        
        # Symuluj pomiar czasu
        with ocr_processor._measure_processing_time(metadata, "ocr_processing"):
            import time
            time.sleep(0.1)  # Symuluj przetwarzanie
        
        assert "ocr_processing_time" in metadata
        assert metadata["ocr_processing_time"] > 0

    @patch("backend.core.ocr.pytesseract")
    def test_polish_receipt_text_recognition(
        self, mock_tesseract, ocr_processor, sample_receipt_image_bytes
    ):
        """Test rozpoznawania polskiego tekstu paragonu."""
        # Mock polski tekst paragonu
        polish_text = [
            "Lidl sp. z o.o.",
            "Mleko 3,2% 1L 4,99 zł",
            "Chleb żytni 3,50 zł",
            "RAZEM: 8,49 zł",
            "NIP: 123-456-78-90"
        ]
        mock_data = {
            "text": polish_text,
            "conf": [95, 90, 88, 92, 85]
        }
        mock_tesseract.image_to_data.return_value = mock_data
        mock_tesseract.Output.DICT = "dict"
        
        # Mock OpenCV functions
        with patch('backend.core.ocr.cv2') as mock_cv2:
            mock_cv2.findContours.return_value = ([], None)
            mock_cv2.boundingRect.return_value = (0, 0, 400, 300)
            mock_cv2.cvtColor.return_value = np.array(Image.new("RGB", (400, 300), "white"))
            mock_cv2.COLOR_RGB2GRAY = 7
            mock_cv2.getPerspectiveTransform.return_value = np.eye(3)
            mock_cv2.warpPerspective.return_value = np.array(Image.new("RGB", (400, 300), "white"))
            mock_cv2.createCLAHE.return_value = Mock()
            mock_cv2.morphologyEx.return_value = np.array(Image.new("L", (400, 300), 128))
            mock_cv2.MORPH_CLOSE = 3
            mock_cv2.getStructuringElement.return_value = np.ones((3, 3))
            mock_cv2.MORPH_RECT = 0
        
        result = ocr_processor.process_image(sample_receipt_image_bytes)
        
        # Sprawdź czy polskie znaki zostały poprawnie rozpoznane
        assert "Lidl sp. z o.o." in result.text
        assert "Mleko 3,2% 1L 4,99 zł" in result.text
        assert "Chleb żytni 3,50 zł" in result.text
        assert "RAZEM: 8,49 zł" in result.text
        assert "NIP: 123-456-78-90" in result.text
        assert result.metadata["language"] == "pol"

    def test_image_quality_analysis(self, ocr_processor):
        """Test analizy jakości obrazu."""
        # Tworzy obraz o różnej jakości
        good_image = Image.new("RGB", (800, 600), "white")
        poor_image = Image.new("RGB", (200, 150), "gray")
        
        # Test dobrej jakości
        quality_good = ocr_processor._analyze_image_quality(good_image)
        assert quality_good["resolution_score"] > 0.7
        assert quality_good["size_score"] > 0.7
        
        # Test słabej jakości
        quality_poor = ocr_processor._analyze_image_quality(poor_image)
        assert quality_poor["resolution_score"] < 0.5
        assert quality_poor["size_score"] < 0.5

    def test_preprocessing_pipeline_integration(self, ocr_processor):
        """Test integracji całego pipeline'u preprocessingu."""
        # Tworzy obraz testowy
        test_image = Image.new("RGB", (400, 300), "white")
        
        # Mock OpenCV functions
        with patch('backend.core.ocr.cv2') as mock_cv2:
            mock_cv2.findContours.return_value = ([], None)
            mock_cv2.boundingRect.return_value = (0, 0, 400, 300)
            mock_cv2.cvtColor.return_value = np.array(test_image)
            mock_cv2.COLOR_RGB2GRAY = 7
            mock_cv2.getPerspectiveTransform.return_value = np.eye(3)
            mock_cv2.warpPerspective.return_value = np.array(test_image)
            mock_cv2.createCLAHE.return_value = Mock()
            mock_cv2.morphologyEx.return_value = np.array(Image.new("L", (400, 300), 128))
            mock_cv2.MORPH_CLOSE = 3
            mock_cv2.getStructuringElement.return_value = np.ones((3, 3))
            mock_cv2.MORPH_RECT = 0
        
        result = ocr_processor._preprocess_receipt_image(test_image)
        
        assert result is not None
        assert result.mode == "L"  # Skala szarości
        assert result.size[0] > 0 and result.size[1] > 0 