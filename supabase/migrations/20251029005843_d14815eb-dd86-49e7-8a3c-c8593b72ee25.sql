-- Fix Google OAuth login by making phone nullable in profiles table
-- The phone field is currently NOT NULL but Google OAuth doesn't provide phone number
-- This causes the handle_new_user trigger to fail silently

ALTER TABLE public.profiles 
ALTER COLUMN phone DROP NOT NULL;

-- Update the handle_new_user function to handle Google OAuth correctly
-- Google provides: full_name, email, avatar_url
-- Google does NOT provide: phone
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'phone',  -- Can be NULL for Google OAuth
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'  -- Google provides avatar_url
  );
  RETURN NEW;
END;
$$;