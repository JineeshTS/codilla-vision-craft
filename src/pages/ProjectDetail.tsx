import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import Navbar from "@/components/Navbar";
import { Rocket, CheckCircle, Clock, AlertCircle, ExternalLink, GitBranch, Send, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

// Aligned with Codilla.ai 10-Phase Framework
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
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [phaseInput, setPhaseInput] = useState("");
  const [validating, setValidating] = useState(false);

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

  const handleStartPhase = (phase: Phase) => {
    if (phase.status === "completed") {
      toast({
        title: "Phase Already Completed",
        description: "This phase has already been validated with consensus.",
      });
      return;
    }

    setSelectedPhase(phase);
    setPhaseInput("");
    setSubmissionDialogOpen(true);
  };

  const handleSubmitPhase = async () => {
    if (!selectedPhase || !phaseInput.trim()) {
      toast({
        variant: "destructive",
        title: "Input Required",
        description: "Please describe your phase deliverables.",
      });
      return;
    }

    if (phaseInput.trim().length < 50) {
      toast({
        variant: "destructive",
        title: "Too Short",
        description: "Please provide at least 50 characters describing your work.",
      });
      return;
    }

    setValidating(true);

    try {
      // Mark phase as in_progress
      await supabase
        .from("phases")
        .update({ status: "in_progress", started_at: new Date().toISOString() })
        .eq("id", selectedPhase.id);

      // Call validate-phase edge function
      const { data, error } = await supabase.functions.invoke("validate-phase", {
        body: {
          phaseId: selectedPhase.id,
          userInput: phaseInput.trim(),
        },
      });

      if (error) throw error;

      // Refresh project data to show updated phase status
      await fetchProjectData();

      setSubmissionDialogOpen(false);
      setPhaseInput("");

      if (data?.consensusReached) {
        toast({
          title: "Consensus Reached! 🎉",
          description: `Phase ${selectedPhase.phase_number} has been validated successfully. Average score: ${data.avgScore}/100`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Consensus Not Reached",
          description: `Phase validation did not reach consensus. Average score: ${data.avgScore}/100. Please review AI feedback and try again.`,
        });
      }
    } catch (error: any) {
      console.error("Phase validation error:", error);
      toast({
        variant: "destructive",
        title: "Validation Failed",
        description: error.message || "Failed to validate phase. Please try again.",
      });
    } finally {
      setValidating(false);
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

                {/* Phase Action Buttons */}
                <div className="mt-4 flex justify-end">
                  {phase.status === "pending" && (
                    <Button
                      size="sm"
                      onClick={() => handleStartPhase(phase)}
                      disabled={phase.phase_number !== project.current_phase}
                    >
                      {phase.phase_number === project.current_phase ? "Start Phase" : "Locked"}
                    </Button>
                  )}
                  {phase.status === "in_progress" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStartPhase(phase)}
                    >
                      Submit Deliverable
                    </Button>
                  )}
                  {phase.status === "completed" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        // TODO: Show phase validation details modal
                        toast({
                          title: "Phase Complete",
                          description: `This phase reached consensus and was completed successfully.`,
                        });
                      }}
                    >
                      View Details
                    </Button>
                  )}
                  {phase.status === "failed" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleStartPhase(phase)}
                    >
                      Retry Phase
                    </Button>
                  )}
                </div>
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
              onClick={() => {
                const currentPhase = phases.find(p => p.phase_number === project.current_phase);
                if (currentPhase) {
                  handleStartPhase(currentPhase);
                } else {
                  toast({
                    variant: "destructive",
                    title: "Phase Not Found",
                    description: "Unable to find the current phase. Please refresh the page.",
                  });
                }
              }}
              disabled={project.current_phase > 10}
            >
              {project.current_phase > 10 ? "All Phases Complete" : "Start Next Phase"}
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

      {/* Phase Submission Dialog */}
      <Dialog open={submissionDialogOpen} onOpenChange={setSubmissionDialogOpen}>
        <DialogContent className="glass-panel max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Submit Phase {selectedPhase?.phase_number}: {selectedPhase ? phaseNames[selectedPhase.phase_number - 1] : ""}
            </DialogTitle>
            <DialogDescription>
              Describe your deliverables for this phase. The AI consensus system will evaluate your submission
              using Claude, Gemini, and Codex. Minimum 50 characters required.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div>
              <Label htmlFor="phase-input">Phase Deliverables</Label>
              <Textarea
                id="phase-input"
                placeholder="Describe what you've accomplished in this phase...

Examples:
- For Phase 1 (Idea Capture): Describe your idea, problem statement, target audience, and value proposition
- For Phase 2 (Validation): Share market research findings, competitor analysis, and user feedback
- For Phase 3 (Product Definition): Detail features, user stories, MVP scope, and success metrics
- For Phase 4 (Technical Planning): Describe architecture, tech stack, database schema, and API design
- For Phase 7 (Development): Share code repository link, implemented features, and functionality demos
- For Phase 9 (Deployment): Provide production URL, deployment logs, and monitoring setup details"
                value={phaseInput}
                onChange={(e) => setPhaseInput(e.target.value)}
                rows={12}
                className="resize-none"
                disabled={validating}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {phaseInput.length} / 50 characters minimum
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSubmissionDialogOpen(false);
                setPhaseInput("");
              }}
              disabled={validating}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitPhase} disabled={validating || phaseInput.trim().length < 50}>
              {validating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validating with AI...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit for Validation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectDetail;