import { logRequest, RequestLogEntry } from './request-logger.ts';

// In-memory rate limit store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

// Rate limit configurations by function type
export const RATE_LIMITS = {
  AI_FUNCTION: { limit: 20, windowMs: 60000 },     // 20/min for AI calls
  EXTERNAL_API: { limit: 30, windowMs: 60000 },    // 30/min for external APIs
  DATABASE_OP: { limit: 60, windowMs: 60000 },     // 60/min for DB operations
  VALIDATION: { limit: 10, windowMs: 60000 },      // 10/min for validation
} as const;

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
}

export const checkRateLimit = (
  identifier: string,
  config: RateLimitConfig = RATE_LIMITS.DATABASE_OP
): boolean => {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + config.windowMs });
    return true;
  }

  if (record.count >= config.limit) {
    return false;
  }

  record.count++;
  return true;
};

// Enhanced rate limit check with logging
export const checkRateLimitWithLogging = async (
  identifier: string,
  functionName: string,
  config: RateLimitConfig,
  req: Request
): Promise<RateLimitResult> => {
  const allowed = checkRateLimit(identifier, config);
  const record = rateLimitStore.get(identifier);
  const count = record?.count || 1;
  
  const logEntry: RequestLogEntry = {
    functionName,
    identifier,
    wasRateLimited: !allowed,
    requestCount: count,
    limitThreshold: config.limit,
    clientIp: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
    userAgent: req.headers.get('user-agent') || undefined,
    metadata: {
      method: req.method,
      path: new URL(req.url).pathname
    }
  };
  
  // Log asynchronously (don't await to not slow down request)
  logRequest(logEntry).catch(() => {});
  
  return {
    allowed,
    count,
    limit: config.limit
  };
};

export const getRateLimitIdentifier = (req: Request): string => {
  const authHeader = req.headers.get('authorization');
  const clientIP = req.headers.get('x-forwarded-for') ||
                   req.headers.get('x-real-ip') ||
                   'unknown';

  if (authHeader) {
    return `user-${authHeader.substring(0, 30)}`;
  }
  return `ip-${clientIP}`;
};

export const rateLimitResponse = (corsHeaders: Record<string, string>) => {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded. Please try again later.',
      retryAfter: 60
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': '60'
      }
    }
  );
};
