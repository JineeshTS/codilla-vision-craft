/**
 * Centralized error tracking and logging utility
 * 
 * This module provides a consistent way to log errors, warnings, and info messages
 * across the application. In production, this can be integrated with services like
 * Sentry, LogRocket, or other error tracking platforms.
 */

interface LogContext {
  [key: string]: unknown;
}

interface ErrorLog {
  message: string;
  stack?: string;
  context?: LogContext;
  timestamp: string;
  level: 'error' | 'warning' | 'info';
}

const isDevelopment = import.meta.env.DEV;

/**
 * Store recent errors for development debugging
 */
const errorHistory: ErrorLog[] = [];
const MAX_HISTORY = 50;

/**
 * Add error to history (development only)
 */
function addToHistory(log: ErrorLog): void {
  if (isDevelopment) {
    errorHistory.unshift(log);
    if (errorHistory.length > MAX_HISTORY) {
      errorHistory.pop();
    }
  }
}

/**
 * Log an error with optional context
 * In production, this should send to an error tracking service
 */
export function logError(error: Error | string, context?: LogContext): void {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;

  const log: ErrorLog = {
    message: errorMessage,
    stack: errorStack,
    context,
    timestamp: new Date().toISOString(),
    level: 'error',
  };

  addToHistory(log);

  if (isDevelopment) {
    console.error('[ERROR]', errorMessage, {
      stack: errorStack,
      context,
      timestamp: log.timestamp,
    });
  }

  // TODO: In production, send to error tracking service (Sentry, LogRocket, etc.)
  // Example: Sentry.captureException(error, { extra: context });
}

/**
 * Log a warning with optional context
 */
export function logWarning(message: string, context?: LogContext): void {
  const log: ErrorLog = {
    message,
    context,
    timestamp: new Date().toISOString(),
    level: 'warning',
  };

  addToHistory(log);

  if (isDevelopment) {
    console.warn('[WARNING]', message, {
      context,
      timestamp: log.timestamp,
    });
  }

  // TODO: In production, send to error tracking service
}

/**
 * Log an informational message with optional context
 * Use sparingly - primarily for important application events
 */
export function logInfo(message: string, context?: LogContext): void {
  const log: ErrorLog = {
    message,
    context,
    timestamp: new Date().toISOString(),
    level: 'info',
  };

  addToHistory(log);

  if (isDevelopment) {
    console.info('[INFO]', message, {
      context,
      timestamp: log.timestamp,
    });
  }

  // TODO: In production, send to error tracking service
}

/**
 * Get error history (development only)
 */
export function getErrorHistory(): ErrorLog[] {
  return [...errorHistory];
}

/**
 * Clear error history (development only)
 */
export function clearErrorHistory(): void {
  errorHistory.length = 0;
}

/**
 * Helper to safely extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

/**
 * Helper to create a user-friendly error message
 */
export function getUserFriendlyError(error: unknown): string {
  const message = getErrorMessage(error);
  
  // Map technical errors to user-friendly messages
  if (message.includes('JWT') || message.includes('auth')) {
    return 'Session expired. Please sign in again.';
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Network error. Please check your connection.';
  }
  if (message.includes('permission') || message.includes('unauthorized')) {
    return 'You do not have permission to perform this action.';
  }
  if (message.includes('not found')) {
    return 'The requested resource was not found.';
  }
  
  return 'An unexpected error occurred. Please try again.';
}
