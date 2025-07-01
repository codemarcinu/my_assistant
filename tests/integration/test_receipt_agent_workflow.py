"""
Testy integracyjne dla agentowego workflow'u przetwarzania paragonów.
"""

import io
from unittest.mock import AsyncMock, Mock, patch
import pytest
from fastapi.testclient import TestClient

from backend.agents.interfaces import AgentResponse
from backend.agents.receipt_import_agent import ReceiptImportAgent
from backend.agents.receipt_validation_agent import ReceiptValidationAgent
from backend.agents.receipt_categorization_agent import ReceiptCategorizationAgent
from backend.main import app


class TestReceiptAgentWorkflow:
    """Testy dla agentowego workflow'u przetwarzania paragonów."""

    @pytest.fixture
    def client(self):
        """Tworzy klienta testowego."""
        return TestClient(app)

    @pytest.fixture
    def sample_receipt_image_bytes(self):
        """Tworzy przykładowe bajty obrazu paragonu."""
        # Symuluj bajty obrazu paragonu
        return b"fake_receipt_image_bytes"

    @pytest.fixture
    def mock_ocr_text(self):
        """Mock tekstu OCR z paragonu."""
        return """Lidl sp. z o.o.
        ul. Testowa 123, 00-000 Warszawa
        NIP: 123-456-78-90
        
        Mleko 3,2% 1L 4,99 zł
        Chleb żytni 3,50 zł
        Jogurt naturalny 2,99 zł
        
        RAZEM: 11,48 zł
        VAT: 2,23 zł
        Data: 2024-01-15 14:30:25"""

    @pytest.fixture
    def mock_validation_result(self):
        """Mock wyniku walidacji paragonu."""
        return {
            "is_valid": True,
            "score": 85.5,
            "should_proceed": True,
            "warnings": ["NIP format could be improved"],
            "recommendations": ["Consider retaking photo for better NIP clarity"]
        }

    @pytest.fixture
    def mock_categorization_result(self):
        """Mock wyniku kategoryzacji produktów."""
        return {
            "products": [
                {
                    "name": "Mleko 3,2% 1L",
                    "quantity": 1,
                    "unit_price": 4.99,
                    "total_price": 4.99,
                    "category": "Dairy Products",
                    "confidence": 0.95
                },
                {
                    "name": "Chleb żytni",
                    "quantity": 1,
                    "unit_price": 3.50,
                    "total_price": 3.50,
                    "category": "Bakery",
                    "confidence": 0.88
                },
                {
                    "name": "Jogurt naturalny",
                    "quantity": 1,
                    "unit_price": 2.99,
                    "total_price": 2.99,
                    "category": "Dairy Products",
                    "confidence": 0.92
                }
            ],
            "total_amount": 11.48,
            "store_name": "Lidl",
            "date": "2024-01-15"
        }

    @pytest.mark.asyncio
    async def test_receipt_import_agent_success(self, sample_receipt_image_bytes):
        """Test pomyślnego działania ReceiptImportAgent."""
        with patch('backend.agents.receipt_import_agent.OCRProcessor') as mock_ocr:
            # Mock OCR processor
            mock_ocr_instance = Mock()
            mock_ocr_instance.process_image.return_value = Mock(
                text="Lidl sp. z o.o.\nMleko 3,2% 1L 4,99 zł",
                confidence=85.5,
                metadata={"preprocessing_applied": True}
            )
            mock_ocr.return_value = mock_ocr_instance

            agent = ReceiptImportAgent()
            result = await agent.process(sample_receipt_image_bytes)

            assert result.success is True
            assert "Lidl sp. z o.o." in result.text
            assert "Mleko 3,2% 1L 4,99 zł" in result.text
            assert result.metadata["confidence"] == 85.5
            assert result.metadata["preprocessing_applied"] is True

    @pytest.mark.asyncio
    async def test_receipt_import_agent_ocr_failure(self, sample_receipt_image_bytes):
        """Test błędu OCR w ReceiptImportAgent."""
        with patch('backend.agents.receipt_import_agent.OCRProcessor') as mock_ocr:
            # Mock OCR failure
            mock_ocr_instance = Mock()
            mock_ocr_instance.process_image.side_effect = Exception("OCR processing failed")
            mock_ocr.return_value = mock_ocr_instance

            agent = ReceiptImportAgent()
            result = await agent.process(sample_receipt_image_bytes)

            assert result.success is False
            assert "OCR processing failed" in result.error

    @pytest.mark.asyncio
    async def test_receipt_validation_agent_success(self, mock_ocr_text):
        """Test pomyślnego działania ReceiptValidationAgent."""
        agent = ReceiptValidationAgent()
        result = await agent.process(mock_ocr_text)

        assert result.success is True
        assert result.data["is_valid"] is True
        assert result.data["score"] > 0
        assert result.data["should_proceed"] is True
        assert "store_name" in result.data
        assert "total_amount" in result.data
        assert "date" in result.data

    @pytest.mark.asyncio
    async def test_receipt_validation_agent_invalid_receipt(self):
        """Test walidacji nieprawidłowego paragonu."""
        invalid_text = "Invalid receipt text without proper structure"
        
        agent = ReceiptValidationAgent()
        result = await agent.process(invalid_text)

        assert result.success is True
        assert result.data["is_valid"] is False
        assert result.data["score"] < 50
        assert result.data["should_proceed"] is False
        assert len(result.data["warnings"]) > 0

    @pytest.mark.asyncio
    async def test_receipt_validation_agent_nip_validation(self):
        """Test walidacji NIP."""
        text_with_valid_nip = """Lidl sp. z o.o.
        NIP: 123-456-78-90
        Mleko 3,2% 1L 4,99 zł
        RAZEM: 4,99 zł"""

        text_with_invalid_nip = """Lidl sp. z o.o.
        NIP: 123-456-78-XX
        Mleko 3,2% 1L 4,99 zł
        RAZEM: 4,99 zł"""

        agent = ReceiptValidationAgent()
        
        # Test z poprawnym NIP
        result_valid = await agent.process(text_with_valid_nip)
        assert result_valid.data["nip_valid"] is True
        
        # Test z niepoprawnym NIP
        result_invalid = await agent.process(text_with_invalid_nip)
        assert result_invalid.data["nip_valid"] is False

    @pytest.mark.asyncio
    async def test_receipt_categorization_agent_success(self, mock_ocr_text):
        """Test pomyślnego działania ReceiptCategorizationAgent."""
        with patch('backend.agents.receipt_categorization_agent.BielikAIClient') as mock_bielik:
            # Mock Bielik AI response
            mock_bielik_instance = Mock()
            mock_bielik_instance.categorize_products.return_value = {
                "products": [
                    {
                        "name": "Mleko 3,2% 1L",
                        "category": "Dairy Products",
                        "confidence": 0.95
                    }
                ]
            }
            mock_bielik.return_value = mock_bielik_instance

            agent = ReceiptCategorizationAgent()
            result = await agent.process(mock_ocr_text)

            assert result.success is True
            assert "products" in result.data
            assert len(result.data["products"]) > 0
            assert "category" in result.data["products"][0]
            assert "confidence" in result.data["products"][0]

    @pytest.mark.asyncio
    async def test_receipt_categorization_agent_fallback_to_dictionary(self, mock_ocr_text):
        """Test fallback do słownika kategorii."""
        with patch('backend.agents.receipt_categorization_agent.BielikAIClient') as mock_bielik:
            # Mock Bielik AI failure
            mock_bielik_instance = Mock()
            mock_bielik_instance.categorize_products.side_effect = Exception("Bielik AI unavailable")
            mock_bielik.return_value = mock_bielik_instance

            agent = ReceiptCategorizationAgent()
            result = await agent.process(mock_ocr_text)

            assert result.success is True
            assert "products" in result.data
            assert len(result.data["products"]) > 0
            # Sprawdź czy użyto fallback dictionary
            assert result.metadata["categorization_method"] == "dictionary_fallback"

    @pytest.mark.asyncio
    async def test_complete_workflow_success(
        self, client, sample_receipt_image_bytes, mock_ocr_text, 
        mock_validation_result, mock_categorization_result
    ):
        """Test kompletnego workflow'u przetwarzania paragonu."""
        with patch('backend.agents.receipt_import_agent.OCRProcessor') as mock_ocr, \
             patch('backend.agents.receipt_validation_agent.ReceiptValidationAgent.process') as mock_validation, \
             patch('backend.agents.receipt_categorization_agent.ReceiptCategorizationAgent.process') as mock_categorization:
            
            # Mock OCR
            mock_ocr_instance = Mock()
            mock_ocr_instance.process_image.return_value = Mock(
                text=mock_ocr_text,
                confidence=85.5,
                metadata={"preprocessing_applied": True}
            )
            mock_ocr.return_value = mock_ocr_instance

            # Mock validation
            mock_validation.return_value = AgentResponse(
                success=True,
                data=mock_validation_result
            )

            # Mock categorization
            mock_categorization.return_value = AgentResponse(
                success=True,
                data=mock_categorization_result
            )

            # Test endpoint
            files = {"file": ("receipt.jpg", sample_receipt_image_bytes, "image/jpeg")}
            response = client.post("/api/v2/receipts/receipts/process", files=files)

            assert response.status_code == 200
            data = response.json()

            assert data["status_code"] == 200
            assert "ocr_text" in data["data"]
            assert "validation" in data["data"]
            assert "categorization" in data["data"]
            assert data["data"]["validation"]["is_valid"] is True
            assert len(data["data"]["categorization"]["products"]) == 3

    @pytest.mark.asyncio
    async def test_workflow_validation_failure(
        self, client, sample_receipt_image_bytes, mock_ocr_text
    ):
        """Test workflow'u z błędem walidacji."""
        with patch('backend.agents.receipt_import_agent.OCRProcessor') as mock_ocr, \
             patch('backend.agents.receipt_validation_agent.ReceiptValidationAgent.process') as mock_validation:
            
            # Mock OCR success
            mock_ocr_instance = Mock()
            mock_ocr_instance.process_image.return_value = Mock(
                text=mock_ocr_text,
                confidence=85.5,
                metadata={"preprocessing_applied": True}
            )
            mock_ocr.return_value = mock_ocr_instance

            # Mock validation failure
            mock_validation.return_value = AgentResponse(
                success=True,
                data={
                    "is_valid": False,
                    "score": 25.0,
                    "should_proceed": False,
                    "warnings": ["Invalid receipt format", "Missing total amount"],
                    "recommendations": ["Please retake photo with better quality"]
                }
            )

            files = {"file": ("receipt.jpg", sample_receipt_image_bytes, "image/jpeg")}
            response = client.post("/api/v2/receipts/receipts/process", files=files)

            assert response.status_code == 422
            data = response.json()
            assert "Receipt validation failed" in data["detail"]
            assert "Invalid receipt format" in data["detail"]

    @pytest.mark.asyncio
    async def test_workflow_categorization_failure(
        self, client, sample_receipt_image_bytes, mock_ocr_text, mock_validation_result
    ):
        """Test workflow'u z błędem kategoryzacji."""
        with patch('backend.agents.receipt_import_agent.OCRProcessor') as mock_ocr, \
             patch('backend.agents.receipt_validation_agent.ReceiptValidationAgent.process') as mock_validation, \
             patch('backend.agents.receipt_categorization_agent.ReceiptCategorizationAgent.process') as mock_categorization:
            
            # Mock OCR success
            mock_ocr_instance = Mock()
            mock_ocr_instance.process_image.return_value = Mock(
                text=mock_ocr_text,
                confidence=85.5,
                metadata={"preprocessing_applied": True}
            )
            mock_ocr.return_value = mock_ocr_instance

            # Mock validation success
            mock_validation.return_value = AgentResponse(
                success=True,
                data=mock_validation_result
            )

            # Mock categorization failure
            mock_categorization.return_value = AgentResponse(
                success=False,
                error="Categorization service unavailable"
            )

            files = {"file": ("receipt.jpg", sample_receipt_image_bytes, "image/jpeg")}
            response = client.post("/api/v2/receipts/receipts/process", files=files)

            assert response.status_code == 422
            data = response.json()
            assert "Receipt categorization failed" in data["detail"]

    @pytest.mark.asyncio
    async def test_agent_error_handling_and_recovery(self, sample_receipt_image_bytes):
        """Test obsługi błędów i odzyskiwania w agentach."""
        # Test ReceiptImportAgent z błędem i retry
        with patch('backend.agents.receipt_import_agent.OCRProcessor') as mock_ocr:
            mock_ocr_instance = Mock()
            # Pierwszy call zwraca błąd, drugi sukces
            mock_ocr_instance.process_image.side_effect = [
                Exception("Temporary OCR error"),
                Mock(text="Success text", confidence=90.0, metadata={})
            ]
            mock_ocr.return_value = mock_ocr_instance

            agent = ReceiptImportAgent()
            result = await agent.process(sample_receipt_image_bytes)

            # Sprawdź czy agent obsłużył błąd i kontynuował
            assert result.success is True
            assert "Success text" in result.text

    @pytest.mark.asyncio
    async def test_agent_metadata_tracking(self, mock_ocr_text):
        """Test śledzenia metadanych w agentach."""
        # Test ReceiptValidationAgent z metadanymi
        agent = ReceiptValidationAgent()
        result = await agent.process(mock_ocr_text)

        assert result.success is True
        assert "processing_time" in result.metadata
        assert "validation_steps" in result.metadata
        assert "confidence_scores" in result.metadata

    @pytest.mark.asyncio
    async def test_agent_performance_monitoring(self, mock_ocr_text):
        """Test monitorowania wydajności agentów."""
        import time
        
        # Test czasu przetwarzania ReceiptValidationAgent
        start_time = time.time()
        agent = ReceiptValidationAgent()
        result = await agent.process(mock_ocr_text)
        end_time = time.time()
        
        processing_time = end_time - start_time
        
        assert result.success is True
        assert result.metadata["processing_time"] > 0
        assert result.metadata["processing_time"] < 10.0  # Nie powinno trwać dłużej niż 10s
        assert abs(result.metadata["processing_time"] - processing_time) < 1.0

    @pytest.mark.asyncio
    async def test_agent_concurrent_processing(self, mock_ocr_text):
        """Test współbieżnego przetwarzania przez agentów."""
        import asyncio
        
        # Test współbieżnego przetwarzania przez ReceiptValidationAgent
        agent = ReceiptValidationAgent()
        
        # Uruchom kilka zadań współbieżnie
        tasks = [
            agent.process(mock_ocr_text),
            agent.process(mock_ocr_text),
            agent.process(mock_ocr_text)
        ]
        
        results = await asyncio.gather(*tasks)
        
        # Sprawdź czy wszystkie zadania zakończyły się sukcesem
        for result in results:
            assert result.success is True
            assert result.data["is_valid"] is True

    @pytest.mark.asyncio
    async def test_agent_memory_management(self, mock_ocr_text):
        """Test zarządzania pamięcią przez agentów."""
        import gc
        
        # Test ReceiptCategorizationAgent z zarządzaniem pamięcią
        with patch('backend.agents.receipt_categorization_agent.BielikAIClient') as mock_bielik:
            mock_bielik_instance = Mock()
            mock_bielik_instance.categorize_products.return_value = {
                "products": [{"name": "Test", "category": "Test", "confidence": 0.9}]
            }
            mock_bielik.return_value = mock_bielik_instance

            agent = ReceiptCategorizationAgent()
            
            # Wykonaj kilka operacji
            for _ in range(5):
                result = await agent.process(mock_ocr_text)
                assert result.success is True
            
            # Sprawdź czy nie ma wycieków pamięci
            gc.collect()
            # Tu można dodać dodatkowe sprawdzenia pamięci jeśli potrzebne

    @pytest.mark.asyncio
    async def test_agent_configuration_validation(self):
        """Test walidacji konfiguracji agentów."""
        # Test ReceiptValidationAgent z nieprawidłową konfiguracją
        agent = ReceiptValidationAgent()
        
        # Sprawdź czy agent ma wymagane atrybuty
        assert hasattr(agent, 'name')
        assert hasattr(agent, 'description')
        assert hasattr(agent, 'process')
        
        # Sprawdź czy agent ma poprawną konfigurację
        assert agent.name == "ReceiptValidationAgent"
        assert "validation" in agent.description.lower()

    @pytest.mark.asyncio
    async def test_agent_response_format_consistency(self, mock_ocr_text):
        """Test spójności formatu odpowiedzi agentów."""
        # Test wszystkich agentów
        agents = [
            ReceiptValidationAgent(),
            ReceiptCategorizationAgent()
        ]
        
        for agent in agents:
            result = await agent.process(mock_ocr_text)
            
            # Sprawdź spójny format odpowiedzi
            assert hasattr(result, 'success')
            assert hasattr(result, 'data')
            assert hasattr(result, 'metadata')
            assert hasattr(result, 'error')
            
            # Sprawdź typy danych
            assert isinstance(result.success, bool)
            assert isinstance(result.data, dict)
            assert isinstance(result.metadata, dict)
            assert isinstance(result.error, (str, type(None))) 