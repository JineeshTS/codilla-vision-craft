import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import Navbar from "@/components/Navbar";
import { ThreeAIIndicator } from "@/components/ThreeAIIndicator";
import { ArrowLeft, Send } from "lucide-react";

const PhaseDetail = () => {
  const { projectId, phaseNumber } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [userInput, setUserInput] = useState("");
  const [aiAgents, setAiAgents] = useState<any[]>([
    { name: "Claude", specialty: "Analysis & Strategy", status: "idle" },
    { name: "Gemini", specialty: "Review & Validation", status: "idle" },
    { name: "Codex", specialty: "Technical Assessment", status: "idle" }
  ]);
  const [consensus, setConsensus] = useState<any>(null);

  useAuthGuard();

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          idea:ideas(*)
        `)
        .eq("id", projectId)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
      navigate("/projects");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!userInput.trim()) {
      toast({
        variant: "destructive",
        title: "Input required",
        description: "Please provide your submission"
      });
      return;
    }

    setSubmitting(true);
    
    // Update AI agents to processing
    setAiAgents(agents => agents.map(a => ({ ...a, status: "processing" })));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-consensus`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            phase: phaseNumber,
            ideaId: project.idea.id,
            userInput,
            context: project.idea.description
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get consensus");
      }

      const result = await response.json();
      
      // Update AI agents with results
      setAiAgents(result.validations.map((v: any) => ({
        name: v.agent,
        specialty: v.specialty,
        status: v.error ? "failed" : "completed",
        score: v.score,
        feedback: v.feedback
      })));

      setConsensus(result);

      toast({
        title: "Analysis complete!",
        description: `Consensus score: ${result.avgScore}/10`
      });

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
      setAiAgents(agents => agents.map(a => ({ ...a, status: "failed" })));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen cosmic-bg">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cosmic-bg">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button
          variant="ghost"
          onClick={() => navigate(`/projects/${projectId}`)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Project
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">
            Phase {phaseNumber}: {project?.idea?.title}
          </h1>
          <p className="text-muted-foreground">
            Submit your work for AI consensus review
          </p>
        </div>

        <div className="grid gap-6">
          <Card className="glass-panel p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="submission">Your Submission</Label>
                <Textarea
                  id="submission"
                  placeholder="Describe what you've completed for this phase..."
                  rows={8}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <Button 
                onClick={handleSubmit} 
                disabled={submitting || !userInput.trim()}
                className="w-full"
              >
                {submitting ? "Analyzing..." : "Submit for AI Review"}
                <Send className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>

          <ThreeAIIndicator
            agents={aiAgents}
            avgScore={consensus?.avgScore}
            consensus={consensus?.consensus}
          />

          {consensus && consensus.validations.map((validation: any, idx: number) => (
            <Card key={idx} className="glass-panel p-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                {validation.agent} Analysis
                <span className="text-sm text-muted-foreground">({validation.specialty})</span>
              </h3>
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <pre className="whitespace-pre-wrap font-sans">{validation.feedback}</pre>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PhaseDetail;
