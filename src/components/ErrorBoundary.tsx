
import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: 'app' | 'page' | 'component';
  silent?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // If silent mode is enabled, just log and render fallback or null
      if (this.props.silent) {
        console.warn('ErrorBoundary caught error (silent mode):', this.state.error);
        return this.props.fallback || null;
      }

      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI based on level
      const { level = 'component' } = this.props;
      
      if (level === 'app') {
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full space-y-6 text-center">
              <div className="flex justify-center">
                <AlertTriangle className="w-16 h-16 text-red-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Something went wrong
                </h1>
                <p className="text-gray-600 mb-6">
                  We're sorry, but something unexpected happened. Please try refreshing the page.
                </p>
              </div>
              <div className="space-y-3">
                <Button 
                  onClick={this.handleRetry}
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  onClick={this.handleGoHome}
                  className="w-full"
                  variant="outline"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left mt-4 p-4 bg-red-50 rounded-md">
                  <summary className="cursor-pointer text-red-700 font-medium">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 text-xs text-red-600 overflow-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        );
      }

      if (level === 'page') {
        return (
          <div className="min-h-[400px] flex items-center justify-center p-6">
            <Alert variant="destructive" className="max-w-md">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Page Error</AlertTitle>
              <AlertDescription className="mt-2">
                This page encountered an error. Please try refreshing or go back to the previous page.
                <div className="mt-4 space-x-2">
                  <Button 
                    onClick={this.handleRetry}
                    size="sm"
                    variant="outline"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry
                  </Button>
                  <Button 
                    onClick={() => window.history.back()}
                    size="sm"
                    variant="outline"
                  >
                    Go Back
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        );
      }

      // Component level error
      return (
        <div className="p-4 border border-red-200 rounded-md bg-red-50">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">Component Error</span>
          </div>
          <p className="text-red-600 text-sm mt-1">
            This component failed to render properly.
          </p>
          <Button 
            onClick={this.handleRetry}
            size="sm"
            variant="outline"
            className="mt-2"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
