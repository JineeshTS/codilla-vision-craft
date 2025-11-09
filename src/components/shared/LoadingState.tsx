/**
 * Standardized loading state component with multiple variants
 */

import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingStateProps {
  variant?: 'page' | 'inline' | 'skeleton';
  message?: string;
  className?: string;
}

export function LoadingState({ 
  variant = 'inline', 
  message = 'Loading...', 
  className = '' 
}: LoadingStateProps) {
  if (variant === 'page') {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${className}`}>
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div className={`space-y-4 ${className}`}>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  // inline variant (default)
  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <Loader2 className="w-8 h-8 animate-spin text-primary mr-2" />
      <span className="text-muted-foreground">{message}</span>
    </div>
  );
}
