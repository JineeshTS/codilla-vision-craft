import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
export const useAuthGuard = (redirectTo: string = '/auth', requireEmailVerification: boolean = true) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (mounted) {
        const authenticated = !!session;
        const emailVerified = !!session?.user?.email_confirmed_at;
        
        setIsAuthenticated(authenticated);
        setIsEmailVerified(emailVerified);
        
        if (!authenticated) {
          navigate(redirectTo);
        } else if (requireEmailVerification && !emailVerified && location.pathname !== '/verify-email') {
          navigate('/verify-email');
        }
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        const authenticated = !!session;
        const emailVerified = !!session?.user?.email_confirmed_at;
        
        setIsAuthenticated(authenticated);
        setIsEmailVerified(emailVerified);
        
        if (!authenticated) {
          navigate(redirectTo);
        } else if (requireEmailVerification && !emailVerified && location.pathname !== '/verify-email') {
          navigate('/verify-email');
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, redirectTo, requireEmailVerification, location.pathname]);

  return { isAuthenticated, isEmailVerified };
};
