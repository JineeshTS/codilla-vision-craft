import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Lightbulb, TrendingUp, Archive } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Idea {
  id: string;
  title: string;
  description: string;
  status: string;
  consensus_score: number | null;
  tokens_spent: number;
  created_at: string;
}

const Ideas = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchIdeas();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchIdeas = async () => {
    try {
      const { data, error } = await supabase
        .from("ideas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setIdeas(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading ideas",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft": return <Lightbulb className="w-4 h-4" />;
      case "validating": return <TrendingUp className="w-4 h-4" />;
      case "validated": return <TrendingUp className="w-4 h-4" />;
      case "in_development": return <TrendingUp className="w-4 h-4" />;
      case "completed": return <Archive className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-muted";
      case "validating": return "bg-blue-500/20 text-blue-400";
      case "validated": return "bg-green-500/20 text-green-400";
      case "in_development": return "bg-purple-500/20 text-purple-400";
      case "completed": return "bg-primary/20";
      default: return "bg-muted";
    }
  };

  return (
    <div className="min-h-screen cosmic-bg">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">Your Ideas</h1>
            <p className="text-muted-foreground text-sm md:text-base">Capture, validate, and develop your concepts</p>
          </div>
          <Button onClick={() => navigate("/ideas/new")} className="glow-on-hover w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            New Idea
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading ideas...</p>
          </div>
        ) : ideas.length === 0 ? (
          <Card className="glass-panel p-12 text-center">
            <Lightbulb className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-semibold mb-2">No ideas yet</h2>
            <p className="text-muted-foreground mb-6">Start your journey by capturing your first idea</p>
            <Button onClick={() => navigate("/ideas/new")}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Idea
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {ideas.map((idea) => (
              <Card
                key={idea.id}
                className="glass-panel p-6 cursor-pointer hover:scale-105 transition-transform"
                onClick={() => navigate(`/ideas/${idea.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <Badge className={getStatusColor(idea.status)}>
                    {getStatusIcon(idea.status)}
                    <span className="ml-1">{idea.status.replace("_", " ")}</span>
                  </Badge>
                  {idea.consensus_score && (
                    <div className="text-sm font-semibold text-primary">
                      {idea.consensus_score}% consensus
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-semibold mb-2">{idea.title}</h3>
                <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                  {idea.description}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{idea.tokens_spent} tokens spent</span>
                  <span>{new Date(idea.created_at).toLocaleDateString()}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Ideas;