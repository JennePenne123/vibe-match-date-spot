ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS personality_traits jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS relationship_goal text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS lifestyle_data jsonb DEFAULT NULL;

COMMENT ON COLUMN public.user_preferences.personality_traits IS 'JSON with keys: spontaneity (0-100), adventure (0-100), social_energy (0-100)';
COMMENT ON COLUMN public.user_preferences.relationship_goal IS 'romantic, friends, or networking';
COMMENT ON COLUMN public.user_preferences.lifestyle_data IS 'JSON with keys: chronotype, budget_style, mobility';