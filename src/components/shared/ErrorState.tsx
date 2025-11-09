/**
 * Standardized error state component with retry functionality
 */

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getErrorMessage } from '@/lib/errorTracking';

interface ErrorStateProps {
  error: Error | string;
  onRetry?: () => void;
  variant?: 'page' | 'inline';
  className?: string;
}

export function ErrorState({ 
  error, 
  onRetry, 
  variant = 'inline',
  className = '' 
}: ErrorStateProps) {
  const errorMessage = getErrorMessage(error);

  if (variant === 'page') {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen p-4 ${className}`}>
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          {errorMessage}
        </p>
        {onRetry && (
          <Button onClick={onRetry}>
            Try Again
          </Button>
        )}
      </div>
    );
  }

  // inline variant (default)
  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{errorMessage}</span>
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="ml-4"
          >
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
