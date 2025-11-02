import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/**
 * Centralized authentication guard hook for UX purposes only.
 * 
 * IMPORTANT SECURITY NOTE:
 * This hook provides client-side authentication checks to improve UX by
 * redirecting unauthenticated users to the login page. However, this is NOT
 * a security measure - it only prevents displaying protected UI.
 * 
 * ACTUAL SECURITY is enforced by:
 * - Row Level Security (RLS) policies on Supabase tables
 * - JWT verification in edge functions
 * - Server-side authentication checks
 * 
 * Attackers can bypass client-side redirects, but they cannot bypass RLS policies
 * or access data they don't own.
 */
export const useAuthGuard = (redirectTo: string = '/auth') => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (mounted) {
        setIsAuthenticated(!!session);
        if (!session) {
          navigate(redirectTo);
        }
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        setIsAuthenticated(!!session);
        if (!session) {
          navigate(redirectTo);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, redirectTo]);

  return isAuthenticated;
};
