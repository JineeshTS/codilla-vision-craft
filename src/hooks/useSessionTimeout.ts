import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface UseSessionTimeoutOptions {
  /** Timeout duration in minutes (default: 30) */
  timeoutMinutes?: number;
  /** Warning duration before timeout in minutes (default: 5) */
  warningMinutes?: number;
}

/**
 * Hook to manage session timeout and auto-logout
 * Monitors user activity and signs out after inactivity
 */
export function useSessionTimeout(options: UseSessionTimeoutOptions = {}) {
  const {
    timeoutMinutes = 30,
    warningMinutes = 5,
  } = options;

  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const logout = useCallback(async () => {
    clearTimers();
    await supabase.auth.signOut();
    toast({
      title: "Session Expired",
      description: "You've been logged out due to inactivity.",
      variant: "destructive",
    });
    navigate('/auth');
  }, [clearTimers, navigate, toast]);

  const startCountdown = useCallback(() => {
    const warningSeconds = warningMinutes * 60;
    setSecondsRemaining(warningSeconds);
    
    countdownRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [warningMinutes]);

  const resetTimer = useCallback(() => {
    clearTimers();
    setShowWarning(false);
    lastActivityRef.current = Date.now();

    const timeoutMs = timeoutMinutes * 60 * 1000;
    const warningMs = (timeoutMinutes - warningMinutes) * 60 * 1000;

    warningRef.current = setTimeout(() => {
      setShowWarning(true);
      startCountdown();
    }, warningMs);

    timeoutRef.current = setTimeout(() => {
      logout();
    }, timeoutMs);
  }, [clearTimers, timeoutMinutes, warningMinutes, startCountdown, logout]);

  const extendSession = useCallback(() => {
    setShowWarning(false);
    resetTimer();
    toast({
      title: "Session Extended",
      description: "Your session has been extended.",
    });
  }, [resetTimer, toast]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        clearTimers();
        return;
      }
      resetTimer();
    };

    checkAuth();

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    const handleActivity = () => {
      const now = Date.now();
      // Only reset if more than 1 second has passed since last activity
      if (now - lastActivityRef.current > 1000) {
        resetTimer();
      }
    };

    events.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

    return () => {
      clearTimers();
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [resetTimer, clearTimers]);

  return {
    showWarning,
    secondsRemaining,
    extendSession,
    logout,
  };
}
