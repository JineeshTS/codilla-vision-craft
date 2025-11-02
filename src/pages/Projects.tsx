import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Rocket, ExternalLink, GitBranch } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface Project {
  id: string;
  name: string;
  current_phase: number;
  progress_percentage: number;
  repository_url: string | null;
  deployment_url: string | null;
  created_at: string;
}

const Projects = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchProjects();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading projects",
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Your Projects</h1>
            <p className="text-muted-foreground">Track your validated ideas in development</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <Card className="glass-panel p-12 text-center">
            <Rocket className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-semibold mb-2">No projects yet</h2>
            <p className="text-muted-foreground mb-6">
              Validate an idea to start building your first project
            </p>
            <Button onClick={() => navigate("/ideas")}>
              View Your Ideas
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="glass-panel p-6 cursor-pointer hover:scale-105 transition-transform"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <Badge className="bg-primary/20">
                    Phase {project.current_phase}/10
                  </Badge>
                  <Rocket className="w-5 h-5 text-primary" />
                </div>
                
                <h3 className="text-xl font-semibold mb-4">{project.name}</h3>
                
                <div className="space-y-3 mb-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">{project.progress_percentage}%</span>
                    </div>
                    <Progress value={project.progress_percentage} className="h-2" />
                  </div>
                </div>

                <div className="flex gap-2">
                  {project.repository_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(project.repository_url!, "_blank");
                      }}
                    >
                      <GitBranch className="w-3 h-3 mr-1" />
                      Repo
                    </Button>
                  )}
                  {project.deployment_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(project.deployment_url!, "_blank");
                      }}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Live
                    </Button>
                  )}
                </div>

                <div className="text-xs text-muted-foreground mt-4">
                  Started {new Date(project.created_at).toLocaleDateString()}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;