-- Add application_stages column to opportunities table
ALTER TABLE public.opportunities 
ADD COLUMN IF NOT EXISTS application_stages jsonb DEFAULT '[]'::jsonb;

-- Comment
COMMENT ON COLUMN public.opportunities.application_stages IS 'Array of application stages configured for this opportunity';
