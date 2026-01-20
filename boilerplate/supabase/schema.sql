-- PMTA Analytics Database Schema
-- Run this in your Supabase SQL Editor

-- ============================================
-- Files Table - Track uploaded CSV files
-- ============================================
CREATE TABLE IF NOT EXISTS files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_type TEXT CHECK (file_type IN ('acct', 'tran', 'bounce', 'fbl', 'rb', 'unknown')),
    file_hash TEXT,
    file_size BIGINT,
    upload_time TIMESTAMPTZ DEFAULT NOW(),
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'error')),
    row_count INTEGER,
    error_logs JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_files_user ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_type ON files(file_type);
CREATE INDEX IF NOT EXISTS idx_files_hash ON files(file_hash);
CREATE INDEX IF NOT EXISTS idx_files_upload_time ON files(upload_time DESC);

-- ============================================
-- Events Table - Normalized event records
-- ============================================
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL CHECK (event_type IN ('acct', 'tran', 'bounce', 'fbl', 'rb')),
    event_timestamp TIMESTAMPTZ,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    
    -- Core fields
    job_id TEXT,
    sender TEXT,
    recipient TEXT,
    recipient_domain TEXT,
    vmta TEXT,
    vmta_pool TEXT,
    source_ip INET,
    destination_ip INET,
    env_id TEXT,
    message_id TEXT,
    custom_header TEXT,
    
    -- Status fields
    smtp_status TEXT,
    bounce_category TEXT,
    dsn_action TEXT,
    dsn_diag TEXT,
    
    -- Derived fields
    delivery_latency DECIMAL(10,3), -- in seconds
    
    -- Raw data for debugging
    raw_data JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partitioning hint: For production, consider partitioning by event_timestamp (monthly)
-- CREATE TABLE events_2024_01 PARTITION OF events FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_job_id ON events(job_id);
CREATE INDEX IF NOT EXISTS idx_events_sender ON events(sender);
CREATE INDEX IF NOT EXISTS idx_events_domain ON events(recipient_domain);
CREATE INDEX IF NOT EXISTS idx_events_vmta ON events(vmta);
CREATE INDEX IF NOT EXISTS idx_events_file ON events(file_id);
CREATE INDEX IF NOT EXISTS idx_events_source_ip ON events(source_ip);

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_events_type_timestamp ON events(event_type, event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_domain_timestamp ON events(recipient_domain, event_timestamp DESC);

-- ============================================
-- Views for Analytics
-- ============================================

-- Daily delivery metrics view
CREATE OR REPLACE VIEW daily_metrics AS
SELECT 
    DATE_TRUNC('day', event_timestamp) AS date,
    event_type,
    recipient_domain,
    COUNT(*) AS total_events,
    COUNT(CASE WHEN bounce_category IS NOT NULL THEN 1 END) AS bounce_count,
    AVG(delivery_latency) AS avg_latency,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY delivery_latency) AS p95_latency
FROM events
WHERE event_timestamp > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', event_timestamp), event_type, recipient_domain;

-- Sender metrics view
CREATE OR REPLACE VIEW sender_metrics AS
SELECT 
    sender,
    job_id,
    COUNT(*) AS total_sent,
    COUNT(CASE WHEN event_type = 'bounce' THEN 1 END) AS bounce_count,
    COUNT(CASE WHEN event_type = 'fbl' THEN 1 END) AS complaint_count,
    COUNT(CASE WHEN event_type = 'rb' THEN 1 END) AS rb_count,
    ROUND(COUNT(CASE WHEN event_type = 'bounce' THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2) AS bounce_rate,
    ROUND(COUNT(CASE WHEN event_type = 'fbl' THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0) * 100, 3) AS complaint_rate
FROM events
WHERE event_timestamp > NOW() - INTERVAL '7 days'
GROUP BY sender, job_id
HAVING COUNT(*) > 100;

-- Domain performance view
CREATE OR REPLACE VIEW domain_performance AS
SELECT 
    recipient_domain,
    COUNT(*) AS total_sent,
    COUNT(CASE WHEN event_type = 'acct' AND dsn_action = 'delivered' THEN 1 END) AS delivered,
    COUNT(CASE WHEN event_type = 'bounce' THEN 1 END) AS bounced,
    COUNT(CASE WHEN event_type = 'acct' AND dsn_action = 'delayed' THEN 1 END) AS deferred,
    COUNT(CASE WHEN event_type = 'fbl' THEN 1 END) AS complaints,
    COUNT(CASE WHEN event_type = 'rb' THEN 1 END) AS rb_events,
    AVG(delivery_latency) AS avg_latency,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY delivery_latency) AS p95_latency
FROM events
WHERE event_timestamp > NOW() - INTERVAL '7 days'
GROUP BY recipient_domain;

-- ============================================
-- Functions
-- ============================================

-- Function to get delivery metrics (called by API)
CREATE OR REPLACE FUNCTION get_delivery_metrics(
    group_by TEXT DEFAULT 'day',
    date_from TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days',
    date_to TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    time_bucket TIMESTAMPTZ,
    sent BIGINT,
    delivered BIGINT,
    bounced BIGINT,
    deferred BIGINT,
    complaints BIGINT,
    rb_events BIGINT,
    avg_latency DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE_TRUNC(group_by, event_timestamp) AS time_bucket,
        COUNT(*) AS sent,
        COUNT(CASE WHEN event_type = 'acct' AND dsn_action = 'delivered' THEN 1 END) AS delivered,
        COUNT(CASE WHEN event_type = 'bounce' THEN 1 END) AS bounced,
        COUNT(CASE WHEN event_type = 'acct' AND dsn_action = 'delayed' THEN 1 END) AS deferred,
        COUNT(CASE WHEN event_type = 'fbl' THEN 1 END) AS complaints,
        COUNT(CASE WHEN event_type = 'rb' THEN 1 END) AS rb_events,
        AVG(delivery_latency) AS avg_latency
    FROM events
    WHERE event_timestamp BETWEEN date_from AND date_to
    GROUP BY DATE_TRUNC(group_by, event_timestamp)
    ORDER BY time_bucket DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policies for files table (users can only see their own files)
-- For internal tool, you may want to allow all authenticated users
CREATE POLICY "Users can view all files" ON files
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert files" ON files
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update their files" ON files
    FOR UPDATE
    TO authenticated
    USING (true);

-- Policies for events table
CREATE POLICY "Users can view all events" ON events
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert events" ON events
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ============================================
-- Triggers
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER files_updated_at
    BEFORE UPDATE ON files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
