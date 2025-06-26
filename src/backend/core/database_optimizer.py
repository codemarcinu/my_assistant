"""
Optymalizacja zapytań do bazy danych dla poprawy wydajności
"""

import asyncio
import logging
from typing import Any, Dict, List, Optional
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

class DatabaseOptimizer:
    """
    Klasa do optymalizacji zapytań do bazy danych.
    Implementuje eager loading, paginację i cache'owanie.
    """
    
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
    
    async def get_conversations_with_messages(
        self, 
        session_id: str, 
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Pobiera konwersacje z wiadomościami z optymalizacją.
        
        Args:
            session_id: ID sesji
            limit: Maksymalna liczba wiadomości
            offset: Offset dla paginacji
            
        Returns:
            Lista konwersacji z wiadomościami
        """
        from backend.models.conversation import Conversation, Message
        
        try:
            # Użyj joinedload dla eager loading wiadomości
            stmt = (
                select(Conversation)
                .options(joinedload(Conversation.messages))
                .where(Conversation.session_id == session_id)
                .order_by(Conversation.created_at.desc())
                .limit(limit)
                .offset(offset)
            )
            
            result = await self.session.execute(stmt)
            conversations = result.scalars().unique().all()
            
            # Konwertuj do słowników z optymalizacją
            return [
                {
                    "id": conv.id,
                    "session_id": conv.session_id,
                    "created_at": conv.created_at.isoformat(),
                    "messages": [
                        {
                            "id": msg.id,
                            "content": msg.content,
                            "role": msg.role,
                            "timestamp": msg.timestamp.isoformat()
                        }
                        for msg in conv.messages
                    ]
                }
                for conv in conversations
            ]
            
        except Exception as e:
            logger.error(f"Error fetching conversations: {e}")
            return []
    
    async def get_rag_documents_optimized(
        self,
        limit: int = 100,
        offset: int = 0,
        include_content: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Pobiera dokumenty RAG z optymalizacją.
        
        Args:
            limit: Maksymalna liczba dokumentów
            offset: Offset dla paginacji
            include_content: Czy dołączyć treść dokumentu
            
        Returns:
            Lista dokumentów RAG
        """
        from backend.models.rag_document import RAGDocument
        
        try:
            # Wybierz tylko potrzebne kolumny
            columns = [
                RAGDocument.id,
                RAGDocument.content,
                RAGDocument.doc_metadata,
                RAGDocument.created_at,
                RAGDocument.updated_at
            ]
            
            if include_content:
                columns.append(RAGDocument.content)
            
            stmt = (
                select(*columns)
                .order_by(RAGDocument.created_at.desc())
                .limit(limit)
                .offset(offset)
            )
            
            result = await self.session.execute(stmt)
            documents = result.all()
            
            def get_title(doc):
                if hasattr(doc, 'doc_metadata') and doc.doc_metadata and isinstance(doc.doc_metadata, dict):
                    return doc.doc_metadata.get('title', None)
                return None
            
            return [
                {
                    "id": doc.id,
                    "title": get_title(doc),
                    "content": doc.content if include_content else None,
                    "created_at": doc.created_at.isoformat() if doc.created_at else None,
                    "updated_at": doc.updated_at.isoformat() if doc.updated_at else None,
                }
                for doc in documents
            ]
            
        except Exception as e:
            logger.error(f"Error fetching RAG documents: {e}")
            return []
    
    async def get_user_profiles_optimized(
        self,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Pobiera profile użytkowników z optymalizacją.
        
        Args:
            limit: Maksymalna liczba profili
            offset: Offset dla paginacji
            
        Returns:
            Lista profili użytkowników
        """
        from backend.models.user_profile import UserProfile
        
        try:
            stmt = (
                select(UserProfile)
                .order_by(UserProfile.created_at.desc())
                .limit(limit)
                .offset(offset)
            )
            
            result = await self.session.execute(stmt)
            profiles = result.scalars().all()
            
            return [
                {
                    "id": profile.id,
                    "user_id": profile.user_id,
                    "preferences": profile.preferences,
                    "created_at": profile.created_at.isoformat(),
                    "updated_at": profile.updated_at.isoformat()
                }
                for profile in profiles
            ]
            
        except Exception as e:
            logger.error(f"Error fetching user profiles: {e}")
            return []
    
    async def get_statistics(self) -> Dict[str, Any]:
        """
        Pobiera statystyki bazy danych z optymalizacją.
        
        Returns:
            Słownik ze statystykami
        """
        try:
            from backend.models.conversation import Conversation, Message
            from backend.models.rag_document import RAGDocument
            from backend.models.user_profile import UserProfile
            
            # Wykonaj zapytania równolegle
            tasks = [
                self._count_table(Conversation),
                self._count_table(Message),
                self._count_table(RAGDocument),
                self._count_table(UserProfile)
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            return {
                "conversations_count": results[0] if not isinstance(results[0], Exception) else 0,
                "messages_count": results[1] if not isinstance(results[1], Exception) else 0,
                "rag_documents_count": results[2] if not isinstance(results[2], Exception) else 0,
                "user_profiles_count": results[3] if not isinstance(results[3], Exception) else 0
            }
            
        except Exception as e:
            logger.error(f"Error fetching statistics: {e}")
            return {}
    
    async def _count_table(self, model_class: Any) -> int:
        """Liczy rekordy w tabeli."""
        try:
            stmt = select(func.count(model_class.id))
            result = await self.session.execute(stmt)
            return result.scalar() or 0
        except Exception as e:
            logger.error(f"Error counting {model_class.__name__}: {e}")
            return 0
    
    async def cleanup_old_data(self, days: int = 30) -> Dict[str, int]:
        """
        Czyści stare dane z bazy danych.
        
        Args:
            days: Liczba dni do zachowania
            
        Returns:
            Słownik z liczbą usuniętych rekordów
        """
        from datetime import datetime, timedelta
        from backend.models.conversation import Conversation, Message
        
        try:
            cutoff_date = datetime.now() - timedelta(days=days)
            
            # Usuń stare wiadomości
            old_messages_stmt = (
                select(Message)
                .where(Message.timestamp < cutoff_date)
            )
            result = await self.session.execute(old_messages_stmt)
            old_messages = result.scalars().all()
            
            deleted_messages = 0
            for msg in old_messages:
                await self.session.delete(msg)
                deleted_messages += 1
            
            # Usuń puste konwersacje
            empty_conversations_stmt = (
                select(Conversation)
                .outerjoin(Message)
                .where(Message.id.is_(None))
            )
            result = await self.session.execute(empty_conversations_stmt)
            empty_conversations = result.scalars().all()
            
            deleted_conversations = 0
            for conv in empty_conversations:
                await self.session.delete(conv)
                deleted_conversations += 1
            
            await self.session.commit()
            
            return {
                "deleted_messages": deleted_messages,
                "deleted_conversations": deleted_conversations
            }
            
        except Exception as e:
            logger.error(f"Error cleaning up old data: {e}")
            await self.session.rollback()
            return {"deleted_messages": 0, "deleted_conversations": 0} 