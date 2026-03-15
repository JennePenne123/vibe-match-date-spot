ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_paused boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS paused_at timestamp with time zone DEFAULT NULL;