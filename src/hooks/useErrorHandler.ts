
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

    // Ensure we have an Error object
    const errorObj = error instanceof Error ? error : new Error(String(error));

    // Log the error
    if (logError) {
      console.error('Error handled by useErrorHandler:', errorObj);
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
