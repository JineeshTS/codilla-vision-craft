import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Lightbulb, Rocket, CheckCircle, TrendingUp, Plus, Code } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useNavigate } from "react-router-dom";
import { GitHubRepoSelector } from "@/components/GitHubRepoSelector";
import { AIUsageChart } from "@/components/analytics/AIUsageChart";
import { CommitHistory } from "@/components/analytics/CommitHistory";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    ideas: 0,
    projects: 0,
    completed: 0,
    tokens: 0,
  });

  // Use centralized auth guard (UX-only, RLS provides actual security)
  useAuthGuard();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [ideasRes, projectsRes, profileRes] = await Promise.all([
      supabase.from("ideas").select("id, status", { count: "exact" }).eq("user_id", user.id),
      supabase.from("projects").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.from("profiles").select("total_tokens, tokens_used").eq("id", user.id).single(),
    ]);

    const completed = ideasRes.data?.filter(i => i.status === "completed").length || 0;

    setStats({
      ideas: ideasRes.data?.length || 0,
      projects: projectsRes.data?.length || 0,
      completed,
      tokens: profileRes.data ? profileRes.data.total_tokens - profileRes.data.tokens_used : 0,
    });
  };

  return (
    <div className="min-h-screen cosmic-bg">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Transform your ideas into reality</p>
        </div>

        <div className="mb-8">
          <GitHubRepoSelector />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <Card className="glass-panel p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">Active Ideas</span>
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">{stats.ideas}</p>
          </Card>

          <Card className="glass-panel p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">In Development</span>
              <Rocket className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">{stats.projects}</p>
          </Card>

          <Card className="glass-panel p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">Completed</span>
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold">{stats.completed}</p>
          </Card>

          <Card className="glass-panel p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">Available Tokens</span>
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">{stats.tokens.toLocaleString()}</p>
          </Card>
        </div>

        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">Development Analytics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AIUsageChart />
            <CommitHistory />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <Card 
              className="glass-panel p-6 hover:scale-105 transition-transform cursor-pointer"
              onClick={() => navigate("/ideas/new")}
            >
              <Plus className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Capture New Idea</h3>
              <p className="text-muted-foreground text-sm">Start the validation process</p>
            </Card>

          <Card 
            className="glass-panel p-6 hover:scale-105 transition-transform cursor-pointer"
            onClick={() => navigate("/code-ide")}
          >
            <Code className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">AI Code IDE</h3>
            <p className="text-muted-foreground text-sm">Generate & review code with AI</p>
          </Card>

          <Card 
            className="glass-panel p-6 hover:scale-105 transition-transform cursor-pointer"
            onClick={() => navigate("/deployment")}
          >
            <Rocket className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Deploy & Test</h3>
            <p className="text-muted-foreground text-sm">Production readiness checks</p>
          </Card>

            <Card 
              className="glass-panel p-6 hover:scale-105 transition-transform cursor-pointer"
              onClick={() => navigate("/ideas")}
            >
              <CheckCircle className="w-8 h-8 text-green-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">View All Ideas</h3>
              <p className="text-muted-foreground text-sm">Review your concepts</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;