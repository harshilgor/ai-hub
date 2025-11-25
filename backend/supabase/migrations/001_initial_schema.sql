-- Supabase Database Schema for Insider Info
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Papers Table
CREATE TABLE IF NOT EXISTS papers (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  authors TEXT[],
  abstract TEXT,
  summary TEXT,
  published TIMESTAMPTZ,
  updated TIMESTAMPTZ,
  venue TEXT,
  link TEXT,
  pdf_link TEXT,
  source TEXT,
  source_id TEXT,
  tags TEXT[],
  categories TEXT[],
  citations INTEGER DEFAULT 0,
  related_startups TEXT[],
  industry TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on papers for faster queries
CREATE INDEX IF NOT EXISTS idx_papers_published ON papers(published DESC);
CREATE INDEX IF NOT EXISTS idx_papers_source ON papers(source, source_id);
CREATE INDEX IF NOT EXISTS idx_papers_tags ON papers USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_papers_categories ON papers USING GIN(categories);

-- Podcasts/Video Insights Table
CREATE TABLE IF NOT EXISTS podcasts (
  id TEXT PRIMARY KEY,
  type TEXT DEFAULT 'podcast',
  title TEXT NOT NULL,
  content TEXT,
  published TIMESTAMPTZ,
  source TEXT,
  source_id TEXT,
  link TEXT,
  technologies TEXT[],
  companies TEXT[],
  industries TEXT[],
  sentiment JSONB,
  confidence FLOAT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on podcasts
CREATE INDEX IF NOT EXISTS idx_podcasts_published ON podcasts(published DESC);
CREATE INDEX IF NOT EXISTS idx_podcasts_source ON podcasts(source, source_id);
CREATE INDEX IF NOT EXISTS idx_podcasts_technologies ON podcasts USING GIN(technologies);
CREATE INDEX IF NOT EXISTS idx_podcasts_companies ON podcasts USING GIN(companies);
CREATE INDEX IF NOT EXISTS idx_podcasts_link ON podcasts(link);

-- Channels Table
CREATE TABLE IF NOT EXISTS channels (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  last_checked TIMESTAMPTZ,
  last_video_id TEXT,
  processed_video_ids JSONB DEFAULT '[]'::jsonb,
  auto_process BOOLEAN DEFAULT false,
  max_videos_per_check INTEGER DEFAULT 5,
  min_video_length INTEGER DEFAULT 300,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on channels
CREATE INDEX IF NOT EXISTS idx_channels_channel_id ON channels(channel_id);
CREATE INDEX IF NOT EXISTS idx_channels_enabled ON channels(enabled);

-- Settings Table (for global settings)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_papers_updated_at BEFORE UPDATE ON papers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_podcasts_updated_at BEFORE UPDATE ON podcasts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) - adjust policies as needed
ALTER TABLE papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for now - adjust based on your auth needs)
CREATE POLICY "Allow all operations on papers" ON papers
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on podcasts" ON podcasts
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on channels" ON channels
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on settings" ON settings
  FOR ALL USING (true) WITH CHECK (true);


