-- Add "last 4 of SSN" to profiles for identity verification.
-- Run this in the Supabase SQL Editor.

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS ssn_last4 TEXT DEFAULT NULL;

COMMENT ON COLUMN profiles.ssn_last4 IS 'Last 4 digits of SSN, collected during onboarding for identity verification.';
