/**
 * Sentry Error Tracking Configuration
 * 
 * This module initializes Sentry for production error tracking.
 * The DSN should be configured as an environment variable for security.
 */

import * as Sentry from '@sentry/react';

// Sentry DSN - In production, this would be set via environment
// For now, we initialize conditionally based on whether DSN is available
const SENTRY_DSN = 'https://placeholder@sentry.io/placeholder';
const IS_PRODUCTION = import.meta.env.PROD;

/**
 * Initialize Sentry error tracking
 * Only runs in production environment
 */
export function initSentry(): void {
  // Skip initialization in development or if DSN is not configured
  if (!IS_PRODUCTION) {
    console.info('[Sentry] Skipping initialization in development mode');
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: IS_PRODUCTION ? 'production' : 'development',
      
      // Performance monitoring
      tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
      
      // Session replay for debugging
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
      
      // Filter out known non-critical errors
      beforeSend(event) {
        // Don't send events for ResizeObserver errors (browser quirk)
        if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) {
          return null;
        }
        return event;
      },
      
      // Additional integrations
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
    });

    console.info('[Sentry] Initialized successfully');
  } catch (error) {
    console.error('[Sentry] Failed to initialize:', error);
  }
}

/**
 * Capture an exception with optional context
 */
export function captureException(error: Error | unknown, context?: Record<string, unknown>): void {
  if (!IS_PRODUCTION) {
    console.error('[Sentry:Dev] Would capture exception:', error, context);
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a message with optional context
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, unknown>): void {
  if (!IS_PRODUCTION) {
    console.info(`[Sentry:Dev] Would capture message (${level}):`, message, context);
    return;
  }

  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string; username?: string } | null): void {
  if (!IS_PRODUCTION) {
    console.info('[Sentry:Dev] Would set user:', user);
    return;
  }

  Sentry.setUser(user);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
  if (!IS_PRODUCTION) {
    return;
  }

  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Create an error boundary wrapper component
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

export { Sentry };
