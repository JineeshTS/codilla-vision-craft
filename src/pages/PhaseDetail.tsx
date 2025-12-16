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
import { getPhaseStructure, PhaseTask } from "@/config/phaseStructure";
import { ArrowLeft, CheckCircle2, Circle, Lock, PartyPopper } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { 
  initializePhaseProgress, 
  calculatePhaseProgress, 
  areAllTasksCompleted,
  completePhase 
} from "@/lib/phaseUtils";

interface PhaseProgress {
  id: string;
  completed_tasks: string[];
  task_outputs: Record<string, any>;
  status: string;
  progress: number;
}

const PhaseDetail = () => {
  const { projectId, phaseNumber } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuthGuard();
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<PhaseTask | null>(null);
  const [phaseProgress, setPhaseProgress] = useState<PhaseProgress | null>(null);
  const [phaseComplete, setPhaseComplete] = useState(false);
  
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
        .select("*")
        .eq("project_id", projectId)
        .eq("phase_number", phaseNum)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setPhaseProgress(data as PhaseProgress);
        setPhaseComplete(data.status === "completed");
      } else {
        // Initialize phase progress
        const result = await initializePhaseProgress(projectId!, phaseNum);
        if (result.success && result.data) {
          setPhaseProgress(result.data);
        } else {
          throw new Error(result.error || "Failed to initialize phase");
        }
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

  const handleTaskComplete = async () => {
    await fetchPhaseProgress();
    
    // Check if all tasks are completed
    if (phaseProgress && areAllTasksCompleted(phaseNum, phaseProgress.completed_tasks)) {
      const result = await completePhase(projectId!, phaseNum);
      if (result.success) {
        setPhaseComplete(true);
        toast({
          title: "🎉 Phase Complete!",
          description: `You've completed Phase ${phaseNum}: ${phaseStructure?.phaseName}. Moving to next phase...`,
        });
      }
    }
  };

  const isTaskCompleted = (taskId: string) => {
    return phaseProgress?.completed_tasks.includes(taskId) || false;
  };

  const getCompletedTasksCount = () => {
    return phaseProgress?.completed_tasks.length || 0;
  };

  const getProgressPercentage = () => {
    if (!phaseStructure || !phaseProgress) return 0;
    return calculatePhaseProgress(phaseNum, phaseProgress.completed_tasks);
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
        <Breadcrumbs 
          items={[
            { label: "Projects", href: "/projects" },
            { label: "Project", href: `/projects/${projectId}` },
            { label: `Phase ${phaseNum}` }
          ]} 
        />
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
            {phaseComplete ? (
              <Card className="glass-panel p-12 text-center">
                <PartyPopper className="w-16 h-16 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold gradient-text mb-4">
                  Phase {phaseNum} Complete! 🎉
                </h3>
                <p className="text-muted-foreground mb-6">
                  You've completed all tasks in {phaseStructure?.phaseName}. Ready to move on?
                </p>
                <div className="flex gap-4 justify-center">
                  <Button 
                    onClick={() => navigate(`/projects/${projectId}/phase/${phaseNum + 1}`)}
                    size="lg"
                  >
                    Start Next Phase
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate(`/projects/${projectId}`)}
                    size="lg"
                  >
                    Back to Project
                  </Button>
                </div>
              </Card>
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
