
import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

export interface ErrorHandlerOptions {
  showToast?: boolean;
  toastTitle?: string;
  toastDescription?: string;
  logError?: boolean;
  onError?: (error: Error) => void;
}

export const useErrorHandler = () => {
  const handleError = useCallback((
    error: Error | unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      toastTitle = 'Error',
      toastDescription,
      logError = true,
      onError,
    } = options;

    // Ensure we have an Error object and properly serialize it
    let errorObj: Error;
    if (error instanceof Error) {
      errorObj = error;
    } else if (typeof error === 'object' && error !== null) {
      // Handle Supabase errors and other objects
      const errorStr = JSON.stringify(error, null, 2);
      errorObj = new Error(`Error object: ${errorStr}`);
    } else {
      errorObj = new Error(String(error));
    }

    // Log the error with better formatting
    if (logError) {
      console.error('🚨 ERROR HANDLER - Error details:', {
        message: errorObj.message,
        stack: errorObj.stack,
        originalError: error,
        timestamp: new Date().toISOString()
      });
    }

    // Show toast notification
    if (showToast) {
      toast({
        variant: 'destructive',
        title: toastTitle,
        description: toastDescription || errorObj.message || 'An unexpected error occurred',
      });
    }

    // Call custom error handler
    if (onError) {
      onError(errorObj);
    }

    return errorObj;
  }, []);

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error, options);
      return null;
    }
  }, [handleError]);

  return {
    handleError,
    handleAsyncError,
  };
};
