-- Add system check columns to agents table
-- Run this in Supabase SQL Editor

ALTER TABLE agents
ADD COLUMN IF NOT EXISTS system_check JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS system_check_date TIMESTAMPTZ DEFAULT NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_agents_system_check_date ON agents(system_check_date);

-- Comment for documentation
COMMENT ON COLUMN agents.system_check IS 'JSON object containing system check results (internet speed, hardware, IP, etc.)';
COMMENT ON COLUMN agents.system_check_date IS 'Timestamp of last system check';
