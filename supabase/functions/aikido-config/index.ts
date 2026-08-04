import { corsHeaders } from '../_shared/cors.ts';
import { verifyUserAuth, unauthorizedResponse } from '../_shared/auth-guards.ts';

const TOKEN_URL = 'https://app.aikido.dev/api/oauth/token';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const auth = await verifyUserAuth(req);
  if (!auth?.isAdmin) return unauthorizedResponse(corsHeaders);

  const clientId = Deno.env.get('AIKIDO_CLIENT_ID') ?? '';
  const clientSecret = Deno.env.get('AIKIDO_CLIENT_SECRET') ?? '';
  const scopes = Deno.env.get('AIKIDO_SCOPES') ?? '';

  let action = 'status';
  try {
    const body = await req.json();
    if (body?.action) action = String(body.action);
  } catch {
    // no body -> status
  }

  const status = {
    clientIdConfigured: clientId.length > 0,
    clientSecretConfigured: clientSecret.length > 0,
    scopes: scopes ? scopes.split(/[,\s]+/).filter(Boolean) : [],
    clientIdPreview: clientId ? `${clientId.slice(0, 4)}…${clientId.slice(-4)}` : null,
    tokenUrl: TOKEN_URL,
  };

  if (action !== 'test') {
    return new Response(JSON.stringify(status), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!clientId || !clientSecret) {
    return new Response(
      JSON.stringify({ ...status, test: { ok: false, error: 'Client ID oder Secret fehlt' } }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  try {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        ...(scopes ? { scope: scopes.split(/[,\s]+/).filter(Boolean).join(' ') } : {}),
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      console.error(`Aikido token request failed [${res.status}]: ${text}`);
      return new Response(
        JSON.stringify({ ...status, test: { ok: false, status: res.status, details: text } }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    let expiresIn: number | null = null;
    try { expiresIn = JSON.parse(text)?.expires_in ?? null; } catch { /* ignore */ }

    return new Response(
      JSON.stringify({ ...status, test: { ok: true, expiresIn } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('Aikido token request error:', message);
    return new Response(
      JSON.stringify({ ...status, test: { ok: false, error: message } }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
