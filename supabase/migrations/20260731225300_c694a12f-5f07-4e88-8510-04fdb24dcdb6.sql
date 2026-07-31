CREATE TABLE public.user_passkeys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  transports TEXT[] NOT NULL DEFAULT '{}',
  device_name TEXT NOT NULL DEFAULT 'Passkey',
  backed_up BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX idx_user_passkeys_user_id ON public.user_passkeys(user_id);

GRANT SELECT, UPDATE, DELETE ON public.user_passkeys TO authenticated;
GRANT ALL ON public.user_passkeys TO service_role;

ALTER TABLE public.user_passkeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own passkeys"
  ON public.user_passkeys FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can rename their own passkeys"
  ON public.user_passkeys FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own passkeys"
  ON public.user_passkeys FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE public.passkey_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge TEXT NOT NULL,
  user_id UUID,
  purpose TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '5 minutes')
);

CREATE INDEX idx_passkey_challenges_challenge ON public.passkey_challenges(challenge);

GRANT ALL ON public.passkey_challenges TO service_role;

ALTER TABLE public.passkey_challenges ENABLE ROW LEVEL SECURITY;