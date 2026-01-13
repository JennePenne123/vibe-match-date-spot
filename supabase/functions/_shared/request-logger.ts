import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

export interface RequestLogEntry {
  functionName: string;
  identifier: string;
  wasRateLimited: boolean;
  requestCount: number;
  limitThreshold: number;
  clientIp?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

// Hash identifier for privacy (first 16 chars of SHA-256)
const hashString = async (str: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
};

// Calculate abuse score based on violation patterns
const calculateAbuseScore = (
  wasRateLimited: boolean,
  requestCount: number,
  limitThreshold: number
): number => {
  if (!wasRateLimited) return 0;
  
  const overagePercent = ((requestCount - limitThreshold) / limitThreshold) * 100;
  let score = Math.min(overagePercent, 50);
  
  // Repeated violations increase score
  if (requestCount > limitThreshold * 2) score += 25;
  if (requestCount > limitThreshold * 5) score += 25;
  
  return Math.min(Math.round(score), 100);
};

export const logRequest = async (entry: RequestLogEntry): Promise<void> => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️ Supabase credentials not available for request logging');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const identifierHash = await hashString(entry.identifier);
    const clientIpHash = entry.clientIp ? await hashString(entry.clientIp) : null;
    const abuseScore = calculateAbuseScore(
      entry.wasRateLimited,
      entry.requestCount,
      entry.limitThreshold
    );

    const { error } = await supabase.from('request_logs').insert({
      function_name: entry.functionName,
      identifier_hash: identifierHash,
      was_rate_limited: entry.wasRateLimited,
      request_count: entry.requestCount,
      limit_threshold: entry.limitThreshold,
      client_ip_hash: clientIpHash,
      user_agent: entry.userAgent?.substring(0, 200),
      abuse_score: abuseScore,
      metadata: entry.metadata || {}
    });

    if (error) {
      console.error('❌ Failed to insert request log:', error.message);
      return;
    }

    // Log high abuse scores to console for immediate attention
    if (abuseScore >= 75) {
      console.warn(`⚠️ HIGH ABUSE SCORE [${abuseScore}]: ${entry.functionName} - ${identifierHash}`);
    } else if (entry.wasRateLimited) {
      console.log(`📊 Rate limit logged: ${entry.functionName} - score: ${abuseScore}`);
    }
  } catch (error) {
    // Don't let logging failures break the request
    console.error('❌ Request logging error:', error);
  }
};
