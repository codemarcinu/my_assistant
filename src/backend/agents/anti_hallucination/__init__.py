"""
Anti-hallucination system for data analysis agents.

This module provides comprehensive mechanisms to prevent hallucinations in AI agents:
- Confidence scoring and progressive validation
- Structured outputs with JSON Schema validation
- Multi-agent consensus and cross-validation
- RAG-based grounding for data verification
- Calibrated confidence scoring
- Real-time hallucination monitoring
"""

from .confidence_scorer import ConfidenceScorer
from .structured_output_validator import StructuredOutputValidator
from .consensus_validator import ConsensusValidator
from .hallucination_monitor import HallucinationMonitor
from .validation_pipeline import ReceiptValidationPipeline
from .enhanced_ocr_agent import EnhancedOCRAgent
from .enhanced_receipt_analysis_agent import EnhancedReceiptAnalysisAgent

__all__ = [
    "ConfidenceScorer",
    "StructuredOutputValidator", 
    "ConsensusValidator",
    "HallucinationMonitor",
    "ReceiptValidationPipeline",
    "EnhancedOCRAgent",
    "EnhancedReceiptAnalysisAgent",
] 