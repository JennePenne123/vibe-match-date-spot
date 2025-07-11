-- Update existing profiles with meaningful names based on their emails
UPDATE profiles 
SET name = 'Jan Wiechmann'
WHERE email = 'info@janwiechmann.de';

UPDATE profiles 
SET name = 'Jenne Penne'
WHERE email = 'jennepenne123@gmail.com';

UPDATE profiles 
SET name = 'Jan W.'
WHERE email = 'janwiechmann@hotmail.com';

-- Improve the handle_new_user function to better extract names from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  display_name text;
BEGIN
  -- Try to extract name from metadata, with multiple fallbacks
  display_name := COALESCE(
    NEW.raw_user_meta_data ->> 'name',
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'display_name',
    CASE 
      WHEN NEW.email IS NOT NULL THEN
        -- Extract name from email (before @ symbol, replace dots/numbers with spaces, title case)
        INITCAP(REPLACE(REPLACE(REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[0-9]', '', 'g'), '.', ' '), '_', ' '))
      ELSE 'User'
    END
  );

  INSERT INTO public.profiles (id, name, email, avatar_url)
  VALUES (
    NEW.id,
    display_name,
    NEW.email,
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;