"""
Testy wydajnościowe dla ulepszonego pipeline'u OCR z zaawansowanym preprocessingiem.
"""

import asyncio
import time
from unittest.mock import Mock, patch
import pytest
import numpy as np
from PIL import Image

from backend.core.ocr import OCRProcessor
from backend.agents.receipt_import_agent import ReceiptImportAgent
from backend.agents.receipt_validation_agent import ReceiptValidationAgent
from backend.agents.receipt_categorization_agent import ReceiptCategorizationAgent


class TestOCRPerformanceEnhanced:
    """Testy wydajnościowe dla ulepszonego OCR."""

    @pytest.fixture
    def ocr_processor(self):
        """Tworzy instancję OCRProcessor do testów."""
        return OCRProcessor()

    @pytest.fixture
    def sample_receipt_images(self):
        """Tworzy przykładowe obrazy paragonów o różnych rozmiarach."""
        images = []
        
        # Mały obraz (400x300)
        small_image = Image.new("RGB", (400, 300), "white")
        images.append(small_image)
        
        # Średni obraz (800x600)
        medium_image = Image.new("RGB", (800, 600), "white")
        images.append(medium_image)
        
        # Duży obraz (1600x1200)
        large_image = Image.new("RGB", (1600, 1200), "white")
        images.append(large_image)
        
        # Bardzo duży obraz (3200x2400)
        very_large_image = Image.new("RGB", (3200, 2400), "white")
        images.append(very_large_image)
        
        return images

    @pytest.fixture
    def sample_receipt_image_bytes(self):
        """Tworzy bajty przykładowego obrazu paragonu."""
        image = Image.new("RGB", (800, 600), "white")
        import io
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format="PNG")
        return img_byte_arr.getvalue()

    def test_contour_detection_performance(self, ocr_processor, sample_receipt_images):
        """Test wydajności detekcji konturów dla różnych rozmiarów obrazów."""
        with patch('backend.core.ocr.cv2') as mock_cv2:
            # Mock OpenCV functions
            mock_cv2.findContours.return_value = ([], None)
            mock_cv2.boundingRect.return_value = (0, 0, 100, 100)
            mock_cv2.cvtColor.return_value = np.array(Image.new("RGB", (100, 100), "white"))
            mock_cv2.COLOR_RGB2GRAY = 7
            
            results = {}
            
            for i, image in enumerate(sample_receipt_images):
                start_time = time.time()
                
                # Wykonaj detekcję konturów
                result = ocr_processor._detect_receipt_contour(image)
                
                end_time = time.time()
                processing_time = end_time - start_time
                
                results[f"image_{i}_{image.size[0]}x{image.size[1]}"] = {
                    "processing_time": processing_time,
                    "image_size": image.size,
                    "pixel_count": image.size[0] * image.size[1]
                }
                
                # Sprawdź czy czas przetwarzania jest rozsądny
                assert processing_time < 1.0, f"Contour detection took too long: {processing_time}s"
            
            # Wyświetl wyniki
            print("\nContour Detection Performance Results:")
            for name, data in results.items():
                pixels_per_second = data["pixel_count"] / data["processing_time"]
                print(f"{name}: {data['processing_time']:.3f}s ({pixels_per_second:.0f} pixels/s)")

    def test_perspective_correction_performance(self, ocr_processor):
        """Test wydajności korekcji perspektywy."""
        with patch('backend.core.ocr.cv2') as mock_cv2:
            # Mock OpenCV functions
            mock_cv2.getPerspectiveTransform.return_value = np.eye(3)
            mock_cv2.warpPerspective.return_value = np.array(Image.new("RGB", (400, 300), "white"))
            
            # Test różnych rozmiarów obrazów
            image_sizes = [(400, 300), (800, 600), (1600, 1200)]
            
            for width, height in image_sizes:
                image = Image.new("RGB", (width, height), "white")
                contour_points = np.array([[0, 0], [width, 0], [width, height], [0, height]], dtype=np.int32)
                
                start_time = time.time()
                
                result = ocr_processor._correct_perspective(image, contour_points)
                
                end_time = time.time()
                processing_time = end_time - start_time
                
                # Sprawdź czy czas przetwarzania jest rozsądny
                assert processing_time < 0.5, f"Perspective correction took too long: {processing_time}s"
                
                print(f"Perspective correction {width}x{height}: {processing_time:.3f}s")

    def test_adaptive_thresholding_performance(self, ocr_processor):
        """Test wydajności adaptacyjnego progowania."""
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
            
            # Test różnych rozmiarów obrazów
            image_sizes = [(400, 300), (800, 600), (1600, 1200)]
            
            for width, height in image_sizes:
                image = Image.new("L", (width, height), 128)
                
                start_time = time.time()
                
                result = ocr_processor._apply_adaptive_thresholding(image)
                
                end_time = time.time()
                processing_time = end_time - start_time
                
                # Sprawdź czy czas przetwarzania jest rozsądny
                assert processing_time < 0.3, f"Adaptive thresholding took too long: {processing_time}s"
                
                print(f"Adaptive thresholding {width}x{height}: {processing_time:.3f}s")

    def test_300_dpi_scaling_performance(self, ocr_processor):
        """Test wydajności skalowania do 300 DPI."""
        # Test różnych rozmiarów obrazów
        image_sizes = [(200, 150), (400, 300), (800, 600), (1600, 1200)]
        
        for width, height in image_sizes:
            image = Image.new("RGB", (width, height), "white")
            
            start_time = time.time()
            
            result = ocr_processor._scale_to_300_dpi(image)
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            # Sprawdź czy czas przetwarzania jest rozsądny
            assert processing_time < 0.2, f"300 DPI scaling took too long: {processing_time}s"
            
            print(f"300 DPI scaling {width}x{height}: {processing_time:.3f}s")

    @patch("backend.core.ocr.pytesseract")
    def test_full_preprocessing_pipeline_performance(
        self, mock_tesseract, ocr_processor, sample_receipt_image_bytes
    ):
        """Test wydajności całego pipeline'u preprocessingu."""
        # Mock Tesseract
        mock_data = {
            "text": ["Test", "receipt", "text"],
            "conf": [90, 85, 80]
        }
        mock_tesseract.image_to_data.return_value = mock_data
        mock_tesseract.Output.DICT = "dict"
        
        # Mock OpenCV functions
        with patch('backend.core.ocr.cv2') as mock_cv2:
            mock_cv2.findContours.return_value = ([], None)
            mock_cv2.boundingRect.return_value = (0, 0, 800, 600)
            mock_cv2.cvtColor.return_value = np.array(Image.new("RGB", (800, 600), "white"))
            mock_cv2.COLOR_RGB2GRAY = 7
            mock_cv2.getPerspectiveTransform.return_value = np.eye(3)
            mock_cv2.warpPerspective.return_value = np.array(Image.new("RGB", (800, 600), "white"))
            mock_cv2.createCLAHE.return_value = Mock()
            mock_cv2.morphologyEx.return_value = np.array(Image.new("L", (800, 600), 128))
            mock_cv2.MORPH_CLOSE = 3
            mock_cv2.getStructuringElement.return_value = np.ones((3, 3))
            mock_cv2.MORPH_RECT = 0
            
            start_time = time.time()
            
            result = ocr_processor.process_image(sample_receipt_image_bytes)
            
            end_time = time.time()
            total_processing_time = end_time - start_time
            
            # Sprawdź czy całkowity czas przetwarzania jest rozsądny
            assert total_processing_time < 2.0, f"Full pipeline took too long: {total_processing_time}s"
            
            print(f"Full preprocessing pipeline: {total_processing_time:.3f}s")
            
            # Sprawdź metadane czasowe
            assert "preprocessing_time" in result.metadata
            assert result.metadata["preprocessing_time"] > 0
            assert result.metadata["preprocessing_time"] < total_processing_time

    @pytest.mark.asyncio
    async def test_agent_workflow_performance(self, sample_receipt_image_bytes):
        """Test wydajności całego workflow'u agentów."""
        # Mock OCR agent
        with patch('backend.agents.receipt_import_agent.OCRProcessor') as mock_ocr:
            mock_ocr_instance = Mock()
            mock_ocr_instance.process_image.return_value = Mock(
                text="Lidl sp. z o.o.\nMleko 3,2% 1L 4,99 zł",
                confidence=85.5,
                metadata={"preprocessing_applied": True}
            )
            mock_ocr.return_value = mock_ocr_instance
            
            # Mock validation agent
            with patch('backend.agents.receipt_validation_agent.ReceiptValidationAgent.process') as mock_validation:
                mock_validation.return_value = Mock(
                    success=True,
                    data={
                        "is_valid": True,
                        "score": 85.5,
                        "should_proceed": True
                    }
                )
                
                # Mock categorization agent
                with patch('backend.agents.receipt_categorization_agent.ReceiptCategorizationAgent.process') as mock_categorization:
                    mock_categorization.return_value = Mock(
                        success=True,
                        data={
                            "products": [{"name": "Test", "category": "Test", "confidence": 0.9}]
                        }
                    )
                    
                    start_time = time.time()
                    
                    # Wykonaj workflow
                    import_agent = ReceiptImportAgent()
                    validation_agent = ReceiptValidationAgent()
                    categorization_agent = ReceiptCategorizationAgent()
                    
                    # Import
                    import_result = await import_agent.process(sample_receipt_image_bytes)
                    
                    # Validation
                    validation_result = await validation_agent.process(import_result.text)
                    
                    # Categorization
                    categorization_result = await categorization_agent.process(import_result.text)
                    
                    end_time = time.time()
                    total_workflow_time = end_time - start_time
                    
                    # Sprawdź czy czas workflow'u jest rozsądny
                    assert total_workflow_time < 5.0, f"Agent workflow took too long: {total_workflow_time}s"
                    
                    print(f"Complete agent workflow: {total_workflow_time:.3f}s")

    def test_memory_usage_during_preprocessing(self, ocr_processor, sample_receipt_image_bytes):
        """Test użycia pamięci podczas preprocessingu."""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # Mock OpenCV functions
        with patch('backend.core.ocr.cv2') as mock_cv2:
            mock_cv2.findContours.return_value = ([], None)
            mock_cv2.boundingRect.return_value = (0, 0, 800, 600)
            mock_cv2.cvtColor.return_value = np.array(Image.new("RGB", (800, 600), "white"))
            mock_cv2.COLOR_RGB2GRAY = 7
            mock_cv2.getPerspectiveTransform.return_value = np.eye(3)
            mock_cv2.warpPerspective.return_value = np.array(Image.new("RGB", (800, 600), "white"))
            mock_cv2.createCLAHE.return_value = Mock()
            mock_cv2.morphologyEx.return_value = np.array(Image.new("L", (800, 600), 128))
            mock_cv2.MORPH_CLOSE = 3
            mock_cv2.getStructuringElement.return_value = np.ones((3, 3))
            mock_cv2.MORPH_RECT = 0
            
            # Wykonaj preprocessing
            with patch("backend.core.ocr.pytesseract") as mock_tesseract:
                mock_tesseract.image_to_data.return_value = {"text": ["test"], "conf": [90]}
                mock_tesseract.Output.DICT = "dict"
                
                result = ocr_processor.process_image(sample_receipt_image_bytes)
        
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory
        
        # Sprawdź czy wzrost użycia pamięci jest rozsądny (< 100MB)
        assert memory_increase < 100, f"Memory usage increased too much: {memory_increase:.1f}MB"
        
        print(f"Memory usage increase: {memory_increase:.1f}MB")

    def test_concurrent_processing_performance(self, ocr_processor):
        """Test wydajności przetwarzania współbieżnego."""
        async def process_single_image(image_bytes):
            with patch("backend.core.ocr.pytesseract") as mock_tesseract, \
                 patch('backend.core.ocr.cv2') as mock_cv2:
                
                mock_tesseract.image_to_data.return_value = {"text": ["test"], "conf": [90]}
                mock_tesseract.Output.DICT = "dict"
                mock_cv2.findContours.return_value = ([], None)
                mock_cv2.boundingRect.return_value = (0, 0, 800, 600)
                mock_cv2.cvtColor.return_value = np.array(Image.new("RGB", (800, 600), "white"))
                mock_cv2.COLOR_RGB2GRAY = 7
                mock_cv2.getPerspectiveTransform.return_value = np.eye(3)
                mock_cv2.warpPerspective.return_value = np.array(Image.new("RGB", (800, 600), "white"))
                mock_cv2.createCLAHE.return_value = Mock()
                mock_cv2.morphologyEx.return_value = np.array(Image.new("L", (800, 600), 128))
                mock_cv2.MORPH_CLOSE = 3
                mock_cv2.getStructuringElement.return_value = np.ones((3, 3))
                mock_cv2.MORPH_RECT = 0
                
                return ocr_processor.process_image(image_bytes)
        
        # Tworzy kilka obrazów testowych
        test_images = []
        for i in range(5):
            image = Image.new("RGB", (800, 600), "white")
            import io
            img_byte_arr = io.BytesIO()
            image.save(img_byte_arr, format="PNG")
            test_images.append(img_byte_arr.getvalue())
        
        # Test przetwarzania sekwencyjnego
        start_time = time.time()
        sequential_results = []
        for image_bytes in test_images:
            result = asyncio.run(process_single_image(image_bytes))
            sequential_results.append(result)
        sequential_time = time.time() - start_time
        
        # Test przetwarzania współbieżnego
        start_time = time.time()
        concurrent_results = asyncio.run(asyncio.gather(*[
            process_single_image(image_bytes) for image_bytes in test_images
        ]))
        concurrent_time = time.time() - start_time
        
        # Sprawdź czy przetwarzanie współbieżne jest szybsze
        assert concurrent_time < sequential_time, "Concurrent processing should be faster"
        
        print(f"Sequential processing: {sequential_time:.3f}s")
        print(f"Concurrent processing: {concurrent_time:.3f}s")
        print(f"Speedup: {sequential_time / concurrent_time:.2f}x")

    def test_large_batch_processing_performance(self, ocr_processor):
        """Test wydajności przetwarzania dużych partii obrazów."""
        # Tworzy dużą partię obrazów
        batch_size = 20
        test_images = []
        
        for i in range(batch_size):
            image = Image.new("RGB", (800, 600), "white")
            import io
            img_byte_arr = io.BytesIO()
            image.save(img_byte_arr, format="PNG")
            test_images.append(img_byte_arr.getvalue())
        
        # Mock OpenCV functions
        with patch('backend.core.ocr.cv2') as mock_cv2:
            mock_cv2.findContours.return_value = ([], None)
            mock_cv2.boundingRect.return_value = (0, 0, 800, 600)
            mock_cv2.cvtColor.return_value = np.array(Image.new("RGB", (800, 600), "white"))
            mock_cv2.COLOR_RGB2GRAY = 7
            mock_cv2.getPerspectiveTransform.return_value = np.eye(3)
            mock_cv2.warpPerspective.return_value = np.array(Image.new("RGB", (800, 600), "white"))
            mock_cv2.createCLAHE.return_value = Mock()
            mock_cv2.morphologyEx.return_value = np.array(Image.new("L", (800, 600), 128))
            mock_cv2.MORPH_CLOSE = 3
            mock_cv2.getStructuringElement.return_value = np.ones((3, 3))
            mock_cv2.MORPH_RECT = 0
            
            start_time = time.time()
            
            results = ocr_processor.process_images_batch(test_images)
            
            end_time = time.time()
            batch_processing_time = end_time - start_time
            
            # Sprawdź czy czas przetwarzania partii jest rozsądny
            assert batch_processing_time < 30.0, f"Batch processing took too long: {batch_processing_time}s"
            assert len(results) == batch_size
            
            avg_time_per_image = batch_processing_time / batch_size
            print(f"Batch processing {batch_size} images: {batch_processing_time:.3f}s")
            print(f"Average time per image: {avg_time_per_image:.3f}s")

    def test_accuracy_vs_performance_tradeoff(self, ocr_processor, sample_receipt_image_bytes):
        """Test kompromisu między dokładnością a wydajnością."""
        # Test różnych poziomów preprocessingu
        preprocessing_levels = ["minimal", "standard", "enhanced", "maximum"]
        
        results = {}
        
        for level in preprocessing_levels:
            with patch("backend.core.ocr.pytesseract") as mock_tesseract, \
                 patch('backend.core.ocr.cv2') as mock_cv2:
                
                # Mock różne poziomy dokładności
                if level == "minimal":
                    mock_tesseract.image_to_data.return_value = {"text": ["test"], "conf": [70]}
                elif level == "standard":
                    mock_tesseract.image_to_data.return_value = {"text": ["test"], "conf": [80]}
                elif level == "enhanced":
                    mock_tesseract.image_to_data.return_value = {"text": ["test"], "conf": [90]}
                else:  # maximum
                    mock_tesseract.image_to_data.return_value = {"text": ["test"], "conf": [95]}
                
                mock_tesseract.Output.DICT = "dict"
                
                # Mock OpenCV functions
                mock_cv2.findContours.return_value = ([], None)
                mock_cv2.boundingRect.return_value = (0, 0, 800, 600)
                mock_cv2.cvtColor.return_value = np.array(Image.new("RGB", (800, 600), "white"))
                mock_cv2.COLOR_RGB2GRAY = 7
                mock_cv2.getPerspectiveTransform.return_value = np.eye(3)
                mock_cv2.warpPerspective.return_value = np.array(Image.new("RGB", (800, 600), "white"))
                mock_cv2.createCLAHE.return_value = Mock()
                mock_cv2.morphologyEx.return_value = np.array(Image.new("L", (800, 600), 128))
                mock_cv2.MORPH_CLOSE = 3
                mock_cv2.getStructuringElement.return_value = np.ones((3, 3))
                mock_cv2.MORPH_RECT = 0
                
                start_time = time.time()
                
                result = ocr_processor.process_image(sample_receipt_image_bytes)
                
                end_time = time.time()
                processing_time = end_time - start_time
                
                results[level] = {
                    "processing_time": processing_time,
                    "confidence": result.confidence,
                    "accuracy_score": result.confidence / 100.0
                }
        
        # Wyświetl wyniki
        print("\nAccuracy vs Performance Tradeoff:")
        for level, data in results.items():
            efficiency = data["accuracy_score"] / data["processing_time"]
            print(f"{level}: {data['processing_time']:.3f}s, {data['confidence']:.1f}% confidence, efficiency: {efficiency:.2f}")

    def test_resource_utilization_under_load(self, ocr_processor):
        """Test wykorzystania zasobów pod obciążeniem."""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        
        # Monitoruj zasoby przed testem
        initial_cpu_percent = process.cpu_percent()
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # Symuluj obciążenie
        test_images = []
        for i in range(10):
            image = Image.new("RGB", (800, 600), "white")
            import io
            img_byte_arr = io.BytesIO()
            image.save(img_byte_arr, format="PNG")
            test_images.append(img_byte_arr.getvalue())
        
        # Mock OpenCV functions
        with patch('backend.core.ocr.cv2') as mock_cv2:
            mock_cv2.findContours.return_value = ([], None)
            mock_cv2.boundingRect.return_value = (0, 0, 800, 600)
            mock_cv2.cvtColor.return_value = np.array(Image.new("RGB", (800, 600), "white"))
            mock_cv2.COLOR_RGB2GRAY = 7
            mock_cv2.getPerspectiveTransform.return_value = np.eye(3)
            mock_cv2.warpPerspective.return_value = np.array(Image.new("RGB", (800, 600), "white"))
            mock_cv2.createCLAHE.return_value = Mock()
            mock_cv2.morphologyEx.return_value = np.array(Image.new("L", (800, 600), 128))
            mock_cv2.MORPH_CLOSE = 3
            mock_cv2.getStructuringElement.return_value = np.ones((3, 3))
            mock_cv2.MORPH_RECT = 0
            
            # Wykonaj przetwarzanie pod obciążeniem
            with patch("backend.core.ocr.pytesseract") as mock_tesseract:
                mock_tesseract.image_to_data.return_value = {"text": ["test"], "conf": [90]}
                mock_tesseract.Output.DICT = "dict"
                
                start_time = time.time()
                
                for image_bytes in test_images:
                    result = ocr_processor.process_image(image_bytes)
                
                end_time = time.time()
                processing_time = end_time - start_time
        
        # Monitoruj zasoby po teście
        final_cpu_percent = process.cpu_percent()
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        cpu_increase = final_cpu_percent - initial_cpu_percent
        memory_increase = final_memory - initial_memory
        
        # Sprawdź czy wykorzystanie zasobów jest rozsądne
        assert memory_increase < 200, f"Memory usage increased too much: {memory_increase:.1f}MB"
        assert processing_time < 20.0, f"Processing under load took too long: {processing_time}s"
        
        print(f"CPU usage increase: {cpu_increase:.1f}%")
        print(f"Memory usage increase: {memory_increase:.1f}MB")
        print(f"Processing time under load: {processing_time:.3f}s") 