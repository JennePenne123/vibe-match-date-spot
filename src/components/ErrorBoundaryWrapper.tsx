import React from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';

interface ErrorBoundaryWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  error?: Error;
}

const DefaultErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div className="flex items-center justify-center min-h-[200px] p-6">
    <div className="text-center max-w-md">
      <h3 className="text-lg font-semibold text-red-600 mb-2">
        Something went wrong
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        {error.message || 'An unexpected error occurred'}
      </p>
      <button 
        onClick={() => window.location.reload()} 
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Reload Page
      </button>
    </div>
  </div>
);

export const ErrorBoundaryWrapper: React.FC<ErrorBoundaryWrapperProps> = ({ 
  children, 
  fallback,
  error
}) => {
  const defaultFallback = error ? <DefaultErrorFallback error={error} /> : (
    <div className="flex items-center justify-center min-h-[200px] p-6">
      <div className="text-center max-w-md">
        <h3 className="text-lg font-semibold text-red-600 mb-2">
          Something went wrong
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          An unexpected error occurred
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
  
  return (
    <ErrorBoundary fallback={fallback || defaultFallback}>
      {children}
    </ErrorBoundary>
  );
};