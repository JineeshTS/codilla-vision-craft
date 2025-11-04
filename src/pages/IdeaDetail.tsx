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
import { useAuthGuard } from "@/hooks/useAuthGuard";
import Navbar from "@/components/Navbar";
import { Lightbulb, Sparkles, Rocket, Edit, Save, X, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { PhaseWorkflow } from "@/components/phases/PhaseWorkflow";
import { ThreeAIIndicator } from "@/components/ThreeAIIndicator";
import { RequirementsChat } from "@/components/phases/RequirementsChat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  category: string | null;
  business_model: string | null;
  audience_size: string | null;
  inspiration_source: string | null;
  screening_score: number | null;
  decision_status: string | null;
  current_phase: number | null;
  business_models?: {
    swot?: {
      strengths: string[];
      weaknesses: string[];
      opportunities: string[];
      threats: string[];
    };
    portersFiveForces?: {
      threatOfNewEntrants: string;
      bargainingPowerOfSuppliers: string;
      bargainingPowerOfBuyers: string;
      threatOfSubstitutes: string;
      competitiveRivalry: string;
    };
    blueOcean?: {
      eliminate: string[];
      reduce: string[];
      raise: string[];
      create: string[];
    };
    leanCanvas?: {
      problem: string[];
      solution: string[];
      keyMetrics: string[];
      uniqueValueProposition: string;
      unfairAdvantage: string;
      channels: string[];
      customerSegments: string[];
      costStructure: string[];
      revenueStreams: string[];
    };
    riskAssessment?: {
      high: string[];
      medium: string[];
      low: string[];
    };
  };
}

const IdeaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAuthenticated = useAuthGuard();
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
    if (isAuthenticated) {
      fetchIdea();
    }
  }, [id, isAuthenticated]);

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
          description: `Consensus Score: ${data.avgScore}%. Your idea is ready for development!`,
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
      const correctPhaseNames = [
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

      const phases = Array.from({ length: 10 }, (_, i) => ({
        project_id: project.id,
        phase_number: i + 1,
        phase_name: correctPhaseNames[i],
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
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="discussion">
                  AI Discussion
                  {idea.current_phase === 1 && (
                    <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                      Active
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="workflow">Workflow</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card className="glass-panel p-8 mb-6">
                  <h2 className="text-xl font-semibold mb-4">Description</h2>
                  <p className="text-muted-foreground mb-6">{idea.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-4">
                      {idea.category && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Category</h3>
                          <Badge variant="outline">{idea.category}</Badge>
                        </div>
                      )}
                      {idea.business_model && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Business Model</h3>
                          <p className="text-foreground text-sm">{idea.business_model}</p>
                        </div>
                      )}
                      {idea.audience_size && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Target Audience Size</h3>
                          <p className="text-foreground text-sm">{idea.audience_size}</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      {idea.screening_score !== null && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Screening Score</h3>
                          <div className="flex items-center gap-2">
                            <Progress value={idea.screening_score * 10} className="flex-1" />
                            <span className="text-sm font-bold">{idea.screening_score}/10</span>
                          </div>
                        </div>
                      )}
                      {idea.decision_status && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Decision Status</h3>
                          <Badge
                            variant={
                              idea.decision_status === "go"
                                ? "default"
                                : idea.decision_status === "conditional"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {idea.decision_status}
                          </Badge>
                        </div>
                      )}
                      {idea.inspiration_source && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Inspiration Source</h3>
                          <p className="text-foreground text-sm">{idea.inspiration_source}</p>
                        </div>
                      )}
                    </div>
                  </div>

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
              </TabsContent>

              <TabsContent value="discussion">
                {idea.current_phase === 1 ? (
                  <RequirementsChat ideaId={idea.id} ideaTitle={idea.title} />
                ) : (
                  <Card className="glass-panel p-8 text-center">
                    <p className="text-muted-foreground">
                      AI discussion is only available during Phase 1: Idea Capture & Screening
                    </p>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="workflow">
                <PhaseWorkflow currentPhase={idea.current_phase || 1} />
              </TabsContent>
            </Tabs>

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

                  <div className="flex justify-center gap-4 mb-6">
                    <Button
                      onClick={() => navigate(`/ideas/${id}/business-validation`)}
                      className="glow-on-hover"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Start Business Validation
                    </Button>
                    <Button onClick={handleCreateProject} variant="outline">
                      <Rocket className="w-4 h-4 mr-2" />
                      Create Project
                    </Button>
                  </div>

                  <div className="space-y-6 mt-8">
                    <h3 className="text-xl font-bold mb-4">🤖 AI Agent Research & Analysis</h3>
                    {idea.validation_summary.validations?.map((validation: any, idx: number) => (
                      <Card key={idx} className="p-6 space-y-4 border-2">
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-bold capitalize text-2xl">
                            {validation.agent === 'claude' && '🔵'} 
                            {validation.agent === 'gemini' && '🟢'} 
                            {validation.agent === 'codex' && '🟣'} 
                            {validation.agent} AI
                          </span>
                          <Badge variant={validation.approved ? "default" : "secondary"} className="text-lg px-4 py-2">
                            Score: {validation.score}%
                          </Badge>
                        </div>
                        
                        {validation.researchProcess && (
                          <div className="border-l-4 border-primary pl-4 py-3 bg-primary/5 rounded-r">
                            <p className="text-sm font-bold text-primary mb-2">📊 Research Methodology:</p>
                            <p className="text-sm whitespace-pre-line">{validation.researchProcess}</p>
                          </div>
                        )}
                        
                        {validation.marketAnalysis && (
                          <div className="bg-muted/30 p-4 rounded">
                            <p className="text-sm font-bold mb-2">🎯 Market Analysis:</p>
                            <p className="text-sm whitespace-pre-line">{validation.marketAnalysis}</p>
                          </div>
                        )}
                        
                        {validation.competitorInsights && (
                          <div className="bg-muted/30 p-4 rounded">
                            <p className="text-sm font-bold mb-2">⚔️ Competitor Insights:</p>
                            <p className="text-sm whitespace-pre-line">{validation.competitorInsights}</p>
                          </div>
                        )}
                        
                        <div className="bg-muted/20 p-4 rounded">
                          <p className="text-sm font-bold mb-2">💬 Overall Feedback:</p>
                          <p className="text-sm whitespace-pre-line">{validation.feedback}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          {validation.strengths?.length > 0 && (
                            <div className="bg-success/10 p-3 rounded">
                              <p className="text-sm font-bold text-success mb-2">✓ Strengths:</p>
                              <ul className="text-sm list-disc list-inside space-y-1">
                                {validation.strengths.map((s: string, i: number) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {validation.concerns?.length > 0 && (
                            <div className="bg-destructive/10 p-3 rounded">
                              <p className="text-sm font-bold text-destructive mb-2">⚠ Concerns:</p>
                              <ul className="text-sm list-disc list-inside space-y-1">
                                {validation.concerns.map((c: string, i: number) => (
                                  <li key={i}>{c}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {validation.recommendations?.length > 0 && (
                            <div className="bg-primary/10 p-3 rounded">
                              <p className="text-sm font-bold text-primary mb-2">→ Recommendations:</p>
                              <ul className="text-sm list-disc list-inside space-y-1">
                                {validation.recommendations.map((r: string, i: number) => (
                                  <li key={i}>{r}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </Card>

                {/* Auto-populated Business Models */}
                {idea.business_models && (
                  <Card className="glass-panel p-8 mb-6">
                    <h3 className="text-2xl font-bold mb-4">📈 Auto-Generated Business Models</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      These models were automatically generated based on deep AI research and analysis
                    </p>

                    <div className="space-y-8">
                      {/* SWOT Analysis */}
                      {idea.business_models.swot && (
                        <div>
                          <h4 className="font-bold text-lg mb-4">SWOT Analysis</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="p-4 bg-success/10 border-success/30">
                              <p className="font-bold text-success mb-3 text-lg">💪 Strengths</p>
                              <ul className="text-sm space-y-2">
                                {idea.business_models.swot.strengths?.map((s: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="text-success">✓</span>
                                    <span>{s}</span>
                                  </li>
                                ))}
                              </ul>
                            </Card>
                            <Card className="p-4 bg-destructive/10 border-destructive/30">
                              <p className="font-bold text-destructive mb-3 text-lg">⚠️ Weaknesses</p>
                              <ul className="text-sm space-y-2">
                                {idea.business_models.swot.weaknesses?.map((w: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="text-destructive">×</span>
                                    <span>{w}</span>
                                  </li>
                                ))}
                              </ul>
                            </Card>
                            <Card className="p-4 bg-primary/10 border-primary/30">
                              <p className="font-bold text-primary mb-3 text-lg">🚀 Opportunities</p>
                              <ul className="text-sm space-y-2">
                                {idea.business_models.swot.opportunities?.map((o: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="text-primary">→</span>
                                    <span>{o}</span>
                                  </li>
                                ))}
                              </ul>
                            </Card>
                            <Card className="p-4 bg-warning/10 border-warning/30">
                              <p className="font-bold text-warning mb-3 text-lg">⚡ Threats</p>
                              <ul className="text-sm space-y-2">
                                {idea.business_models.swot.threats?.map((t: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="text-warning">!</span>
                                    <span>{t}</span>
                                  </li>
                                ))}
                              </ul>
                            </Card>
                          </div>
                        </div>
                      )}

                      {/* Porter's Five Forces */}
                      {idea.business_models.portersFiveForces && (
                        <div>
                          <h4 className="font-bold text-lg mb-4">Porter's Five Forces</h4>
                          <div className="space-y-3">
                            {Object.entries(idea.business_models.portersFiveForces).map(([key, value]) => (
                              <Card key={key} className="p-4 bg-muted/30">
                                <p className="font-bold text-sm mb-2 capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </p>
                                <p className="text-sm">{value as string}</p>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Lean Canvas */}
                      {idea.business_models.leanCanvas && (
                        <div>
                          <h4 className="font-bold text-lg mb-4">Lean Canvas</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {Object.entries(idea.business_models.leanCanvas).map(([key, value]) => (
                              <Card key={key} className="p-4 bg-muted/20">
                                <p className="font-bold text-sm mb-3 capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </p>
                                {Array.isArray(value) ? (
                                  <ul className="text-sm space-y-1">
                                    {value.map((item, i) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <span>•</span>
                                        <span>{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-sm">{value as string}</p>
                                )}
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Risk Assessment */}
                      {idea.business_models.riskAssessment && (
                        <div>
                          <h4 className="font-bold text-lg mb-4">Risk Assessment</h4>
                          <div className="space-y-3">
                            {Object.entries(idea.business_models.riskAssessment).map(([level, risks]) => (
                              Array.isArray(risks) && risks.length > 0 && (
                                <Card key={level} className={`p-4 ${
                                  level === 'high' ? 'bg-destructive/10 border-destructive/30' :
                                  level === 'medium' ? 'bg-warning/10 border-warning/30' : 
                                  'bg-success/10 border-success/30'
                                }`}>
                                  <p className={`font-bold text-sm mb-3 capitalize ${
                                    level === 'high' ? 'text-destructive' :
                                    level === 'medium' ? 'text-warning' : 'text-success'
                                  }`}>
                                    {level === 'high' ? '🔴' : level === 'medium' ? '🟡' : '🟢'} {level} Risk
                                  </p>
                                  <ul className="text-sm space-y-2">
                                    {risks.map((risk: string, i: number) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <span>•</span>
                                        <span>{risk}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </Card>
                              )
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Blue Ocean Strategy */}
                      {idea.business_models.blueOcean && (
                        <div>
                          <h4 className="font-bold text-lg mb-4">Blue Ocean Strategy</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(idea.business_models.blueOcean).map(([key, factors]) => (
                              Array.isArray(factors) && factors.length > 0 && (
                                <Card key={key} className="p-4 bg-muted/20">
                                  <p className="font-bold text-sm mb-3 capitalize">{key}</p>
                                  <ul className="text-sm space-y-1">
                                    {factors.map((factor: string, i: number) => (
                                      <li key={i}>• {factor}</li>
                                    ))}
                                  </ul>
                                </Card>
                              )
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

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