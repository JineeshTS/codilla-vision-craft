import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Lightbulb } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Card } from "@/components/ui/card";
import { IdeaCard } from "@/components/shared/IdeaCard";
import type { Idea } from "@/types";

const Ideas = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuthGuard();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchIdeas();
    }
  }, [isAuthenticated]);

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
              <IdeaCard
                key={idea.id}
                idea={idea}
                onClick={() => navigate(`/ideas/${idea.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Ideas;