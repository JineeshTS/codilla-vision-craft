import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface UseSessionTimeoutOptions {
  /** Timeout duration in milliseconds (default: 30 minutes) */
  timeout?: number;
  /** Warning duration before timeout in milliseconds (default: 2 minutes) */
  warningDuration?: number;
  /** Callback when session is about to timeout */
  onWarning?: () => void;
  /** Callback when session times out */
  onTimeout?: () => void;
}

/**
 * Hook to manage session timeout and auto-logout
 * Monitors user activity and signs out after inactivity
 */
export function useSessionTimeout(options: UseSessionTimeoutOptions = {}) {
  const {
    timeout = 30 * 60 * 1000, // 30 minutes
    warningDuration = 2 * 60 * 1000, // 2 minutes
    onWarning,
    onTimeout,
  } = options;

  const navigate = useNavigate();
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();

    toast({
      title: 'Session expired',
      description: 'You have been signed out due to inactivity.',
      variant: 'destructive',
    });

    navigate('/auth');

    if (onTimeout) {
      onTimeout();
    }
  }, [navigate, toast, onTimeout]);

  const showWarning = useCallback(() => {
    toast({
      title: 'Session expiring soon',
      description: 'Your session will expire in 2 minutes due to inactivity.',
    });

    if (onWarning) {
      onWarning();
    }
  }, [toast, onWarning]);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
    }

    // Set warning timer
    warningRef.current = setTimeout(() => {
      showWarning();
    }, timeout - warningDuration);

    // Set timeout timer
    timeoutRef.current = setTimeout(() => {
      signOut();
    }, timeout);
  }, [timeout, warningDuration, showWarning, signOut]);

  const handleActivity = useCallback(() => {
    // Only reset if it's been more than 1 minute since last activity
    // This prevents excessive timer resets
    const timeSinceLastActivity = Date.now() - lastActivityRef.current;
    if (timeSinceLastActivity > 60 * 1000) {
      resetTimer();
    }
  }, [resetTimer]);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        resetTimer();

        // Activity event listeners
        const events = [
          'mousedown',
          'mousemove',
          'keypress',
          'scroll',
          'touchstart',
          'click',
        ];

        events.forEach(event => {
          document.addEventListener(event, handleActivity);
        });

        return () => {
          events.forEach(event => {
            document.removeEventListener(event, handleActivity);
          });

          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          if (warningRef.current) {
            clearTimeout(warningRef.current);
          }
        };
      }
    };

    checkAuth();
  }, [resetTimer, handleActivity]);

  return {
    resetTimer,
    lastActivity: lastActivityRef.current,
  };
}
