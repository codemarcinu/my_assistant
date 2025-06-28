"""
Migracje bazy danych dla systemu agentowego
"""

import logging
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.database import get_db
from backend.models.conversation import ConversationSession, Conversation, Message

logger = logging.getLogger(__name__)


async def create_conversation_sessions_table():
    """Twórz tabelę conversation_sessions jeśli nie istnieje"""
    try:
        async for db in get_db():
            # Sprawdź czy tabela już istnieje (PostgreSQL)
            result = await db.execute(text("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'conversation_sessions'
            """))
            
            if result.fetchone():
                logger.info("Table conversation_sessions already exists")
                return
            
            # Utwórz tabelę (PostgreSQL syntax)
            await db.execute(text("""
                CREATE TABLE conversation_sessions (
                    id SERIAL PRIMARY KEY,
                    session_id VARCHAR NOT NULL UNIQUE,
                    user_id VARCHAR,
                    summary TEXT,
                    key_points JSONB,
                    topics_discussed JSONB,
                    user_preferences JSONB,
                    conversation_style VARCHAR DEFAULT 'friendly',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_message_count INTEGER DEFAULT 0
                )
            """))
            
            # Utwórz indeksy
            await db.execute(text("""
                CREATE INDEX idx_conversation_sessions_session_id 
                ON conversation_sessions(session_id)
            """))
            
            await db.execute(text("""
                CREATE INDEX idx_conversation_sessions_user_id 
                ON conversation_sessions(user_id)
            """))
            
            await db.execute(text("""
                CREATE INDEX idx_conversation_sessions_updated_at 
                ON conversation_sessions(updated_at)
            """))
            
            await db.commit()
            logger.info("Table conversation_sessions created successfully")
            
    except Exception as e:
        logger.error(f"Error creating conversation_sessions table: {e}")
        if 'db' in locals():
            await db.rollback()
        raise


async def update_existing_tables():
    """Aktualizuj istniejące tabele jeśli potrzeba"""
    try:
        async for db in get_db():
            # Sprawdź czy kolumna message_metadata istnieje w tabeli messages
            result = await db.execute(text("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name='messages' AND table_schema='public'
            """))
            columns = [row[0] for row in result.fetchall()]
            if 'message_metadata' not in columns:
                await db.execute(text("""
                    ALTER TABLE messages ADD COLUMN message_metadata JSONB DEFAULT '{}'
                """))
                logger.info("Added message_metadata column to messages table")
            
            # Sprawdź czy kolumna is_active istnieje w tabeli conversations
            result = await db.execute(text("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name='conversations' AND table_schema='public'
            """))
            columns = [row[0] for row in result.fetchall()]
            if 'is_active' not in columns:
                await db.execute(text("""
                    ALTER TABLE conversations ADD COLUMN is_active BOOLEAN DEFAULT TRUE
                """))
                logger.info("Added is_active column to conversations table")
            
            await db.commit()
            
    except Exception as e:
        logger.error(f"Error updating existing tables: {e}")
        if 'db' in locals():
            await db.rollback()
        raise


async def create_all_tables():
    """Utwórz wszystkie tabele jeśli nie istnieją"""
    try:
        from sqlalchemy import MetaData
        from backend.core.database import engine
        
        # Create all tables using SQLAlchemy metadata
        async with engine.begin() as conn:
            # Import all models to ensure they're registered
            from backend.models.conversation import Base as ConversationBase
            
            # Create tables
            await conn.run_sync(ConversationBase.metadata.create_all)
            
        logger.info("All tables created successfully")
        
    except Exception as e:
        logger.error(f"Error creating tables: {e}")
        raise


async def run_all_migrations():
    """Uruchom wszystkie migracje"""
    logger.info("Starting database migrations...")
    
    try:
        # Utwórz wszystkie tabele
        await create_all_tables()
        
        # Aktualizuj istniejące tabele
        await update_existing_tables()
        
        # Utwórz nową tabelę (jeśli nie istnieje)
        await create_conversation_sessions_table()
        
        logger.info("All migrations completed successfully")
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        raise


async def verify_database_schema():
    """Sprawdź czy schemat bazy danych jest poprawny"""
    try:
        async for db in get_db():
            # Sprawdź tabele (PostgreSQL)
            result = await db.execute(text("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name NOT LIKE 'pg_%'
                ORDER BY table_name
            """))
            tables = [row[0] for row in result.fetchall()]
            
            required_tables = ['conversations', 'messages', 'conversation_sessions']
            missing_tables = [table for table in required_tables if table not in tables]
            
            if missing_tables:
                logger.warning(f"Missing tables: {missing_tables}")
                return False
            
            # Sprawdź kolumny w tabeli messages
            result = await db.execute(text("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name='messages' AND table_schema='public'
            """))
            message_columns = [row[0] for row in result.fetchall()]
            required_message_columns = ['id', 'content', 'role', 'created_at', 'message_metadata', 'conversation_id']
            missing_columns = [col for col in required_message_columns if col not in message_columns]
            if missing_columns:
                logger.warning(f"Missing columns in messages table: {missing_columns}")
                return False
            
            logger.info("Database schema verification passed")
            return True
            
    except Exception as e:
        logger.error(f"Database schema verification failed: {e}")
        return False


if __name__ == "__main__":
    import asyncio
    
    async def main():
        await run_all_migrations()
        await verify_database_schema()
    
    asyncio.run(main()) 