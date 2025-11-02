import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import Navbar from "@/components/Navbar";
import { BarChart, TrendingUp, Target, Zap, Clock, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const Analytics = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAuthenticated = useAuthGuard();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalIdeas: 0,
    validatedIdeas: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalTokensSpent: 0,
    avgConsensusScore: 0,
    successRate: 0,
    avgTimeToValidation: 0,
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchAnalytics();
    }
  }, [isAuthenticated]);

  const fetchAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const [ideasRes, projectsRes] = await Promise.all([
        supabase.from("ideas").select("*").eq("user_id", user.id),
        supabase.from("projects").select("*").eq("user_id", user.id),
      ]);

      if (ideasRes.error) throw ideasRes.error;
      if (projectsRes.error) throw projectsRes.error;

      const ideas = ideasRes.data || [];
      const projects = projectsRes.data || [];

      const validatedIdeas = ideas.filter(i => i.status === "validated" || i.status === "in_development" || i.status === "completed");
      const completedProjects = projects.filter(p => p.progress_percentage === 100);
      
      const totalTokensSpent = ideas.reduce((sum, idea) => sum + (idea.tokens_spent || 0), 0);
      
      const scoresWithConsensus = ideas.filter(i => i.consensus_score !== null);
      const avgScore = scoresWithConsensus.length > 0
        ? scoresWithConsensus.reduce((sum, i) => sum + i.consensus_score, 0) / scoresWithConsensus.length
        : 0;

      setStats({
        totalIdeas: ideas.length,
        validatedIdeas: validatedIdeas.length,
        activeProjects: projects.length,
        completedProjects: completedProjects.length,
        totalTokensSpent,
        avgConsensusScore: Math.round(avgScore),
        successRate: ideas.length > 0 ? Math.round((validatedIdeas.length / ideas.length) * 100) : 0,
        avgTimeToValidation: 24, // Mock data - would calculate from actual timestamps
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading analytics",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen cosmic-bg">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cosmic-bg">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BarChart className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold gradient-text">Analytics</h1>
          </div>
          <p className="text-muted-foreground">
            Track your innovation journey and success metrics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-panel p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">Total Ideas</span>
              <Target className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">{stats.totalIdeas}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.validatedIdeas} validated
            </p>
          </Card>

          <Card className="glass-panel p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">Active Projects</span>
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">{stats.activeProjects}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.completedProjects} completed
            </p>
          </Card>

          <Card className="glass-panel p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">Success Rate</span>
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold">{stats.successRate}%</p>
            <Progress value={stats.successRate} className="h-2 mt-2" />
          </Card>

          <Card className="glass-panel p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">Tokens Spent</span>
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">{stats.totalTokensSpent.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Total investment
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="glass-panel p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Validation Performance
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Average Consensus Score</span>
                  <span className="font-semibold">{stats.avgConsensusScore}%</span>
                </div>
                <Progress value={stats.avgConsensusScore} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Validation Success Rate</span>
                  <span className="font-semibold">{stats.successRate}%</span>
                </div>
                <Progress value={stats.successRate} className="h-2" />
              </div>
              <div className="pt-4 border-t border-muted">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg. Time to Validation</span>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">{stats.avgTimeToValidation}h</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="glass-panel p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BarChart className="w-5 h-5 text-primary" />
              Project Progress
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Projects Started</span>
                  <span className="font-semibold">{stats.activeProjects}</span>
                </div>
                <div className="h-8 bg-primary/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary-glow"
                    style={{ width: `${stats.activeProjects > 0 ? 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Projects Completed</span>
                  <span className="font-semibold">{stats.completedProjects}</span>
                </div>
                <div className="h-8 bg-green-500/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-400"
                    style={{ 
                      width: `${stats.activeProjects > 0 ? (stats.completedProjects / stats.activeProjects) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-muted">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Completion Rate</span>
                  <span className="font-semibold">
                    {stats.activeProjects > 0 
                      ? Math.round((stats.completedProjects / stats.activeProjects) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Card className="glass-panel p-8 text-center">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-semibold mb-2">Keep Building!</h2>
          <p className="text-muted-foreground mb-4">
            Your success rate shows great potential. Continue validating and building to improve your metrics.
          </p>
          {stats.totalIdeas === 0 && (
            <p className="text-sm text-muted-foreground">
              Start by capturing your first idea to see your analytics grow!
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Analytics;