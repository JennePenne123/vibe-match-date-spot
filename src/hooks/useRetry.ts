
import { useState, useCallback, useRef } from 'react';

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  backoff?: 'linear' | 'exponential';
  onRetry?: (attempt: number, error: Error) => void;
  retryCondition?: (error: Error) => boolean;
}

interface RetryState<T> {
  execute: () => Promise<T | null>;
  isRetrying: boolean;
  retryCount: number;
  lastError: Error | null;
  reset: () => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'retryCondition'>> = {
  maxRetries: 3,
  retryDelay: 1000,
  backoff: 'exponential'
};

// Check if error is retryable
const isRetryableError = (error: Error): boolean => {
  const message = error.message.toLowerCase();
  
  // Network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
    return true;
  }
  
  // Server errors (5xx)
  if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) {
    return true;
  }
  
  // Rate limiting
  if (message.includes('429') || message.includes('rate limit')) {
    return true;
  }
  
  return false;
};

// Calculate delay for retry attempt
const calculateDelay = (
  attempt: number,
  baseDelay: number,
  backoff: 'linear' | 'exponential'
): number => {
  if (backoff === 'exponential') {
    return baseDelay * Math.pow(2, attempt - 1);
  }
  return baseDelay * attempt;
};

export function useRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): RetryState<T> {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);
  const abortRef = useRef(false);
  
  const {
    maxRetries = DEFAULT_OPTIONS.maxRetries,
    retryDelay = DEFAULT_OPTIONS.retryDelay,
    backoff = DEFAULT_OPTIONS.backoff,
    onRetry,
    retryCondition = isRetryableError
  } = options;
  
  const reset = useCallback(() => {
    abortRef.current = true;
    setIsRetrying(false);
    setRetryCount(0);
    setLastError(null);
  }, []);
  
  const execute = useCallback(async (): Promise<T | null> => {
    abortRef.current = false;
    setLastError(null);
    setRetryCount(0);
    
    let attempt = 0;
    
    while (attempt <= maxRetries && !abortRef.current) {
      try {
        const result = await fn();
        setIsRetrying(false);
        setRetryCount(0);
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setLastError(err);
        
        attempt++;
        setRetryCount(attempt);
        
        // Check if we should retry
        if (attempt > maxRetries || !retryCondition(err)) {
          setIsRetrying(false);
          console.error(`[useRetry] Failed after ${attempt} attempts:`, err);
          throw err;
        }
        
        // Calculate delay and wait
        const delay = calculateDelay(attempt, retryDelay, backoff);
        console.log(`[useRetry] Attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms...`);
        
        setIsRetrying(true);
        onRetry?.(attempt, err);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return null;
  }, [fn, maxRetries, retryDelay, backoff, onRetry, retryCondition]);
  
  return {
    execute,
    isRetrying,
    retryCount,
    lastError,
    reset
  };
}

// Standalone retry wrapper for functions
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = DEFAULT_OPTIONS.maxRetries,
    retryDelay = DEFAULT_OPTIONS.retryDelay,
    backoff = DEFAULT_OPTIONS.backoff,
    onRetry,
    retryCondition = isRetryableError
  } = options;
  
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      attempt++;
      
      if (attempt > maxRetries || !retryCondition(err)) {
        throw err;
      }
      
      const delay = calculateDelay(attempt, retryDelay, backoff);
      console.log(`[withRetry] Attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms...`);
      
      onRetry?.(attempt, err);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}
