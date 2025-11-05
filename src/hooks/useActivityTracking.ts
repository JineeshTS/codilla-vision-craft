import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to automatically track user activity
 * Updates last_active_at in profiles table periodically
 */
export function useActivityTracking() {
  const lastUpdateRef = useRef<number>(Date.now());
  const updateIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const updateActivity = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) return;

        // Only update if more than 5 minutes have passed
        const now = Date.now();
        const timeSinceLastUpdate = now - lastUpdateRef.current;
        
        if (timeSinceLastUpdate >= 5 * 60 * 1000) {
          // Update profile (trigger will update last_active_at)
          await supabase
            .from('profiles')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', session.user.id);
          
          lastUpdateRef.current = now;
        }
      } catch (error) {
        console.error('Error updating activity:', error);
      }
    };

    // Update activity on mount
    updateActivity();

    // Set up interval to check every 5 minutes
    updateIntervalRef.current = setInterval(updateActivity, 5 * 60 * 1000);

    // Activity event listeners for immediate tracking
    const events = [
      'mousedown',
      'keypress',
      'scroll',
      'touchstart',
    ];

    const handleActivity = () => {
      // Throttled update check
      const now = Date.now();
      if (now - lastUpdateRef.current >= 5 * 60 * 1000) {
        updateActivity();
      }
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Cleanup
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, []);
}
