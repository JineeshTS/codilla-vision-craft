import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import Navbar from "@/components/Navbar";
import { PhaseTaskChat } from "@/components/phases/PhaseTaskChat";
import { getPhaseStructure, PhaseTask } from "@/config/phaseStructure";
import { ArrowLeft, CheckCircle2, Circle, Lock } from "lucide-react";

interface PhaseProgress {
  stages: { taskId: string; completed: boolean; completedAt: string | null }[];
}

const PhaseDetail = () => {
  const { projectId, phaseNumber } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAuthenticated = useAuthGuard();
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<PhaseTask | null>(null);
  const [phaseProgress, setPhaseProgress] = useState<PhaseProgress>({ stages: [] });
  
  const phaseNum = parseInt(phaseNumber || "1");
  const phaseStructure = getPhaseStructure(phaseNum);

  useEffect(() => {
    if (isAuthenticated && projectId) {
      fetchPhaseProgress();
    }
  }, [projectId, phaseNumber, isAuthenticated]);

  const fetchPhaseProgress = async () => {
    try {
      const { data, error } = await supabase
        .from("phase_progress")
        .select("stages")
        .eq("project_id", projectId)
        .eq("phase_number", phaseNum)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data?.stages) {
        setPhaseProgress({ stages: data.stages as any[] });
      } else {
        // Initialize phase progress if not exists
        const { error: insertError } = await supabase
          .from("phase_progress")
          .insert({
            project_id: projectId,
            phase_number: phaseNum,
            phase_name: phaseStructure?.phaseName || "",
            stages: phaseStructure?.tasks.map(t => ({ 
              taskId: t.id, 
              completed: false, 
              completedAt: null 
            })) || []
          });
        
        if (insertError) throw insertError;
        setPhaseProgress({ 
          stages: phaseStructure?.tasks.map(t => ({ 
            taskId: t.id, 
            completed: false, 
            completedAt: null 
          })) || [] 
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load phase progress",
      });
    } finally {
      setLoading(false);
    }
  };

  const isTaskCompleted = (taskId: string) => {
    return phaseProgress.stages.find(s => s.taskId === taskId)?.completed || false;
  };

  const getCompletedTasksCount = () => {
    return phaseProgress.stages.filter(s => s.completed).length;
  };

  const getProgressPercentage = () => {
    if (!phaseStructure) return 0;
    return Math.round((getCompletedTasksCount() / phaseStructure.tasks.length) * 100);
  };

  if (loading || !phaseStructure) {
    return (
      <div className="min-h-screen cosmic-bg">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Loading phase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cosmic-bg">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(`/projects/${projectId}`)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Project
        </Button>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">
                Phase {phaseStructure.phaseNumber}: {phaseStructure.phaseName}
              </h1>
              <p className="text-muted-foreground">{phaseStructure.description}</p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {phaseStructure.duration}
            </Badge>
          </div>
          
          <Card className="glass-panel p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Phase Progress</span>
              <span className="text-sm text-muted-foreground">
                {getCompletedTasksCount()} of {phaseStructure.tasks.length} tasks completed
              </span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Estimated: {phaseStructure.totalTokens} tokens • Decision Gate: {phaseStructure.decisionGate}
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-xl font-semibold mb-4">Tasks</h2>
            {phaseStructure.tasks.map((task, index) => {
              const completed = isTaskCompleted(task.id);
              const isSelected = selectedTask?.id === task.id;
              const isLocked = index > 0 && !isTaskCompleted(phaseStructure.tasks[index - 1].id);
              
              return (
                <Card
                  key={task.id}
                  className={`p-4 cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : completed
                      ? "bg-green-400/5 border-green-400/30"
                      : isLocked
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => !isLocked && setSelectedTask(task)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      ) : isLocked ? (
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1">{task.title}</h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        {task.description}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        ~{task.estimatedTokens} tokens
                      </Badge>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="lg:col-span-2">
            {selectedTask ? (
              <PhaseTaskChat
                projectId={projectId!}
                phaseNumber={phaseNum}
                task={selectedTask}
                isCompleted={isTaskCompleted(selectedTask.id)}
                onComplete={fetchPhaseProgress}
              />
            ) : (
              <Card className="glass-panel p-12 text-center">
                <Circle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Select a Task</h3>
                <p className="text-muted-foreground">
                  Choose a task from the left to start working on it with AI guidance
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhaseDetail;
