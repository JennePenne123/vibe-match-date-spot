/**
 * React Query staleTime configuration per data category.
 * 
 * Categories (fastest → slowest refresh):
 * - REALTIME: Admin monitoring, error logs (30s)
 * - ADMIN: Dashboard KPIs, users, moderation (60s) 
 * - ADMIN_ANALYTICS: Charts, trends (120s)
 * - SOCIAL: Friends, invitations, chat (2min)
 * - DYNAMIC: Venues, recommendations, rewards (5min)
 * - STATIC: User profile, preferences, settings (10min)
 */

export const STALE_TIMES = {
  /** Admin real-time monitoring: errors, system health */
  REALTIME: 30 * 1000,          // 30 seconds

  /** Admin dashboard, users, moderation */
  ADMIN: 60 * 1000,             // 1 minute

  /** Admin analytics charts & trends */
  ADMIN_ANALYTICS: 2 * 60 * 1000, // 2 minutes

  /** Social data: friends, invitations, messages */
  SOCIAL: 2 * 60 * 1000,       // 2 minutes

  /** Dynamic content: venues, AI recommendations, rewards */
  DYNAMIC: 5 * 60 * 1000,      // 5 minutes

  /** Mostly static: user profile, preferences, settings */
  STATIC: 10 * 60 * 1000,      // 10 minutes
} as const;

/** Global default staleTime for queries without explicit override */
export const DEFAULT_STALE_TIME = STALE_TIMES.DYNAMIC;

/** Global garbage collection time */
export const DEFAULT_GC_TIME = 30 * 60 * 1000; // 30 minutes
