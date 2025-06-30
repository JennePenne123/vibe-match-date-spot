
import React, { ReactNode } from 'react';
import ErrorBoundary from './ErrorBoundary';

interface SafeComponentProps {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

const SafeComponent: React.FC<SafeComponentProps> = ({
  children,
  fallback,
  componentName,
  onError,
}) => {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error(`Error in ${componentName || 'SafeComponent'}:`, error, errorInfo);
    
    if (onError) {
      onError(error, errorInfo);
    }
  };

  return (
    <ErrorBoundary
      level="component"
      fallback={fallback}
      onError={handleError}
    >
      {children}
    </ErrorBoundary>
  );
};

export default SafeComponent;
