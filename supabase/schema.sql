-- ============================================
-- The Curator AI — Supabase Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Jobs Table
-- ============================================
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Meeting info
    title VARCHAR(500) NOT NULL,
    description TEXT,
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'created'
        CHECK (status IN ('created', 'uploading', 'uploaded', 'queued', 'transcribing', 'summarizing', 'completed', 'failed')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    error_message TEXT,
    
    -- Audio file info
    audio_filename VARCHAR(500),
    audio_size_bytes BIGINT,
    audio_duration_seconds REAL,
    audio_storage_path VARCHAR(1000),  -- Supabase Storage path
    
    -- Results
    transcript TEXT,
    utterances JSONB,           -- speaker diarization: [{speaker, text, start, end}, ...]
    summary JSONB,              -- {overview, key_themes, sentiment, action_items, ...}
    
    -- Language
    language VARCHAR(10) DEFAULT 'auto',  -- 'th', 'en', 'auto'
    detected_language VARCHAR(10),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Index for fast user queries
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own jobs
CREATE POLICY "Users can view own jobs"
    ON jobs FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own jobs
CREATE POLICY "Users can create own jobs"
    ON jobs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own jobs
CREATE POLICY "Users can delete own jobs"
    ON jobs FOR DELETE
    USING (auth.uid() = user_id);

-- Service role can do everything (for worker)
-- Note: service_role key bypasses RLS automatically

-- ============================================
-- Enable Realtime for jobs table
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE jobs;
