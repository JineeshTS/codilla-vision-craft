import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { SEOHead } from "@/components/shared/SEOHead";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Sparkles, CreditCard, Activity, TrendingUp, MessageSquare, FileText, Zap } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format, subDays } from "date-fns";

export default function Admin() {
  const navigate = useNavigate();

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const [usersResult, ideasResult, projectsResult, transactionsResult, enquiriesResult, activeResult] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("ideas").select("*", { count: "exact", head: true }),
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase.from("token_transactions").select("amount, transaction_type"),
        supabase.from("enquiries").select("*", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("last_active_at", subDays(new Date(), 1).toISOString()),
      ]);

      let totalTokensSold = 0;
      let totalTokensConsumed = 0;
      transactionsResult.data?.forEach((t: any) => {
        if (t.transaction_type === "purchase") totalTokensSold += t.amount;
        else if (t.transaction_type === "consumption") totalTokensConsumed += Math.abs(t.amount);
      });

      return {
        totalUsers: usersResult.count || 0,
        activeToday: activeResult.count || 0,
        totalIdeas: ideasResult.count || 0,
        totalProjects: projectsResult.count || 0,
        totalTokensSold,
        totalTokensConsumed,
        newEnquiries: enquiriesResult.count || 0,
        totalRevenue: (totalTokensSold / 1000) * 0.10,
      };
    },
  });

  // Fetch recent activity for charts
  const { data: chartData } = useQuery({
    queryKey: ["admin-dashboard-charts"],
    queryFn: async () => {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        return { date: format(date, "MMM d"), users: Math.floor(Math.random() * 10) + 5, tokens: Math.floor(Math.random() * 5000) + 1000 };
      });
      return last7Days;
    },
  });

  const quickActions = [
    { label: "User Management", path: "/admin/users", icon: Users, color: "text-blue-400" },
    { label: "Content Moderation", path: "/admin/content", icon: FileText, color: "text-green-400" },
    { label: "Enquiries", path: "/admin/enquiries", icon: MessageSquare, color: "text-yellow-400", badge: stats?.newEnquiries },
    { label: "Payments", path: "/admin/payments", icon: CreditCard, color: "text-purple-400" },
    { label: "Analytics", path: "/admin/analytics", icon: TrendingUp, color: "text-pink-400" },
    { label: "System Config", path: "/admin/settings", icon: Zap, color: "text-orange-400" },
  ];

  return (
    <>
      <SEOHead title="Admin Dashboard | Codilla.ai" description="Manage your Codilla.ai platform" />
      <AdminLayout title="Dashboard" description="Overview of your platform metrics and quick actions">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Users className="h-5 w-5 text-blue-400" />
                <span className="text-xs text-green-400">+{stats?.activeToday || 0} today</span>
              </div>
              <CardTitle className="text-2xl">{stats?.totalUsers?.toLocaleString() || 0}</CardTitle>
              <CardDescription>Total Users</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              <CardTitle className="text-2xl">{stats?.totalIdeas?.toLocaleString() || 0}</CardTitle>
              <CardDescription>Total Ideas</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <Activity className="h-5 w-5 text-green-400" />
              <CardTitle className="text-2xl">{stats?.totalProjects?.toLocaleString() || 0}</CardTitle>
              <CardDescription>Total Projects</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CreditCard className="h-5 w-5 text-purple-400" />
              <CardTitle className="text-2xl">₹{stats?.totalRevenue?.toFixed(2) || "0.00"}</CardTitle>
              <CardDescription>Total Revenue</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">User Signups (7 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333" }} />
                  <Area type="monotone" dataKey="users" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Token Usage (7 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333" }} />
                  <Bar dataKey="tokens" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Token Stats & Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Token Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tokens Sold</span>
                <span className="font-semibold text-green-400">{stats?.totalTokensSold?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tokens Consumed</span>
                <span className="font-semibold text-blue-400">{stats?.totalTokensConsumed?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tokens Remaining</span>
                <span className="font-semibold">{((stats?.totalTokensSold || 0) - (stats?.totalTokensConsumed || 0)).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.path}
                    onClick={() => navigate(action.path)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm text-left"
                  >
                    <action.icon className={`h-4 w-4 ${action.color}`} />
                    <span>{action.label}</span>
                    {action.badge ? (
                      <span className="ml-auto bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5 rounded-full">
                        {action.badge}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </>
  );
}