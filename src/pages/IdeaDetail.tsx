import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Lightbulb, Sparkles, Rocket, Edit, Save, X, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Idea {
  id: string;
  title: string;
  description: string;
  problem_statement: string | null;
  target_audience: string | null;
  unique_value_proposition: string | null;
  status: string;
  consensus_score: number | null;
  validation_summary: any;
  tokens_spent: number;
  created_at: string;
}

const IdeaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [validating, setValidating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    problem_statement: "",
    target_audience: "",
    unique_value_proposition: "",
  });

  useEffect(() => {
    checkAuth();
    fetchIdea();
  }, [id]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchIdea = async () => {
    try {
      const { data, error } = await supabase
        .from("ideas")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setIdea(data);
      setFormData({
        title: data.title,
        description: data.description,
        problem_statement: data.problem_statement || "",
        target_audience: data.target_audience || "",
        unique_value_proposition: data.unique_value_proposition || "",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading idea",
        description: error.message,
      });
      navigate("/ideas");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from("ideas")
        .update(formData)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Saved!",
        description: "Your idea has been updated.",
      });
      setEditing(false);
      fetchIdea();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error saving",
        description: error.message,
      });
    }
  };

  const handleStartValidation = async () => {
    setValidating(true);
    try {
      // Update idea status to validating
      const { error: statusError } = await supabase
        .from("ideas")
        .update({ status: "validating" })
        .eq("id", id);

      if (statusError) throw statusError;

      toast({
        title: "Validation Started!",
        description: "AI agents Claude, Gemini, and Codex are analyzing your idea...",
      });

      // Call the validation edge function (auth header is automatically included)
      const { data, error } = await supabase.functions.invoke("validate-idea", {
        body: { ideaId: id },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Validation Complete!",
          description: `Consensus Score: ${data.consensus_score}%. Your idea is ready for development!`,
        });
        fetchIdea();
      } else {
        throw new Error("Validation failed");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: error.message || "Failed to validate idea. Please try again.",
      });
      
      // Reset status on error
      await supabase
        .from("ideas")
        .update({ status: "draft" })
        .eq("id", id);
      
      fetchIdea();
    } finally {
      setValidating(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          idea_id: id,
          user_id: user.id,
          name: idea?.title || "New Project",
          current_phase: 1,
          progress_percentage: 0,
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial phases
      const phases = Array.from({ length: 10 }, (_, i) => ({
        project_id: project.id,
        phase_number: i + 1,
        phase_name: `Phase ${i + 1}`,
        status: "pending" as const,
      }));

      await supabase.from("phases").insert(phases);

      toast({
        title: "Project Created!",
        description: "Your development journey begins now.",
      });

      navigate(`/projects/${project.id}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating project",
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen cosmic-bg">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!idea) return null;

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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Lightbulb className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-4xl font-bold gradient-text">{idea.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Created {new Date(idea.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(idea.status)}>
              {idea.status.replace("_", " ")}
            </Badge>
            {!editing && idea.status === "draft" && (
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>

        {editing ? (
          <Card className="glass-panel p-8 mb-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Problem Statement</Label>
                <Textarea
                  value={formData.problem_statement}
                  onChange={(e) => setFormData({ ...formData, problem_statement: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Textarea
                  value={formData.target_audience}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Unique Value Proposition</Label>
                <Textarea
                  value={formData.unique_value_proposition}
                  onChange={(e) => setFormData({ ...formData, unique_value_proposition: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <>
            <Card className="glass-panel p-8 mb-6">
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <p className="text-muted-foreground mb-6">{idea.description}</p>

              {idea.problem_statement && (
                <>
                  <h2 className="text-xl font-semibold mb-4">Problem Statement</h2>
                  <p className="text-muted-foreground mb-6">{idea.problem_statement}</p>
                </>
              )}

              {idea.target_audience && (
                <>
                  <h2 className="text-xl font-semibold mb-4">Target Audience</h2>
                  <p className="text-muted-foreground mb-6">{idea.target_audience}</p>
                </>
              )}

              {idea.unique_value_proposition && (
                <>
                  <h2 className="text-xl font-semibold mb-4">Unique Value Proposition</h2>
                  <p className="text-muted-foreground">{idea.unique_value_proposition}</p>
                </>
              )}
            </Card>

            {idea.status === "draft" && (
              <Card className="glass-panel p-8 mb-6">
                <div className="text-center">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary" />
                  <h2 className="text-2xl font-semibold mb-2">Ready for Validation?</h2>
                  <p className="text-muted-foreground mb-6">
                    Let our AI agents validate your idea through consensus-based analysis
                  </p>
                  <Button
                    onClick={handleStartValidation}
                    disabled={validating}
                    className="glow-on-hover"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    {validating ? "Validating..." : "Start AI Validation"}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">Cost: 150 tokens</p>
                </div>
              </Card>
            )}

            {idea.status === "validating" && (
              <Card className="glass-panel p-8 mb-6">
                <div className="text-center">
                  <div className="animate-spin w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold mb-2">Validation in Progress</h2>
                  <p className="text-muted-foreground mb-4">
                    AI agents are analyzing your idea...
                  </p>
                  <Progress value={60} className="h-2" />
                </div>
              </Card>
            )}

            {idea.status === "validated" && idea.validation_summary && (
              <>
                <Card className="glass-panel p-8 mb-6">
                  <div className="text-center mb-6">
                    <div className="text-6xl font-bold gradient-text mb-2">
                      {idea.consensus_score}%
                    </div>
                    <p className="text-muted-foreground">AI Consensus Score</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-ai-claude">
                        {idea.validation_summary.claude_score}%
                      </div>
                      <p className="text-sm text-muted-foreground">Claude</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-ai-gemini">
                        {idea.validation_summary.gemini_score}%
                      </div>
                      <p className="text-sm text-muted-foreground">Gemini</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-ai-codex">
                        {idea.validation_summary.codex_score}%
                      </div>
                      <p className="text-sm text-muted-foreground">Codex</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2 text-green-400">Strengths</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {idea.validation_summary.strengths?.map((s: string, i: number) => (
                          <li key={i} className="text-muted-foreground">{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2 text-yellow-400">Concerns</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {idea.validation_summary.concerns?.map((c: string, i: number) => (
                          <li key={i} className="text-muted-foreground">{c}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2 text-primary">Recommendations</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {idea.validation_summary.recommendations?.map((r: string, i: number) => (
                          <li key={i} className="text-muted-foreground">{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>

                <Card className="glass-panel p-8">
                  <div className="text-center">
                    <Rocket className="w-16 h-16 mx-auto mb-4 text-primary" />
                    <h2 className="text-2xl font-semibold mb-2">Ready to Build?</h2>
                    <p className="text-muted-foreground mb-6">
                      Create a project and start the 10-phase development process
                    </p>
                    <Button onClick={handleCreateProject} className="glow-on-hover">
                      <Rocket className="w-4 h-4 mr-2" />
                      Create Project
                    </Button>
                  </div>
                </Card>
              </>
            )}
          </>
        )}

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Tokens spent: {idea.tokens_spent}
          </p>
        </div>
      </div>
    </div>
  );
};

export default IdeaDetail;