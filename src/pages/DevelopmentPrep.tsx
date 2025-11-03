import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import UniversalAIChat from "@/components/shared/UniversalAIChat";
import { 
  Loader2, CheckCircle, Clock, Rocket, 
  Code, Database, Plug, TestTube, Upload,
  ChevronRight, Edit2
} from "lucide-react";

interface DevelopmentPrompt {
  id: string;
  sequence_number: number;
  title: string;
  description: string;
  prompt_text: string;
  category: string;
  dependencies: string[];
  estimated_tokens: number;
  status: string;
}

const DevelopmentPrep = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAuthenticated = useAuthGuard();
  
  const [prompts, setPrompts] = useState<DevelopmentPrompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [totalTokens, setTotalTokens] = useState(0);

  useEffect(() => {
    if (isAuthenticated && projectId) {
      fetchProject();
      fetchPrompts();
    }
  }, [isAuthenticated, projectId]);

  const fetchProject = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single();

    if (data) setProjectName(data.name);
  };

  const fetchPrompts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('development_prompts')
      .select('*')
      .eq('project_id', projectId)
      .order('sequence_number');

    if (data) {
      setPrompts(data);
      setTotalTokens(data.reduce((sum, p) => sum + p.estimated_tokens, 0));
    }
    setLoading(false);
  };

  const generatePrompts = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-development-prompts', {
        body: { 
          projectId,
          templateData: {}, // Fetch from project
          prdData: {},      // Fetch from project
          features: []      // Fetch from project
        }
      });

      if (error) throw error;

      toast({
        title: "Prompts Generated",
        description: `${data.totalPrompts} development prompts created (${data.totalTokens.toLocaleString()} tokens)`,
      });

      fetchPrompts();
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const startDevelopment = () => {
    navigate(`/projects/${projectId}/ai-development`);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'setup': return <Database className="w-4 h-4" />;
      case 'feature': return <Code className="w-4 h-4" />;
      case 'integration': return <Plug className="w-4 h-4" />;
      case 'testing': return <TestTube className="w-4 h-4" />;
      case 'deployment': return <Upload className="w-4 h-4" />;
      default: return <Code className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'setup': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'feature': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'integration': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'testing': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'deployment': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const groupedPrompts = prompts.reduce((acc, prompt) => {
    if (!acc[prompt.category]) acc[prompt.category] = [];
    acc[prompt.category].push(prompt);
    return acc;
  }, {} as Record<string, DevelopmentPrompt[]>);

  return (
    <div className="min-h-screen cosmic-bg">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Rocket className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold gradient-text">Development Preparation</h1>
          </div>
          <p className="text-muted-foreground">
            Phase 6: Generate and review all development prompts
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Project: {projectName}
          </p>
        </div>

        {prompts.length === 0 && !loading && (
          <Card className="glass-panel p-8 text-center">
            <Clock className="w-16 h-16 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Ready to Generate Prompts</h3>
            <p className="text-muted-foreground mb-6">
              We'll analyze your PRD, selected template, and features to generate a complete sequence of development prompts.
            </p>
            <Button 
              onClick={generatePrompts} 
              disabled={generating}
              size="lg"
            >
              {generating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Generate Development Plan
            </Button>
          </Card>
        )}

        {prompts.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="glass-panel p-6">
                <div className="text-sm text-muted-foreground mb-1">Total Prompts</div>
                <div className="text-3xl font-bold gradient-text">{prompts.length}</div>
              </Card>
              <Card className="glass-panel p-6">
                <div className="text-sm text-muted-foreground mb-1">Estimated Tokens</div>
                <div className="text-3xl font-bold gradient-text">{totalTokens.toLocaleString()}</div>
              </Card>
              <Card className="glass-panel p-6">
                <div className="text-sm text-muted-foreground mb-1">Categories</div>
                <div className="text-3xl font-bold gradient-text">{Object.keys(groupedPrompts).length}</div>
              </Card>
            </div>

            <div className="space-y-6 mb-8">
              {Object.entries(groupedPrompts).map(([category, categoryPrompts]) => (
                <div key={category}>
                  <div className="flex items-center gap-3 mb-4">
                    {getCategoryIcon(category)}
                    <h3 className="text-xl font-semibold capitalize">{category}</h3>
                    <Badge className={getCategoryColor(category)}>
                      {categoryPrompts.length} prompts
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {categoryPrompts.map((prompt) => (
                      <Card key={prompt.id} className="glass-panel p-4 hover:border-primary/50 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                            {prompt.sequence_number}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{prompt.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{prompt.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>~{prompt.estimated_tokens.toLocaleString()} tokens</span>
                              {prompt.dependencies.length > 0 && (
                                <span>Depends on: #{prompt.dependencies.join(', #')}</span>
                              )}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <Button onClick={startDevelopment} size="lg" className="gap-2">
                Start AI Development
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            </div>

            <div className="lg:col-span-1">
              <UniversalAIChat
                context={{
                  type: "project",
                  id: projectId,
                  phase: 6,
                }}
                systemPrompt={`You are a technical planning assistant helping refine development prompts for "${projectName}".

The user has generated ${prompts.length} development prompts and is reviewing them before AI execution.

Help them:
1. Refine and improve prompt clarity
2. Add missing technical details
3. Suggest better sequencing
4. Identify dependencies between prompts
5. Estimate token usage more accurately

Be specific and actionable.`}
                suggestedQuestions={[
                  "Review prompt #3 and suggest improvements",
                  "What dependencies should I add to the authentication prompts?",
                  "How can I optimize the prompt sequence?",
                  "Estimate total development time"
                ]}
                className="sticky top-4 h-[600px]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DevelopmentPrep;
