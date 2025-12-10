import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logError } from '@/lib/errorTracking';

/**
 * Admin-specific authentication guard hook.
 * Checks if the user is authenticated AND has admin role.
 */
export const useAdminGuard = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkAdminAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          if (mounted) {
            navigate('/auth');
          }
          return;
        }

        const { data: userRole, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();

        if (mounted) {
          if (error || !userRole) {
            toast.error("Unauthorized - Admin access required");
            navigate('/dashboard');
            setIsAdmin(false);
          } else {
            setIsAdmin(true);
          }
        }
      } catch (error) {
        logError(error instanceof Error ? error : new Error('Error checking admin access'), { context: 'useAdminGuard' });
        if (mounted) {
          navigate('/dashboard');
          setIsAdmin(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkAdminAccess();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  return { isAdmin, loading };
};
