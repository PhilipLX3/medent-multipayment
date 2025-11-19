'use client';

import React from 'react';
import { useSessionManager } from '@/shared/utils/sessionManager';

interface ApiErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  isSessionError: boolean;
}

interface ApiErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

/**
 * Error boundary specifically for handling API-related errors including session expiration
 */
export class ApiErrorBoundary extends React.Component<ApiErrorBoundaryProps, ApiErrorBoundaryState> {
  private sessionManager = useSessionManager();

  constructor(props: ApiErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isSessionError: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ApiErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ApiErrorBoundary] Error caught:', error, errorInfo);

    // Check if this is a session-related error
    const isSessionError = this.sessionManager.handleApiError(error);
    
    this.setState({
      isSessionError,
    });

    // If it's not a session error, we'll display our fallback UI
    if (!isSessionError) {
      console.error('[ApiErrorBoundary] Non-session error, showing fallback UI');
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      isSessionError: false,
    });
  };

  render() {
    if (this.state.hasError && !this.state.isSessionError) {
      const { fallback: FallbackComponent } = this.props;
      
      if (FallbackComponent && this.state.error) {
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />;
      }
    }

    // If it's a session error, the session manager will handle redirection
    // If no error, render children normally
    return this.props.children;
  }
}

// Hook version for functional components
export const useApiErrorHandler = () => {
  const sessionManager = useSessionManager();

  const handleError = React.useCallback((error: any) => {
    const handled = sessionManager.handleApiError(error);
    return handled;
  }, [sessionManager]);

  return { handleError };
};

export default ApiErrorBoundary;
