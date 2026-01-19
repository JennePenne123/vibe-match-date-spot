
/**
 * Error Recovery Service
 * Centralized error handling with retry logic and fallbacks
 */

import { withRetry } from '@/hooks/useRetry';

type ErrorCategory = 'network' | 'auth' | 'rate_limit' | 'server' | 'client' | 'unknown';

interface ErrorReport {
  error: Error;
  category: ErrorCategory;
  context: string;
  timestamp: number;
  retryable: boolean;
}

// Store recent errors for debugging
const recentErrors: ErrorReport[] = [];
const MAX_ERROR_HISTORY = 50;

// Categorize errors for appropriate handling
const categorizeError = (error: Error): ErrorCategory => {
  const message = error.message.toLowerCase();
  
  if (message.includes('network') || message.includes('fetch') || message.includes('failed to fetch')) {
    return 'network';
  }
  
  if (message.includes('401') || message.includes('unauthorized') || message.includes('jwt')) {
    return 'auth';
  }
  
  if (message.includes('429') || message.includes('rate limit') || message.includes('too many requests')) {
    return 'rate_limit';
  }
  
  if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) {
    return 'server';
  }
  
  if (message.includes('400') || message.includes('validation') || message.includes('invalid')) {
    return 'client';
  }
  
  return 'unknown';
};

// Check if error is retryable based on category
const isRetryable = (category: ErrorCategory): boolean => {
  return ['network', 'rate_limit', 'server'].includes(category);
};

// Fallback venue data for when API fails
const getFallbackVenues = () => [
  {
    id: 'fallback-1',
    name: 'Loading venues...',
    description: 'Please wait while we reconnect',
    address: 'Checking connection...',
    cuisine_type: 'Various',
    price_range: '$$',
    rating: 4.0,
    tags: ['fallback'],
    is_active: true
  }
];

export const errorRecoveryService = {
  /**
   * Wrap an async function with retry logic and fallback
   */
  async withRetryAndFallback<T>(
    fn: () => Promise<T>,
    fallback: T,
    context: string = 'operation',
    maxRetries: number = 3
  ): Promise<T> {
    try {
      return await withRetry(fn, {
        maxRetries,
        retryDelay: 1000,
        backoff: 'exponential',
        onRetry: (attempt, error) => {
          console.log(`[ErrorRecovery] ${context} retry ${attempt}:`, error.message);
        }
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.reportError(err, context);
      console.warn(`[ErrorRecovery] ${context} failed, using fallback`);
      return fallback;
    }
  },
  
  /**
   * Report an error for monitoring
   */
  reportError(error: Error, context: string): void {
    const category = categorizeError(error);
    const report: ErrorReport = {
      error,
      category,
      context,
      timestamp: Date.now(),
      retryable: isRetryable(category)
    };
    
    // Add to recent errors
    recentErrors.unshift(report);
    if (recentErrors.length > MAX_ERROR_HISTORY) {
      recentErrors.pop();
    }
    
    // Log based on severity
    if (category === 'auth') {
      console.warn('[ErrorRecovery] Auth error - user may need to re-login:', context);
    } else if (category === 'rate_limit') {
      console.warn('[ErrorRecovery] Rate limited:', context);
    } else {
      console.error('[ErrorRecovery] Error in', context, ':', error.message);
    }
  },
  
  /**
   * Check if an error is retryable
   */
  isRetryable(error: Error): boolean {
    const category = categorizeError(error);
    return isRetryable(category);
  },
  
  /**
   * Get error category for handling decisions
   */
  getErrorCategory(error: Error): ErrorCategory {
    return categorizeError(error);
  },
  
  /**
   * Get fallback venues when API fails
   */
  getFallbackVenues() {
    return getFallbackVenues();
  },
  
  /**
   * Get recent errors for debugging
   */
  getRecentErrors(): ErrorReport[] {
    return [...recentErrors];
  },
  
  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    recentErrors.length = 0;
  },
  
  /**
   * Get error summary for dashboard
   */
  getErrorSummary(): {
    total: number;
    byCategory: Record<ErrorCategory, number>;
    retryableCount: number;
    lastHour: number;
  } {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    const byCategory: Record<ErrorCategory, number> = {
      network: 0,
      auth: 0,
      rate_limit: 0,
      server: 0,
      client: 0,
      unknown: 0
    };
    
    let retryableCount = 0;
    let lastHour = 0;
    
    for (const report of recentErrors) {
      byCategory[report.category]++;
      if (report.retryable) retryableCount++;
      if (report.timestamp > oneHourAgo) lastHour++;
    }
    
    return {
      total: recentErrors.length,
      byCategory,
      retryableCount,
      lastHour
    };
  },
  
  /**
   * Handle error based on category with appropriate action
   */
  async handleError(
    error: Error,
    context: string,
    options?: {
      onAuth?: () => void;
      onRateLimit?: () => void;
      onNetwork?: () => void;
    }
  ): Promise<void> {
    const category = categorizeError(error);
    this.reportError(error, context);
    
    switch (category) {
      case 'auth':
        options?.onAuth?.();
        break;
      case 'rate_limit':
        options?.onRateLimit?.();
        break;
      case 'network':
        options?.onNetwork?.();
        break;
    }
  }
};
