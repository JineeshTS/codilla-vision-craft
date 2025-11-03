import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Users, Sparkles, CreditCard, TrendingUp, AlertCircle, Activity } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Admin() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    totalRevenue: 0,
    totalTokensSold: 0,
    totalTokensConsumed: 0,
    totalIdeas: 0,
    totalProjects: 0,
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (userRole?.role !== 'admin') {
        toast.error("Unauthorized - Admin access required");
        navigate('/dashboard');
        return;
      }

      setIsAdmin(true);
      await loadStats();
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Get total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total ideas
      const { count: ideasCount } = await supabase
        .from('ideas')
        .select('*', { count: 'exact', head: true });

      // Get total projects
      const { count: projectsCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });

      // Get token transactions
      const { data: transactions } = await supabase
        .from('token_transactions')
        .select('amount, transaction_type');

      let totalRevenue = 0;
      let totalTokensSold = 0;
      let totalTokensConsumed = 0;

      transactions?.forEach(t => {
        if (t.transaction_type === 'purchase') {
          totalTokensSold += t.amount;
        } else if (t.transaction_type === 'consumption') {
          totalTokensConsumed += Math.abs(t.amount);
        }
      });

      // Estimate revenue (₹0.10 per 1k tokens)
      totalRevenue = (totalTokensSold / 1000) * 0.10;

      setStats({
        totalUsers: usersCount || 0,
        activeToday: 0, // TODO: Implement active users tracking
        totalRevenue,
        totalTokensSold,
        totalTokensConsumed,
        totalIdeas: ideasCount || 0,
        totalProjects: projectsCount || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error("Failed to load statistics");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your Codilla.ai platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
          <p className="text-sm text-muted-foreground">Total Users</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <div className="text-2xl font-bold">{stats.totalIdeas.toLocaleString()}</div>
          <p className="text-sm text-muted-foreground">Total Ideas</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <Activity className="h-8 w-8 text-primary" />
          </div>
          <div className="text-2xl font-bold">{stats.totalProjects.toLocaleString()}</div>
          <p className="text-sm text-muted-foreground">Total Projects</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <CreditCard className="h-8 w-8 text-primary" />
          </div>
          <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
          <p className="text-sm text-muted-foreground">Total Revenue</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Token Statistics</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tokens Sold</span>
              <span className="font-semibold">{stats.totalTokensSold.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tokens Consumed</span>
              <span className="font-semibold">{stats.totalTokensConsumed.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Remaining</span>
              <span className="font-semibold">
                {(stats.totalTokensSold - stats.totalTokensConsumed).toLocaleString()}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/admin/users')}
              className="w-full text-left px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
            >
              Manage Users
            </button>
            <button
              onClick={() => navigate('/admin/settings')}
              className="w-full text-left px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
            >
              System Settings
            </button>
            <button
              onClick={() => navigate('/admin/content')}
              className="w-full text-left px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
            >
              Content Moderation
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
