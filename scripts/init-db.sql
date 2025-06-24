-- FoodSave AI - Database Initialization Script
-- Skrypt inicjalizacji bazy danych dla środowiska development

-- Tworzenie rozszerzeń
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Tworzenie schematów
CREATE SCHEMA IF NOT EXISTS foodsave;
CREATE SCHEMA IF NOT EXISTS monitoring;

-- Ustawienie domyślnego schematu
SET search_path TO foodsave, public;

-- Tabela użytkowników
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_superuser BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela konwersacji
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela wiadomości
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela produktów w spiżarni
CREATE TABLE IF NOT EXISTS pantry_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50),
    category VARCHAR(100),
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela paragonów
CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    ocr_text TEXT,
    extracted_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela dokumentów RAG
CREATE TABLE IF NOT EXISTS rag_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    file_path VARCHAR(500),
    content TEXT,
    metadata JSONB,
    embedding_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela logów aplikacji
CREATE TABLE IF NOT EXISTS application_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    module VARCHAR(100),
    function_name VARCHAR(100),
    line_number INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- Tabela metryk wydajności
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(20),
    tags JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indeksy dla lepszej wydajności
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_pantry_items_user_id ON pantry_items(user_id);
CREATE INDEX IF NOT EXISTS idx_pantry_items_expiry_date ON pantry_items(expiry_date);
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_rag_documents_user_id ON rag_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_rag_documents_category ON rag_documents(category);
CREATE INDEX IF NOT EXISTS idx_application_logs_timestamp ON application_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_application_logs_level ON application_logs(level);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(metric_name);

-- Indeksy GIN dla wyszukiwania pełnotekstowego
CREATE INDEX IF NOT EXISTS idx_messages_content_gin ON messages USING gin(to_tsvector('polish', content));
CREATE INDEX IF NOT EXISTS idx_rag_documents_content_gin ON rag_documents USING gin(to_tsvector('polish', content));
CREATE INDEX IF NOT EXISTS idx_application_logs_message_gin ON application_logs USING gin(to_tsvector('polish', message));

-- Indeksy GIN dla JSONB
CREATE INDEX IF NOT EXISTS idx_receipts_extracted_data_gin ON receipts USING gin(extracted_data);
CREATE INDEX IF NOT EXISTS idx_rag_documents_metadata_gin ON rag_documents USING gin(metadata);
CREATE INDEX IF NOT EXISTS idx_application_logs_metadata_gin ON application_logs USING gin(metadata);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_tags_gin ON performance_metrics USING gin(tags);

-- Funkcja do aktualizacji updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggery dla automatycznej aktualizacji updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pantry_items_updated_at BEFORE UPDATE ON pantry_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rag_documents_updated_at BEFORE UPDATE ON rag_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Wstawienie danych testowych (tylko dla development)
DO $$
BEGIN
    -- Sprawdź czy istnieją już dane testowe
    IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'test_user') THEN
        -- Użytkownik testowy
        INSERT INTO users (username, email, hashed_password, is_active) VALUES
        ('test_user', 'test@foodsave.ai', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i', true);
        
        -- Konwersacja testowa
        INSERT INTO conversations (user_id, title) 
        SELECT id, 'Testowa konwersacja' FROM users WHERE username = 'test_user';
        
        -- Wiadomości testowe
        INSERT INTO messages (conversation_id, role, content)
        SELECT 
            c.id,
            'user',
            'Cześć! Jak mogę Ci pomóc?'
        FROM conversations c
        JOIN users u ON c.user_id = u.id
        WHERE u.username = 'test_user';
        
        INSERT INTO messages (conversation_id, role, content)
        SELECT 
            c.id,
            'assistant',
            'Witaj! Jestem FoodSave AI, Twój asystent do zarządzania spiżarnią i paragonami. Mogę pomóc Ci w: 1) Dodawaniu produktów do spiżarni, 2) Analizie paragonów, 3) Wyszukiwaniu w dokumentach RAG, 4) Planowaniu zakupów. Jak mogę Ci dzisiaj pomóc?'
        FROM conversations c
        JOIN users u ON c.user_id = u.id
        WHERE u.username = 'test_user';
        
        -- Produkty testowe w spiżarni
        INSERT INTO pantry_items (user_id, name, quantity, unit, category, expiry_date)
        SELECT 
            u.id,
            'Mleko',
            2.0,
            'l',
            'Nabiał',
            CURRENT_DATE + INTERVAL '7 days'
        FROM users u
        WHERE u.username = 'test_user';
        
        INSERT INTO pantry_items (user_id, name, quantity, unit, category, expiry_date)
        SELECT 
            u.id,
            'Chleb',
            1.0,
            'szt',
            'Pieczywo',
            CURRENT_DATE + INTERVAL '3 days'
        FROM users u
        WHERE u.username = 'test_user';
        
        INSERT INTO pantry_items (user_id, name, quantity, unit, category, expiry_date)
        SELECT 
            u.id,
            'Jabłka',
            2.5,
            'kg',
            'Owoce',
            CURRENT_DATE + INTERVAL '14 days'
        FROM users u
        WHERE u.username = 'test_user';
        
        -- Dokument RAG testowy
        INSERT INTO rag_documents (user_id, name, category, content, metadata)
        SELECT 
            u.id,
            'Przepis na zupę pomidorową',
            'Przepisy',
            'Składniki: 1 kg pomidorów, 1 cebula, 2 ząbki czosnku, sól, pieprz. Przygotowanie: Umyj pomidory, pokrój cebulę i czosnek. Usmaż cebulę na oleju, dodaj pomidory i czosnek. Gotuj 20 minut. Zmiksuj blenderem. Dodaj sól i pieprz do smaku.',
            '{"author": "FoodSave AI", "difficulty": "łatwy", "time": "30 minut"}'
        FROM users u
        WHERE u.username = 'test_user';
        
        RAISE NOTICE 'Dane testowe zostały dodane pomyślnie.';
    ELSE
        RAISE NOTICE 'Dane testowe już istnieją, pomijam wstawianie.';
    END IF;
END $$;

-- Ustawienie uprawnień
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA foodsave TO foodsave;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA foodsave TO foodsave;
GRANT ALL PRIVILEGES ON SCHEMA foodsave TO foodsave;

-- Komentarze do tabel
COMMENT ON TABLE users IS 'Tabela użytkowników systemu FoodSave AI';
COMMENT ON TABLE conversations IS 'Tabela konwersacji czatu';
COMMENT ON TABLE messages IS 'Tabela wiadomości w konwersacjach';
COMMENT ON TABLE pantry_items IS 'Tabela produktów w spiżarni użytkownika';
COMMENT ON TABLE receipts IS 'Tabela przesłanych paragonów';
COMMENT ON TABLE rag_documents IS 'Tabela dokumentów dla systemu RAG';
COMMENT ON TABLE application_logs IS 'Tabela logów aplikacji';
COMMENT ON TABLE performance_metrics IS 'Tabela metryk wydajności';

RAISE NOTICE 'Baza danych FoodSave AI została zainicjalizowana pomyślnie!'; 