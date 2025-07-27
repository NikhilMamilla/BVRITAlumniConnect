// ErrorBoundary.tsx
// Placeholder for ErrorBoundary component

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

declare global {
  interface Window {
    Sentry?: { captureException: (error: Error, context?: any) => void };
  }
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Sentry or other error reporting can be added here
    if (typeof window !== 'undefined' && typeof window.Sentry?.captureException === 'function') {
      window.Sentry.captureException(error, { extra: errorInfo });
    }
    // Fallback: log to console
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-background p-8 rounded-lg border border-dashed border-destructive/50" role="alert" aria-live="assertive">
          <div className="text-destructive">
            <AlertTriangle className="h-16 w-16" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-foreground">Something went wrong</h1>
          <p className="mt-2 text-center text-muted-foreground">
            We're sorry for the inconvenience. An unexpected error occurred.<br />
            If this keeps happening, please <a href="mailto:support@yourdomain.com" className="underline text-primary">contact support</a>.
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="mt-4 p-4 text-left text-xs bg-muted rounded-md overflow-auto max-w-full">
              {this.state.error.stack || this.state.error.message}
            </pre>
          )}
          <div className="flex gap-4 mt-8">
            <Button onClick={this.handleReset} variant="default">
              Retry
            </Button>
            <Button onClick={this.handleGoHome} variant="secondary">
              <Home className="h-4 w-4 mr-2" /> Go Home
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
} 