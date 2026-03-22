import { supabase } from '@/integrations/supabase/client';
import { captureError } from './sentryService';

type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';
type ErrorType = 'js_error' | 'api_error' | 'ui_error' | 'performance' | 'unknown';

interface ErrorLogPayload {
  error_type: ErrorType;
  error_message: string;
  error_stack?: string;
  component_name?: string;
  route?: string;
  severity?: ErrorSeverity;
  metadata?: Record<string, unknown>;
}

// Debounce duplicate errors (same message within 5s)
const recentErrors = new Map<string, number>();
const DEBOUNCE_MS = 5000;

function isDuplicate(message: string): boolean {
  const now = Date.now();
  const lastSeen = recentErrors.get(message);
  if (lastSeen && now - lastSeen < DEBOUNCE_MS) return true;
  recentErrors.set(message, now);
  // Clean old entries
  if (recentErrors.size > 100) {
    for (const [key, time] of recentErrors) {
      if (now - time > DEBOUNCE_MS) recentErrors.delete(key);
    }
  }
  return false;
}

async function logError(payload: ErrorLogPayload): Promise<void> {
  try {
    if (isDuplicate(payload.error_message)) return;

    // Forward to Sentry
    const error = new Error(payload.error_message);
    if (payload.error_stack) error.stack = payload.error_stack;
    captureError(error, {
      error_type: payload.error_type,
      component_name: payload.component_name,
      route: payload.route || window.location.pathname,
      severity: payload.severity,
      ...payload.metadata,
    });

    const { data: { user } } = await supabase.auth.getUser();

    const { error: dbError } = await supabase.from('error_logs' as any).insert({
      user_id: user?.id || null,
      error_type: payload.error_type,
      error_message: payload.error_message.slice(0, 2000),
      error_stack: payload.error_stack?.slice(0, 5000) || null,
      component_name: payload.component_name || null,
      route: payload.route || window.location.pathname,
      severity: payload.severity || 'error',
      metadata: payload.metadata || {},
      user_agent: navigator.userAgent,
    });

    if (dbError) {
      console.error('[ErrorMonitoring] Failed to log error:', dbError);
    }
  } catch (e) {
    // Silently fail – don't create error loops
    if (import.meta.env.DEV) {
      console.error('[ErrorMonitoring] Service error:', e);
    }
  }
}

/** Log unhandled JS errors */
export function logJsError(error: Error | string, source?: string): void {
  const err = typeof error === 'string' ? new Error(error) : error;
  logError({
    error_type: 'js_error',
    error_message: err.message,
    error_stack: err.stack,
    component_name: source,
    severity: 'error',
  });
}

/** Log API/network errors */
export function logApiError(endpoint: string, statusCode: number | null, message: string, metadata?: Record<string, unknown>): void {
  logError({
    error_type: 'api_error',
    error_message: `[${statusCode || 'NETWORK'}] ${endpoint}: ${message}`,
    severity: statusCode && statusCode >= 500 ? 'critical' : 'error',
    metadata: { endpoint, statusCode, ...metadata },
  });
}

/** Log React ErrorBoundary catches */
export function logUiError(error: Error, componentName?: string): void {
  logError({
    error_type: 'ui_error',
    error_message: error.message,
    error_stack: error.stack,
    component_name: componentName,
    severity: 'error',
  });
}

/** Log performance issues */
export function logPerformanceIssue(metric: string, value: number, threshold: number, metadata?: Record<string, unknown>): void {
  logError({
    error_type: 'performance',
    error_message: `${metric}: ${value}ms (threshold: ${threshold}ms)`,
    severity: value > threshold * 2 ? 'critical' : 'warning',
    metadata: { metric, value, threshold, ...metadata },
  });
}

/** Initialize global error handlers */
export function initErrorMonitoring(): void {
  // Unhandled JS errors
  window.addEventListener('error', (event) => {
    logJsError(event.error || event.message, event.filename);
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || String(event.reason);
    logJsError(new Error(`Unhandled Promise: ${message}`), 'unhandledrejection');
  });

  // Long task observer (performance)
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 200) {
            logPerformanceIssue('long-task', entry.duration, 200, {
              entryType: entry.entryType,
              name: entry.name,
            });
          }
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    } catch {
      // longtask not supported in all browsers
    }
  }

  if (import.meta.env.DEV) {
    console.log('[ErrorMonitoring] Initialized');
  }
}
