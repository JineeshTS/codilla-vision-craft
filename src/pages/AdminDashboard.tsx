import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Users, Lightbulb, Rocket, DollarSign, TrendingUp, Activity } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface AdminStats {
  totalUsers: number;
  totalIdeas: number;
  totalProjects: number;
  totalTokensDistributed: number;
  totalTokensConsumed: number;
  recentUsers: number;
  activeProjects: number;
  validatedIdeas: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalIdeas: 0,
    totalProjects: 0,
    totalTokensDistributed: 0,
    totalTokensConsumed: 0,
    recentUsers: 0,
    activeProjects: 0,
    validatedIdeas: 0,
  });
  const [loading, setLoading] = useState(true);

  useAuthGuard();

  useEffect(() => {
    checkAdminRole();
  }, []);

  const checkAdminRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    // Check if user has admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!roleData || roleData.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel.",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    fetchAdminStats();
  };

  const fetchAdminStats = async () => {
    try {
      setLoading(true);

      // Get total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Get recent users (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { count: recentUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo.toISOString());

      // Get total ideas
      const { count: totalIdeas } = await supabase
        .from("ideas")
        .select("*", { count: "exact", head: true });

      // Get validated ideas
      const { count: validatedIdeas } = await supabase
        .from("ideas")
        .select("*", { count: "exact", head: true })
        .eq("status", "validated");

      // Get total projects
      const { count: totalProjects } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true });

      // Get active projects (not completed)
      const { count: activeProjects } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .lt("current_phase", 10);

      // Get token statistics
      const { data: tokenStats } = await supabase
        .from("profiles")
        .select("total_tokens, tokens_used");

      const totalTokensDistributed = tokenStats?.reduce((sum, profile) => sum + profile.total_tokens, 0) || 0;
      const totalTokensConsumed = tokenStats?.reduce((sum, profile) => sum + profile.tokens_used, 0) || 0;

      setStats({
        totalUsers: totalUsers || 0,
        totalIdeas: totalIdeas || 0,
        totalProjects: totalProjects || 0,
        totalTokensDistributed,
        totalTokensConsumed,
        recentUsers: recentUsers || 0,
        activeProjects: activeProjects || 0,
        validatedIdeas: validatedIdeas || 0,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      toast({
        title: "Error",
        description: "Failed to load admin statistics.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen cosmic-bg">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading admin dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cosmic-bg">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and management</p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <Card className="glass-panel p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">Total Users</span>
              <Users className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">{stats.totalUsers}</p>
            <p className="text-sm text-green-400 mt-1">+{stats.recentUsers} this week</p>
          </Card>

          <Card className="glass-panel p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">Total Ideas</span>
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">{stats.totalIdeas}</p>
            <p className="text-sm text-muted-foreground mt-1">{stats.validatedIdeas} validated</p>
          </Card>

          <Card className="glass-panel p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">Active Projects</span>
              <Rocket className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">{stats.activeProjects}</p>
            <p className="text-sm text-muted-foreground mt-1">of {stats.totalProjects} total</p>
          </Card>

          <Card className="glass-panel p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">Tokens Consumed</span>
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">{stats.totalTokensConsumed.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-1">of {stats.totalTokensDistributed.toLocaleString()} distributed</p>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="glass-panel p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              System Activity
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Validation Success Rate</span>
                <span className="font-semibold">
                  {stats.totalIdeas > 0 ? Math.round((stats.validatedIdeas / stats.totalIdeas) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Projects Completion Rate</span>
                <span className="font-semibold">
                  {stats.totalProjects > 0 ? Math.round(((stats.totalProjects - stats.activeProjects) / stats.totalProjects) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Token Utilization</span>
                <span className="font-semibold">
                  {stats.totalTokensDistributed > 0 ? Math.round((stats.totalTokensConsumed / stats.totalTokensDistributed) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Avg Ideas per User</span>
                <span className="font-semibold">
                  {stats.totalUsers > 0 ? (stats.totalIdeas / stats.totalUsers).toFixed(1) : 0}
                </span>
              </div>
            </div>
          </Card>

          <Card className="glass-panel p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Token Economics
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Distributed</span>
                <span className="font-semibold">{stats.totalTokensDistributed.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Consumed</span>
                <span className="font-semibold text-red-400">{stats.totalTokensConsumed.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Available Balance</span>
                <span className="font-semibold text-green-400">
                  {(stats.totalTokensDistributed - stats.totalTokensConsumed).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Avg per User</span>
                <span className="font-semibold">
                  {stats.totalUsers > 0 ? Math.round((stats.totalTokensDistributed - stats.totalTokensConsumed) / stats.totalUsers).toLocaleString() : 0}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <Card
              className="glass-panel p-6 hover:scale-105 transition-transform cursor-pointer"
              onClick={() => navigate("/admin/users")}
            >
              <Users className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Manage Users</h3>
              <p className="text-muted-foreground text-sm">View and manage all users</p>
            </Card>

            <Card
              className="glass-panel p-6 hover:scale-105 transition-transform cursor-pointer"
              onClick={() => navigate("/admin/content")}
            >
              <Lightbulb className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Review Content</h3>
              <p className="text-muted-foreground text-sm">Moderate ideas and templates</p>
            </Card>

            <Card
              className="glass-panel p-6 hover:scale-105 transition-transform cursor-pointer"
              onClick={() => navigate("/analytics")}
            >
              <TrendingUp className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">View Analytics</h3>
              <p className="text-muted-foreground text-sm">Detailed system analytics</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
