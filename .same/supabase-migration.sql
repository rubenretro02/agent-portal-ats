-- Run this SQL in your Supabase SQL Editor to add the new columns and update the trigger

-- Add new columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS middle_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sex TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Update the handle_new_user function for the simplified signup flow
-- Now only username is required at signup, personal info is added during onboarding
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    username,
    first_name,
    middle_name,
    last_name,
    sex,
    date_of_birth,
    phone,
    role,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'username',
    NULL,  -- first_name will be set during onboarding
    NULL,  -- middle_name will be set during onboarding
    NULL,  -- last_name will be set during onboarding
    NULL,  -- sex will be set during onboarding
    NULL,  -- date_of_birth will be set during onboarding
    NULL,  -- phone will be set during onboarding
    COALESCE(NEW.raw_user_meta_data->>'role', 'agent'),
    true,
    NOW(),
    NOW()
  );

  -- If role is agent, also create an agent record
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'agent') = 'agent' THEN
    INSERT INTO public.agents (
      user_id,
      ats_id,
      pipeline_status,
      pipeline_stage,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      'AGT-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0'),
      'new',
      1,
      NOW(),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- IMPORTANT: For existing users who don't have first_name/last_name set,
-- they will need to complete the onboarding to set these values.
