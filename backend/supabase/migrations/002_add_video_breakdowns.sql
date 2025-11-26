-- Migration: Add video breakdowns support
-- This extends the podcasts table to store detailed breakdowns

-- Add breakdown column to podcasts table (stored as JSONB for flexibility)
ALTER TABLE podcasts 
ADD COLUMN IF NOT EXISTS breakdown JSONB;

-- Create index on breakdown for faster queries
CREATE INDEX IF NOT EXISTS idx_podcasts_breakdown ON podcasts USING GIN(breakdown);

-- Add function to extract insights from breakdown for search
CREATE OR REPLACE FUNCTION extract_breakdown_insights(breakdown_data JSONB)
RETURNS TEXT[] AS $$
BEGIN
  IF breakdown_data IS NULL THEN
    RETURN ARRAY[]::TEXT[];
  END IF;
  
  -- Extract all insight texts from segments
  RETURN (
    SELECT ARRAY_AGG(DISTINCT insight->>'text')
    FROM jsonb_array_elements(breakdown_data->'segments') AS segment,
         jsonb_array_elements(segment->'insights') AS insight
    WHERE insight->>'text' IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add computed column for insight search (optional, can be queried via function)
-- This allows searching videos by insights
COMMENT ON COLUMN podcasts.breakdown IS 'Stores detailed video breakdown with segments and insights in JSONB format';

