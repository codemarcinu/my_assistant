from __future__ import annotations

from typing import (Any, AsyncGenerator, Callable, Coroutine, Dict, List,
                    Optional, Union)

from datetime import datetime
from sqlalchemy import JSON, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from backend.core.database import Base

class RAGDocument(Base):
    __tablename__ = "rag_documents"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    doc_metadata: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=True)
    embedding_vector: Mapped[List[float]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "content": self.content,
            "doc_metadata": self.doc_metadata,
            "embedding_vector": self.embedding_vector,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
