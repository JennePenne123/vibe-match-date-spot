-- STEP 1: Fix function search paths
CREATE OR REPLACE FUNCTION public.update_both_preferences_complete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  IF (TG_OP = 'UPDATE' AND (
    OLD.initiator_preferences_complete IS DISTINCT FROM NEW.initiator_preferences_complete OR
    OLD.partner_preferences_complete IS DISTINCT FROM NEW.partner_preferences_complete OR
    OLD.initiator_preferences IS DISTINCT FROM NEW.initiator_preferences OR
    OLD.partner_preferences IS DISTINCT FROM NEW.partner_preferences
  )) OR TG_OP = 'INSERT' THEN
    NEW.both_preferences_complete = (
      NEW.initiator_preferences_complete = true AND 
      NEW.partner_preferences_complete = true AND
      NEW.initiator_preferences IS NOT NULL AND 
      NEW.partner_preferences IS NOT NULL
    );
    RAISE NOTICE 'Session % both_preferences_complete updated to %', NEW.id, NEW.both_preferences_complete;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_coding_conversations_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- STEP 2: Add explicit anonymous deny policies for sensitive tables
CREATE POLICY "Deny anonymous access" ON public.ai_learning_data 
  FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access" ON public.user_preference_vectors 
  FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access" ON public.user_preferences 
  FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access" ON public.user_points 
  FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access" ON public.friendships 
  FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access" ON public.date_invitations 
  FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access" ON public.date_feedback 
  FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access" ON public.invitation_messages 
  FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access" ON public.referrals 
  FOR ALL TO anon USING (false);

CREATE POLICY "Deny anonymous access" ON public.user_roles 
  FOR ALL TO anon USING (false);