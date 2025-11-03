import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, CheckCircle, XCircle, Play, 
  Pause, Eye, MessageSquare, AlertTriangle
} from "lucide-react";
import CodeGenerator from "@/components/CodeGenerator";

interface DevelopmentPrompt {
  id: string;
  sequence_number: number;
  title: string;
  description: string;
  prompt_text: string;
  status: string;
  execution_result: string;
}

const AIAssistedDev = () => {
  const { projectId } = useParams();
  const { toast } = useToast();
  const isAuthenticated = useAuthGuard();
  
  const [prompts, setPrompts] = useState<DevelopmentPrompt[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [executing, setExecuting] = useState(false);
  const [paused, setPaused] = useState(true);
  const [userFeedback, setUserFeedback] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (isAuthenticated && projectId) {
      fetchPrompts();
    }
  }, [isAuthenticated, projectId]);

  const fetchPrompts = async () => {
    const { data } = await supabase
      .from('development_prompts')
      .select('*')
      .eq('project_id', projectId)
      .order('sequence_number');

    if (data) {
      setPrompts(data);
      // Find first non-completed prompt
      const nextIndex = data.findIndex(p => p.status !== 'completed');
      setCurrentIndex(nextIndex >= 0 ? nextIndex : 0);
    }
  };

  const currentPrompt = prompts[currentIndex];
  const completedCount = prompts.filter(p => p.status === 'completed').length;
  const progress = (completedCount / prompts.length) * 100;

  const executeCurrentPrompt = async () => {
    if (!currentPrompt) return;
    
    setExecuting(true);
    try {
      // Update status to executing
      await supabase
        .from('development_prompts')
        .update({ status: 'executing' })
        .eq('id', currentPrompt.id);

      // Execute via generate-code function
      const { data, error } = await supabase.functions.invoke('generate-code', {
        body: { 
          prompt: currentPrompt.prompt_text,
          context: `Project: ${projectId}, Step ${currentPrompt.sequence_number}: ${currentPrompt.title}`
        }
      });

      if (error) throw error;

      // Save execution result
      await supabase
        .from('development_prompts')
        .update({ 
          status: 'completed',
          execution_result: data.generatedCode || data.generatedText,
          executed_at: new Date().toISOString()
        })
        .eq('id', currentPrompt.id);

      // Record execution
      await supabase
        .from('prompt_executions')
        .insert({
          prompt_id: currentPrompt.id,
          project_id: projectId,
          execution_order: currentIndex + 1,
          generated_code: data.generatedCode || data.generatedText,
          user_approved: false,
          tokens_used: 5000 // Estimate
        });

      toast({
        title: "Prompt Executed",
        description: `Step ${currentPrompt.sequence_number} completed successfully`,
      });

      fetchPrompts();
      setShowPreview(true);
    } catch (error) {
      await supabase
        .from('development_prompts')
        .update({ status: 'failed' })
        .eq('id', currentPrompt.id);

      toast({
        title: "Execution Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setExecuting(false);
    }
  };

  const approveAndContinue = async () => {
    if (!currentPrompt) return;

    await supabase
      .from('prompt_executions')
      .update({ 
        user_approved: true,
        user_feedback: userFeedback 
      })
      .eq('prompt_id', currentPrompt.id)
      .order('created_at', { ascending: false })
      .limit(1);

    setUserFeedback("");
    setShowPreview(false);
    
    if (currentIndex < prompts.length - 1) {
      setCurrentIndex(currentIndex + 1);
      if (!paused) {
        setTimeout(() => executeCurrentPrompt(), 1000);
      }
    } else {
      toast({
        title: "Development Complete!",
        description: "All prompts have been executed successfully",
      });
    }
  };

  const skipPrompt = () => {
    if (currentIndex < prompts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <div className="min-h-screen cosmic-bg">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">AI-Assisted Development</h1>
          <p className="text-muted-foreground">Phase 7: Sequential prompt execution with review</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="glass-panel p-6">
            <div className="text-sm text-muted-foreground mb-1">Progress</div>
            <div className="text-3xl font-bold gradient-text mb-2">
              {completedCount} / {prompts.length}
            </div>
            <Progress value={progress} className="h-2" />
          </Card>

          <Card className="glass-panel p-6">
            <div className="text-sm text-muted-foreground mb-1">Current Step</div>
            <div className="text-3xl font-bold gradient-text">
              #{currentPrompt?.sequence_number || '-'}
            </div>
            {currentPrompt && (
              <Badge className={currentPrompt.status === 'executing' ? 'bg-primary/20' : 'bg-green-500/20'}>
                {currentPrompt.status}
              </Badge>
            )}
          </Card>

          <Card className="glass-panel p-6">
            <div className="text-sm text-muted-foreground mb-1">Mode</div>
            <div className="text-2xl font-bold gradient-text mb-2">
              {paused ? 'Manual' : 'Auto'}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setPaused(!paused)}
            >
              {paused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
              {paused ? 'Start Auto' : 'Pause'}
            </Button>
          </Card>
        </div>

        {currentPrompt && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Card className="glass-panel p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4">{currentPrompt.title}</h3>
                <p className="text-muted-foreground mb-4">{currentPrompt.description}</p>
                
                <div className="bg-background/50 p-4 rounded border border-muted mb-4">
                  <div className="text-xs text-muted-foreground mb-2">Prompt to Execute:</div>
                  <pre className="text-sm whitespace-pre-wrap">{currentPrompt.prompt_text}</pre>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={executeCurrentPrompt} 
                    disabled={executing || currentPrompt.status === 'completed'}
                    className="flex-1"
                  >
                    {executing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Execute Step
                  </Button>
                  <Button variant="outline" onClick={skipPrompt}>
                    Skip
                  </Button>
                </div>
              </Card>

              {showPreview && (
                <Card className="glass-panel p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    <h4 className="font-semibold">Review Required</h4>
                  </div>
                  
                  <Textarea 
                    placeholder="Add feedback or notes (optional)..."
                    value={userFeedback}
                    onChange={(e) => setUserFeedback(e.target.value)}
                    className="mb-4"
                  />

                  <div className="flex gap-3">
                    <Button onClick={approveAndContinue} className="flex-1">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve & Continue
                    </Button>
                    <Button variant="outline">
                      <XCircle className="w-4 h-4 mr-2" />
                      Request Changes
                    </Button>
                  </div>
                </Card>
              )}
            </div>

            <div>
              <Card className="glass-panel p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Live Preview</h4>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Open Full
                  </Button>
                </div>
                <div className="bg-background/30 rounded border border-muted aspect-video flex items-center justify-center">
                  <div className="text-muted-foreground text-sm">Preview will appear here</div>
                </div>
              </Card>

              <Card className="glass-panel p-6 mt-6">
                <h4 className="font-semibold mb-4">Execution Log</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {prompts.slice(0, currentIndex + 1).map((p, i) => (
                    <div key={p.id} className="flex items-center gap-2 text-sm">
                      {p.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : p.status === 'executing' ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      ) : (
                        <XCircle className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="text-muted-foreground">#{p.sequence_number}</span>
                      <span>{p.title}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistedDev;