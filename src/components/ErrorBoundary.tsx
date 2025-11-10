import React from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "./ui/button";
import { logError } from "@/lib/errorTracking";

interface Props {
  children: React.ReactNode;
  name?: string;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorLog = {
      componentName: this.props.name || "Unknown Component",
      error: {
        message: error.message,
        stack: error.stack,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Log error with full context
    logError(error, errorLog);

    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, errorId: undefined });
  };

  handleGoHome = () => {
    window.location.href = "/dashboard";
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="container mx-auto px-4 py-8">
          <div className="glass-panel p-8 max-w-2xl mx-auto">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="bg-destructive/10 p-4 rounded-full">
                <AlertCircle className="w-12 h-12 text-destructive" />
              </div>

              <h2 className="text-2xl font-bold">Something went wrong</h2>

              <p className="text-muted-foreground">
                {this.props.name || "This section"} encountered an unexpected error and couldn't load properly.
              </p>

              {import.meta.env.DEV && this.state.error && (
                <div className="w-full text-left bg-muted/50 rounded-lg p-4 mt-4">
                  <p className="text-sm font-mono text-destructive mb-2">
                    {this.state.error.message}
                  </p>
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Stack trace
                    </summary>
                    <pre className="mt-2 overflow-auto text-xs text-muted-foreground">
                      {this.state.error.stack}
                    </pre>
                  </details>
                </div>
              )}

              {this.state.errorId && (
                <p className="text-xs text-muted-foreground">
                  Error ID: {this.state.errorId}
                </p>
              )}

              <div className="flex gap-3 mt-6">
                <Button onClick={this.handleReset} variant="default">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={this.handleGoHome} variant="outline">
                  <Home className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Button>
              </div>

              <p className="text-xs text-muted-foreground mt-4">
                If this problem persists, please contact support with the error ID above.
              </p>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
