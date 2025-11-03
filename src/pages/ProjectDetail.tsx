import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import Navbar from "@/components/Navbar";
import { Rocket, CheckCircle, Clock, AlertCircle, ExternalLink, GitBranch } from "lucide-react";

interface Project {
  id: string;
  name: string;
  current_phase: number;
  progress_percentage: number;
  repository_url: string | null;
  deployment_url: string | null;
  created_at: string;
}

interface Phase {
  id: string;
  phase_number: number;
  phase_name: string;
  status: string;
  consensus_reached: boolean;
  tokens_spent: number;
  started_at: string | null;
  completed_at: string | null;
}

const phaseNames = [
  "Idea Capture & Screening",
  "Validation & Research",
  "Product Definition",
  "Technical Planning",
  "Design & Prototype",
  "Development Preparation",
  "AI-Assisted Development",
  "Launch Preparation",
  "Deployment & Go-Live",
  "Post-Launch Operations",
];

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAuthenticated = useAuthGuard();
  const [project, setProject] = useState<Project | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjectData();
    }
  }, [id, isAuthenticated]);

  const fetchProjectData = async () => {
    try {
      const [projectRes, phasesRes] = await Promise.all([
        supabase.from("projects").select("*").eq("id", id).single(),
        supabase.from("phases").select("*").eq("project_id", id).order("phase_number"),
      ]);

      if (projectRes.error) throw projectRes.error;
      if (phasesRes.error) throw phasesRes.error;

      setProject(projectRes.data);
      setPhases(phasesRes.data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading project",
        description: error.message,
      });
      navigate("/projects");
    } finally {
      setLoading(false);
    }
  };

  const getPhaseIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "in_progress": return <Clock className="w-5 h-5 text-primary animate-pulse" />;
      case "failed": return <AlertCircle className="w-5 h-5 text-red-400" />;
      default: return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getPhaseStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/20 text-green-400";
      case "in_progress": return "bg-primary/20";
      case "failed": return "bg-red-500/20 text-red-400";
      default: return "bg-muted";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen cosmic-bg">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="min-h-screen cosmic-bg">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Rocket className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold gradient-text">{project.name}</h1>
          </div>
          <p className="text-muted-foreground">
            Started {new Date(project.created_at).toLocaleDateString()}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-panel p-6">
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text mb-2">
                Phase {project.current_phase}/10
              </div>
              <p className="text-sm text-muted-foreground">Current Progress</p>
            </div>
          </Card>

          <Card className="glass-panel p-6">
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text mb-2">
                {project.progress_percentage}%
              </div>
              <p className="text-sm text-muted-foreground">Overall Progress</p>
              <Progress value={project.progress_percentage} className="h-2 mt-2" />
            </div>
          </Card>

          <Card className="glass-panel p-6">
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text mb-2">
                {phases.filter(p => p.status === "completed").length}
              </div>
              <p className="text-sm text-muted-foreground">Phases Completed</p>
            </div>
          </Card>
        </div>

        {(project.repository_url || project.deployment_url) && (
          <Card className="glass-panel p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Project Links</h2>
            <div className="flex gap-4">
              {project.repository_url && (
                <Button
                  variant="outline"
                  onClick={() => window.open(project.repository_url!, "_blank")}
                >
                  <GitBranch className="w-4 h-4 mr-2" />
                  Repository
                  <ExternalLink className="w-3 h-3 ml-2" />
                </Button>
              )}
              {project.deployment_url && (
                <Button
                  variant="outline"
                  onClick={() => window.open(project.deployment_url!, "_blank")}
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  Live Demo
                  <ExternalLink className="w-3 h-3 ml-2" />
                </Button>
              )}
            </div>
          </Card>
        )}

        <Card className="glass-panel p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => navigate(`/projects/${id}/template-selection`)}
              className="h-auto py-4 flex-col gap-2"
            >
              <Rocket className="w-6 h-6" />
              <span>Select Template</span>
              <span className="text-xs text-muted-foreground">Phase 5: Design & Prototype</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/projects/${id}/development-prep`)}
              className="h-auto py-4 flex-col gap-2"
            >
              <CheckCircle className="w-6 h-6" />
              <span>Development Prep</span>
              <span className="text-xs text-muted-foreground">Phase 6: Generate Prompts</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/projects/${id}/ai-development`)}
              className="h-auto py-4 flex-col gap-2"
            >
              <GitBranch className="w-6 h-6" />
              <span>AI Development</span>
              <span className="text-xs text-muted-foreground">Phase 7: Execute & Review</span>
            </Button>
          </div>
        </Card>

        <Card className="glass-panel p-6">
          <h2 className="text-2xl font-semibold mb-6">Development Phases</h2>
          <div className="space-y-4">
            {phases.map((phase, index) => (
              <div
                key={phase.id}
                className={`p-6 rounded-lg border transition-all ${
                  phase.status === "in_progress"
                    ? "border-primary bg-primary/5"
                    : "border-muted bg-background/50"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getPhaseIcon(phase.status)}
                    <div>
                      <h3 className="font-semibold">
                        Phase {phase.phase_number}: {phaseNames[index] || phase.phase_name}
                      </h3>
                      {phase.started_at && (
                        <p className="text-xs text-muted-foreground">
                          Started {new Date(phase.started_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPhaseStatusColor(phase.status)}>
                      {phase.status.replace("_", " ")}
                    </Badge>
                    {phase.consensus_reached && (
                      <Badge className="bg-green-500/20 text-green-400">
                        Consensus ✓
                      </Badge>
                    )}
                  </div>
                </div>

                {phase.status === "completed" && phase.completed_at && (
                  <div className="text-sm text-muted-foreground">
                    Completed {new Date(phase.completed_at).toLocaleDateString()} • 
                    {" "}{phase.tokens_spent} tokens used
                  </div>
                )}

                {phase.status === "in_progress" && (
                  <div className="mt-4">
                    <Progress value={45} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      AI agents are working on this phase...
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass-panel p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Phase Actions</h2>
          <p className="text-sm text-muted-foreground mb-4">
            The AI consensus system will guide each development phase with validation from Claude, Gemini, and Codex.
          </p>
          <div className="flex gap-4">
            <Button
              onClick={() => navigate(`/projects/${id}/product-definition`)}
            >
              Define Product (Phase 3)
            </Button>
            <Button
              onClick={() => {
                toast({
                  title: "Phase System Active",
                  description: "Multi-agent validation is ready. Start your next phase when ready.",
                });
              }}
              variant="outline"
            >
              Start Next Phase
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/projects`)}
            >
              Back to Projects
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProjectDetail;