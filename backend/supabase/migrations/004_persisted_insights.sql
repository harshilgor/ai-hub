-- Snapshot storage for technology reads and predictions

CREATE TABLE IF NOT EXISTS technology_reads_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reads JSONB NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS technology_reads_snapshot_generated_idx
    ON technology_reads_snapshots (generated_at DESC);


CREATE TABLE IF NOT EXISTS technology_predictions_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    predictions JSONB NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS technology_predictions_snapshot_generated_idx
    ON technology_predictions_snapshots (generated_at DESC);




