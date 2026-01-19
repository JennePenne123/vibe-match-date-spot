
/**
 * API Usage Service
 * Track and log API usage for cost monitoring
 */

import { supabase } from '@/integrations/supabase/client';

interface ApiUsageEntry {
  api_name: string;
  endpoint?: string;
  user_id?: string;
  response_status?: number;
  response_time_ms?: number;
  estimated_cost?: number;
  request_metadata?: Record<string, any>;
  cache_hit?: boolean;
}

// Estimated costs per API call (in USD)
const API_COSTS: Record<string, number> = {
  'google_places': 0.017,           // ~$17 per 1000 requests
  'google_places_details': 0.017,
  'foursquare': 0.00,               // Free tier
  'foursquare_details': 0.00,
  'radar': 0.001,                   // ~$1 per 1000 requests
  'openai_gpt4': 0.03,              // ~$30 per 1000 requests (varies)
  'openai_gpt35': 0.002,            // ~$2 per 1000 requests
  'supabase_edge': 0.000002,        // ~$2 per million
  'venue_cache': 0.00,              // Cache hits are free
  'analyze_compatibility': 0.01,    // AI compatibility analysis
};

// Local buffer for batch inserts
let usageBuffer: ApiUsageEntry[] = [];
const BUFFER_SIZE = 10;
const FLUSH_INTERVAL = 30000; // 30 seconds

// Flush buffer to database
const flushBuffer = async (): Promise<void> => {
  if (usageBuffer.length === 0) return;
  
  const toFlush = [...usageBuffer];
  usageBuffer = [];
  
  try {
    const { error } = await supabase
      .from('api_usage_logs')
      .insert(toFlush);
    
    if (error) {
      console.warn('[ApiUsage] Failed to flush logs:', error);
      // Add back to buffer if failed (up to limit)
      usageBuffer = [...toFlush.slice(-BUFFER_SIZE), ...usageBuffer].slice(0, BUFFER_SIZE * 2);
    } else {
      console.log('[ApiUsage] Flushed', toFlush.length, 'entries');
    }
  } catch (error) {
    console.warn('[ApiUsage] Error flushing logs:', error);
  }
};

// Set up periodic flush
if (typeof window !== 'undefined') {
  setInterval(flushBuffer, FLUSH_INTERVAL);
  
  // Flush on page unload
  window.addEventListener('beforeunload', () => {
    if (usageBuffer.length > 0) {
      // Use sendBeacon for reliable delivery
      const data = JSON.stringify(usageBuffer);
      navigator.sendBeacon?.('/api/log-usage', data);
    }
  });
}

export const apiUsageService = {
  /**
   * Log an API call
   */
  async logApiCall(entry: ApiUsageEntry): Promise<void> {
    // Add estimated cost if not provided
    if (entry.estimated_cost === undefined) {
      entry.estimated_cost = API_COSTS[entry.api_name] || 0;
    }
    
    // Add to buffer
    usageBuffer.push(entry);
    
    // Flush if buffer is full
    if (usageBuffer.length >= BUFFER_SIZE) {
      await flushBuffer();
    }
  },
  
  /**
   * Log API call with timing
   */
  createTimer(apiName: string, endpoint?: string) {
    const startTime = Date.now();
    
    return {
      end: async (options?: {
        status?: number;
        cacheHit?: boolean;
        metadata?: Record<string, any>;
        userId?: string;
      }) => {
        const responseTime = Date.now() - startTime;
        
        await this.logApiCall({
          api_name: apiName,
          endpoint,
          response_time_ms: responseTime,
          response_status: options?.status,
          cache_hit: options?.cacheHit,
          request_metadata: options?.metadata,
          user_id: options?.userId
        });
        
        return responseTime;
      }
    };
  },
  
  /**
   * Get usage summary for the current day (admin only)
   */
  async getDailySummary(): Promise<{
    totalCalls: number;
    totalCost: number;
    byApi: Record<string, { calls: number; cost: number }>;
    cacheHitRate: number;
  } | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('api_usage_daily')
        .select('*')
        .gte('date', today);
      
      if (error) {
        console.warn('[ApiUsage] Failed to get summary:', error);
        return null;
      }
      
      let totalCalls = 0;
      let totalCost = 0;
      let cacheHits = 0;
      const byApi: Record<string, { calls: number; cost: number }> = {};
      
      for (const row of data || []) {
        totalCalls += row.total_calls || 0;
        totalCost += row.total_cost || 0;
        cacheHits += row.cache_hits || 0;
        
        if (row.api_name) {
          byApi[row.api_name] = {
            calls: row.total_calls || 0,
            cost: row.total_cost || 0
          };
        }
      }
      
      return {
        totalCalls,
        totalCost,
        byApi,
        cacheHitRate: totalCalls > 0 ? Math.round((cacheHits / totalCalls) * 100) : 0
      };
    } catch (error) {
      console.warn('[ApiUsage] Error getting summary:', error);
      return null;
    }
  },
  
  /**
   * Get estimated cost for an API
   */
  getEstimatedCost(apiName: string): number {
    return API_COSTS[apiName] || 0;
  },
  
  /**
   * Force flush pending logs
   */
  async flush(): Promise<void> {
    await flushBuffer();
  }
};
