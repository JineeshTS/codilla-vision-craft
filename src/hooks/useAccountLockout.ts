import { useState, useCallback, useEffect } from 'react';

const LOCKOUT_KEY = 'codilla_login_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

interface LockoutData {
  attempts: number;
  lockedUntil: number | null;
}

export const useAccountLockout = () => {
  const [lockoutData, setLockoutData] = useState<LockoutData>({ attempts: 0, lockedUntil: null });
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Load lockout data from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(LOCKOUT_KEY);
    if (stored) {
      try {
        const data: LockoutData = JSON.parse(stored);
        // Check if lockout has expired
        if (data.lockedUntil && Date.now() > data.lockedUntil) {
          // Reset lockout
          const resetData = { attempts: 0, lockedUntil: null };
          localStorage.setItem(LOCKOUT_KEY, JSON.stringify(resetData));
          setLockoutData(resetData);
        } else {
          setLockoutData(data);
        }
      } catch {
        localStorage.removeItem(LOCKOUT_KEY);
      }
    }
  }, []);

  // Update time remaining countdown
  useEffect(() => {
    if (!lockoutData.lockedUntil) {
      setTimeRemaining(0);
      return;
    }

    const updateRemaining = () => {
      const remaining = Math.max(0, lockoutData.lockedUntil! - Date.now());
      setTimeRemaining(remaining);

      if (remaining === 0) {
        // Reset lockout
        const resetData = { attempts: 0, lockedUntil: null };
        localStorage.setItem(LOCKOUT_KEY, JSON.stringify(resetData));
        setLockoutData(resetData);
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [lockoutData.lockedUntil]);

  const isLockedOut = useCallback(() => {
    return lockoutData.lockedUntil !== null && Date.now() < lockoutData.lockedUntil;
  }, [lockoutData.lockedUntil]);

  const recordFailedAttempt = useCallback(() => {
    const newAttempts = lockoutData.attempts + 1;
    const newData: LockoutData = {
      attempts: newAttempts,
      lockedUntil: newAttempts >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_DURATION_MS : null,
    };
    localStorage.setItem(LOCKOUT_KEY, JSON.stringify(newData));
    setLockoutData(newData);
    return newAttempts;
  }, [lockoutData.attempts]);

  const resetAttempts = useCallback(() => {
    const resetData = { attempts: 0, lockedUntil: null };
    localStorage.setItem(LOCKOUT_KEY, JSON.stringify(resetData));
    setLockoutData(resetData);
  }, []);

  const getRemainingAttempts = useCallback(() => {
    return Math.max(0, MAX_ATTEMPTS - lockoutData.attempts);
  }, [lockoutData.attempts]);

  const formatTimeRemaining = useCallback(() => {
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [timeRemaining]);

  return {
    isLockedOut,
    recordFailedAttempt,
    resetAttempts,
    getRemainingAttempts,
    formatTimeRemaining,
    timeRemaining,
    attempts: lockoutData.attempts,
    maxAttempts: MAX_ATTEMPTS,
  };
};
