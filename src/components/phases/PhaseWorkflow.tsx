import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Lock, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Phase {
  number: number;
  name: string;
  duration: string;
  tokenCost: string;
  decision: string;
  status: "not_started" | "in_progress" | "completed" | "failed";
  progress: number;
}

const phases: Omit<Phase, "status" | "progress">[] = [
  {
    number: 1,
    name: "Idea Capture & Screening",
    duration: "30-60 min",
    tokenCost: "500-1,500",
    decision: "Go/No-Go/Parking Lot"
  },
  {
    number: 2,
    name: "Validation & Research",
    duration: "1-2 weeks",
    tokenCost: "60,000",
    decision: "Go/Pivot/Kill"
  },
  {
    number: 3,
    name: "Product Definition",
    duration: "3-5 days",
    tokenCost: "20,000",
    decision: "Build/Refine/Stop"
  },
  {
    number: 4,
    name: "Technical Planning",
    duration: "2-3 days",
    tokenCost: "15,000",
    decision: "Ready/Need More Info"
  },
  {
    number: 5,
    name: "Design & Prototype",
    duration: "3-5 days",
    tokenCost: "30,000",
    decision: "Approve/Revise"
  },
  {
    number: 6,
    name: "Development Preparation",
    duration: "1-2 days",
    tokenCost: "10,000",
    decision: "Start Development"
  },
  {
    number: 7,
    name: "AI-Assisted Development",
    duration: "2-4 weeks",
    tokenCost: "200,000+",
    decision: "Feature Complete"
  },
  {
    number: 8,
    name: "Launch Preparation",
    duration: "3-5 days",
    tokenCost: "25,000",
    decision: "Ready to Deploy"
  },
  {
    number: 9,
    name: "Deployment & Go-Live",
    duration: "1 day",
    tokenCost: "5,000",
    decision: "Live/Rollback"
  },
  {
    number: 10,
    name: "Post-Launch Operations",
    duration: "Ongoing",
    tokenCost: "Variable",
    decision: "Iterate/Scale"
  }
];

interface PhaseWorkflowProps {
  currentPhase: number;
  phaseProgress?: any[];
}

export const PhaseWorkflow = ({ currentPhase, phaseProgress = [] }: PhaseWorkflowProps) => {
  const getPhaseStatus = (phaseNum: number): "not_started" | "in_progress" | "completed" | "failed" => {
    if (phaseNum < currentPhase) return "completed";
    if (phaseNum === currentPhase) return "in_progress";
    return "not_started";
  };

  const getPhaseProgress = (phaseNum: number): number => {
    const progress = phaseProgress.find(p => p.phase_number === phaseNum);
    return progress?.progress || 0;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case "in_progress":
        return <Clock className="w-5 h-5 text-primary animate-pulse" />;
      case "failed":
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Lock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-400/20 text-green-400 border-green-400/30">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-primary/20 text-primary border-primary/30">In Progress</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold gradient-text">10-Phase Framework</h2>
        <div className="text-sm text-muted-foreground">
          Phase {currentPhase} of 10
        </div>
      </div>

      <div className="grid gap-4">
        {phases.map((phase) => {
          const status = getPhaseStatus(phase.number);
          const progress = getPhaseProgress(phase.number);
          const isActive = phase.number === currentPhase;

          return (
            <Card
              key={phase.number}
              className={`p-4 transition-all ${
                isActive 
                  ? "glass-panel border-primary shadow-lg" 
                  : status === "completed"
                  ? "bg-card/50"
                  : "bg-card/30"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  isActive ? "bg-primary" : status === "completed" ? "bg-green-400/20" : "bg-muted"
                }`}>
                  {getStatusIcon(status)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">
                        Phase {phase.number}: {phase.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Duration: {phase.duration} • Tokens: {phase.tokenCost}
                      </p>
                    </div>
                    {getStatusBadge(status)}
                  </div>

                  <div className="text-xs text-muted-foreground mb-2">
                    Decision Gate: {phase.decision}
                  </div>

                  {(status === "in_progress" || status === "completed") && (
                    <div className="space-y-1">
                      <Progress value={progress} className="h-1.5" />
                      <p className="text-xs text-right text-muted-foreground">{progress}%</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
