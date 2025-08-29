-- Fix database function security vulnerabilities by adding proper search path settings

-- Update the update_both_preferences_complete function to include secure search path
CREATE OR REPLACE FUNCTION public.update_both_preferences_complete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Update both_preferences_complete based on individual completion flags
  NEW.both_preferences_complete = (NEW.initiator_preferences_complete AND NEW.partner_preferences_complete);
  
  -- Also ensure we have both preference sets
  IF NEW.both_preferences_complete AND (NEW.initiator_preferences IS NULL OR NEW.partner_preferences IS NULL) THEN
    NEW.both_preferences_complete = false;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update the handle_new_user function to be more secure
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Sanitize and limit the display name length
  display_name := TRIM(SUBSTRING(display_name FROM 1 FOR 100));
  
  -- Prevent empty names
  IF display_name = '' THEN
    display_name := 'User';
  END IF;

  INSERT INTO public.profiles (id, name, email, avatar_url)
  VALUES (
    NEW.id,
    display_name,
    NEW.email,
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$function$;

-- Add constraints to ensure data integrity and prevent excessively long inputs
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_name_length_check CHECK (LENGTH(name) <= 100 AND LENGTH(name) > 0);

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_email_format_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add constraints to date invitations for message length
ALTER TABLE public.date_invitations 
ADD CONSTRAINT date_invitations_title_length_check CHECK (LENGTH(title) <= 200);

ALTER TABLE public.date_invitations 
ADD CONSTRAINT date_invitations_message_length_check CHECK (message IS NULL OR LENGTH(message) <= 1000);

-- Add constraints to date proposals
ALTER TABLE public.date_proposals 
ADD CONSTRAINT date_proposals_title_length_check CHECK (LENGTH(title) <= 200);

ALTER TABLE public.date_proposals 
ADD CONSTRAINT date_proposals_message_length_check CHECK (message IS NULL OR LENGTH(message) <= 1000);