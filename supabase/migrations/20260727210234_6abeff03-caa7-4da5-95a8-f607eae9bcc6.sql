ALTER TABLE public.user_points
ADD COLUMN IF NOT EXISTS notified_badges jsonb NOT NULL DEFAULT '[]'::jsonb;