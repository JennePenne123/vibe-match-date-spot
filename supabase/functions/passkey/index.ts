import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from 'npm:@simplewebauthn/server@13.1.1';
import { isoBase64URL } from 'npm:@simplewebauthn/server@13.1.1/helpers';
import { corsHeaders } from '../_shared/cors.ts';

const RP_NAME = 'H!Outz';

const ALLOWED_HOST_SUFFIXES = [
  'hioutz.app',
  'hioutz.com',
  'lovable.app',
  'lovableproject.com',
  'localhost',
];

function resolveRp(req: Request): { rpID: string; origin: string } | null {
  const origin = req.headers.get('origin') ?? '';
  try {
    const url = new URL(origin);
    const host = url.hostname;
    const allowed = ALLOWED_HOST_SUFFIXES.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`),
    );
    if (!allowed) return null;
    return { rpID: host, origin };
  } catch {
    return null;
  }
}

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

async function requireUser(req: Request) {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

async function storeChallenge(challenge: string, purpose: string, userId: string | null) {
  await admin.from('passkey_challenges').insert({ challenge, purpose, user_id: userId });
}

async function consumeChallenge(purpose: string, userId: string | null) {
  const query = admin
    .from('passkey_challenges')
    .select('id, challenge, expires_at')
    .eq('purpose', purpose)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1);

  if (userId) query.eq('user_id', userId);
  else query.is('user_id', null);

  const { data } = await query.maybeSingle();
  if (!data) return null;
  await admin.from('passkey_challenges').delete().eq('id', data.id);
  // Opportunistic cleanup of expired rows
  await admin.from('passkey_challenges').delete().lt('expires_at', new Date().toISOString());
  return data.challenge as string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const rp = resolveRp(req);
  if (!rp) return json({ error: 'origin_not_allowed' }, 403);

  let body: { action?: string; response?: unknown; deviceName?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_body' }, 400);
  }

  const action = body.action;

  try {
    // ---------- Registration ----------
    if (action === 'register-options') {
      const user = await requireUser(req);
      if (!user) return json({ error: 'unauthorized' }, 401);

      const { data: existing } = await admin
        .from('user_passkeys')
        .select('credential_id, transports')
        .eq('user_id', user.id);

      const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: rp.rpID,
        userID: isoBase64URL.toBuffer(isoBase64URL.fromUTF8String(user.id)),
        userName: user.email ?? user.id,
        userDisplayName: (user.user_metadata?.name as string) ?? user.email ?? 'H!Outz',
        attestationType: 'none',
        excludeCredentials: (existing ?? []).map((c) => ({
          id: c.credential_id,
          transports: (c.transports ?? []) as AuthenticatorTransport[],
        })),
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'preferred',
        },
      });

      await storeChallenge(options.challenge, 'register', user.id);
      return json({ options });
    }

    if (action === 'register-verify') {
      const user = await requireUser(req);
      if (!user) return json({ error: 'unauthorized' }, 401);

      const expectedChallenge = await consumeChallenge('register', user.id);
      if (!expectedChallenge) return json({ error: 'challenge_expired' }, 400);

      const verification = await verifyRegistrationResponse({
        response: body.response as never,
        expectedChallenge,
        expectedOrigin: rp.origin,
        expectedRPID: rp.rpID,
        requireUserVerification: false,
      });

      if (!verification.verified || !verification.registrationInfo) {
        return json({ error: 'verification_failed' }, 400);
      }

      const { credential, credentialBackedUp } = verification.registrationInfo;

      const { error } = await admin.from('user_passkeys').insert({
        user_id: user.id,
        credential_id: credential.id,
        public_key: isoBase64URL.fromBuffer(credential.publicKey),
        counter: credential.counter ?? 0,
        transports: credential.transports ?? [],
        backed_up: credentialBackedUp ?? false,
        device_name: (body.deviceName ?? 'Passkey').slice(0, 60),
      });

      if (error) {
        if (error.code === '23505') return json({ error: 'already_registered' }, 409);
        throw error;
      }

      return json({ verified: true });
    }

    // ---------- Authentication ----------
    if (action === 'auth-options') {
      const options = await generateAuthenticationOptions({
        rpID: rp.rpID,
        userVerification: 'preferred',
      });
      await storeChallenge(options.challenge, 'auth', null);
      return json({ options });
    }

    if (action === 'auth-verify') {
      const assertion = body.response as { id?: string } | undefined;
      if (!assertion?.id) return json({ error: 'invalid_body' }, 400);

      const { data: stored } = await admin
        .from('user_passkeys')
        .select('*')
        .eq('credential_id', assertion.id)
        .maybeSingle();

      if (!stored) return json({ error: 'unknown_credential' }, 404);

      const expectedChallenge = await consumeChallenge('auth', null);
      if (!expectedChallenge) return json({ error: 'challenge_expired' }, 400);

      const verification = await verifyAuthenticationResponse({
        response: assertion as never,
        expectedChallenge,
        expectedOrigin: rp.origin,
        expectedRPID: rp.rpID,
        requireUserVerification: false,
        credential: {
          id: stored.credential_id,
          publicKey: isoBase64URL.toBuffer(stored.public_key),
          counter: Number(stored.counter ?? 0),
          transports: (stored.transports ?? []) as AuthenticatorTransport[],
        },
      });

      if (!verification.verified) return json({ error: 'verification_failed' }, 401);

      await admin
        .from('user_passkeys')
        .update({
          counter: verification.authenticationInfo.newCounter,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', stored.id);

      const { data: userData, error: userError } = await admin.auth.admin.getUserById(
        stored.user_id,
      );
      if (userError || !userData.user?.email) return json({ error: 'user_not_found' }, 404);

      // Mint a one-time token the client exchanges for a session
      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email: userData.user.email,
      });
      if (linkError || !linkData.properties?.hashed_token) {
        return json({ error: 'session_creation_failed' }, 500);
      }

      return json({
        verified: true,
        email: userData.user.email,
        token_hash: linkData.properties.hashed_token,
      });
    }

    return json({ error: 'unknown_action' }, 400);
  } catch (err) {
    console.error('[passkey] error', err);
    return json({ error: 'internal_error' }, 500);
  }
});
