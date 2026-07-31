CREATE TABLE public.user_recovery_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code_hash text NOT NULL,
  batch_label text NOT NULL DEFAULT 'default',
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX user_recovery_codes_hash_key ON public.user_recovery_codes (code_hash);
CREATE INDEX user_recovery_codes_user_idx ON public.user_recovery_codes (user_id);

GRANT SELECT, DELETE ON public.user_recovery_codes TO authenticated;
GRANT ALL ON public.user_recovery_codes TO service_role;

ALTER TABLE public.user_recovery_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recovery codes"
  ON public.user_recovery_codes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recovery codes"
  ON public.user_recovery_codes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);