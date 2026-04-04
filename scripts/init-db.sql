-- МосЗапрос Database Schema
-- Run this script to initialize the database structure

-- Enable UUID extension if needed
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication and personalization
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(500) NOT NULL,
    organization VARCHAR(500),
    role VARCHAR(50) DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'admin')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- STE (Standard Trade Unit) table
-- Note: This table should already exist in your database
-- If not, uncomment and run:
/*
CREATE TABLE IF NOT EXISTS ste (
    ste_id BIGINT PRIMARY KEY,
    ste_name VARCHAR(2000) NOT NULL,
    okpd2_code VARCHAR(50),
    okpd2_name VARCHAR(1000),
    unit VARCHAR(100),
    category VARCHAR(255)
);
*/

-- Contracts table
-- Note: This table should already exist in your database
-- If not, uncomment and run:
/*
CREATE TABLE IF NOT EXISTS contracts (
    contract_name VARCHAR(2000),
    contract_id BIGINT PRIMARY KEY,
    ste_id BIGINT,
    contract_date TIMESTAMP,
    contract_amount NUMERIC,
    inn_buyer BIGINT,
    buyer_name VARCHAR(2000),
    buyer_region VARCHAR(500),
    inn_seller BIGINT,
    seller_name VARCHAR(2000),
    seller_region VARCHAR(500),
    FOREIGN KEY (ste_id) REFERENCES ste(ste_id)
);
*/

-- Search history table for tracking user searches
CREATE TABLE IF NOT EXISTS search_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    filters JSONB DEFAULT '{}',
    results_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Interactions table for personalization
CREATE TABLE IF NOT EXISTS interactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    ste_id BIGINT REFERENCES ste(ste_id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('view', 'click', 'positive', 'negative', 'purchase')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- User preferences computed from interactions
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(255),
    preference_score NUMERIC DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, category)
);

-- Synonyms dictionary for search expansion
CREATE TABLE IF NOT EXISTS synonyms (
    id SERIAL PRIMARY KEY,
    word VARCHAR(255) NOT NULL,
    synonym VARCHAR(255) NOT NULL,
    UNIQUE(word, synonym)
);

-- Insert default synonyms
INSERT INTO synonyms (word, synonym) VALUES
    ('бумага', 'бумажный'),
    ('бумага', 'писчая'),
    ('бумага', 'офисная'),
    ('бумага', 'ватман'),
    ('компьютер', 'пк'),
    ('компьютер', 'ноутбук'),
    ('компьютер', 'эвм'),
    ('компьютер', 'системный блок'),
    ('принтер', 'мфу'),
    ('принтер', 'печатающее устройство'),
    ('стол', 'столик'),
    ('стол', 'парта'),
    ('стол', 'рабочее место'),
    ('стул', 'кресло'),
    ('стул', 'табурет'),
    ('канцелярия', 'канцтовары'),
    ('канцелярия', 'офисные принадлежности'),
    ('медицина', 'медицинский'),
    ('медицина', 'лекарства'),
    ('медицина', 'препараты'),
    ('лампа', 'светильник'),
    ('лампа', 'освещение'),
    ('шкаф', 'тумба'),
    ('шкаф', 'гардероб'),
    ('монитор', 'дисплей'),
    ('монитор', 'экран'),
    ('маска', 'респиратор'),
    ('перчатки', 'рукавицы'),
    ('дезинфектор', 'антисептик'),
    ('дезинфектор', 'санитайзер')
ON CONFLICT (word, synonym) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at);
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_ste_id ON interactions(ste_id);
CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_synonyms_word ON synonyms(word);

-- Full-text search index on STE names (Russian configuration)
-- Uncomment if you have Russian full-text search configured:
-- CREATE INDEX IF NOT EXISTS idx_ste_name_fts ON ste USING gin(to_tsvector('russian', ste_name));

-- Add category column to STE if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ste' AND column_name = 'category') THEN
        ALTER TABLE ste ADD COLUMN category VARCHAR(255);
    END IF;
END $$;

-- Trigger to update user_preferences on new interactions
CREATE OR REPLACE FUNCTION update_user_preferences()
RETURNS TRIGGER AS $$
DECLARE
    v_category VARCHAR(255);
    v_score NUMERIC;
BEGIN
    -- Get category from STE
    SELECT category INTO v_category FROM ste WHERE ste_id = NEW.ste_id;
    
    IF v_category IS NOT NULL THEN
        -- Calculate score based on interaction type
        v_score := CASE NEW.interaction_type
            WHEN 'purchase' THEN 5
            WHEN 'positive' THEN 3
            WHEN 'click' THEN 2
            WHEN 'view' THEN 1
            WHEN 'negative' THEN -2
            ELSE 0
        END;
        
        -- Upsert preference
        INSERT INTO user_preferences (user_id, category, preference_score, updated_at)
        VALUES (NEW.user_id, v_category, v_score, NOW())
        ON CONFLICT (user_id, category) 
        DO UPDATE SET 
            preference_score = user_preferences.preference_score + v_score,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_preferences ON interactions;
CREATE TRIGGER trg_update_preferences
    AFTER INSERT ON interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_preferences();

-- Grant permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

COMMIT;
