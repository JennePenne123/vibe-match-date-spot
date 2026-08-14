import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

/**
 * Anonymous-safe crash/error ingestion.
 *
 * Logged-out users have no privileges on `error_logs` (RLS is authenticated
 * only), so client crashes that happen before login used to be invisible.
 * This endpoint accepts a small, validated payload and stores it with the
 * service role so admins see those crashes too.
 */

const MAX_PER_WINDOW = 20
const WINDOW_MS = 60_000
const buckets = new Map<string, { count: number; reset: number }>()

function rateLimited(key: string): boolean {
  const now = Date.now()
  const entry = buckets.get(key)
  if (!entry || now > entry.reset) {
    buckets.set(key, { count: 1, reset: now + WINDOW_MS })
    return false
  }
  entry.count += 1
  return entry.count > MAX_PER_WINDOW
}

const ALLOWED_TYPES = ['js_error', 'api_error', 'ui_error', 'performance', 'unknown']
const ALLOWED_SEVERITIES = ['info', 'warning', 'error', 'critical']

const str = (value: unknown, max: number): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed.slice(0, max) : null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (rateLimited(ip)) {
    return json({ error: 'Rate limit exceeded' }, 429)
  }

  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const message = str(payload.error_message, 2000)
  if (!message) {
    return json({ error: 'error_message is required' }, 400)
  }

  const errorType = str(payload.error_type, 32) ?? 'unknown'
  const severity = str(payload.severity, 16) ?? 'error'

  const row = {
    user_id: null,
    error_type: ALLOWED_TYPES.includes(errorType) ? errorType : 'unknown',
    error_message: message,
    error_stack: str(payload.error_stack, 5000),
    component_name: str(payload.component_name, 200),
    route: str(payload.route, 300),
    severity: ALLOWED_SEVERITIES.includes(severity) ? severity : 'error',
    metadata: {
      ...(typeof payload.metadata === 'object' && payload.metadata !== null
        ? (payload.metadata as Record<string, unknown>)
        : {}),
      anonymous: true,
    },
    user_agent: str(payload.user_agent, 500) ?? req.headers.get('user-agent'),
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { error } = await supabase.from('error_logs').insert(row)
  if (error) {
    console.error('[log-client-error] insert failed:', error.message)
    return json({ error: 'Failed to store error' }, 500)
  }

  return json({ success: true }, 200)
})