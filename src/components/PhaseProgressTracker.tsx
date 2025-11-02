import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

interface Phase {
  number: number;
  name: string;
  status: "completed" | "in_progress" | "pending" | "failed";
}

interface PhaseProgressTrackerProps {
  phases: Phase[];
  currentPhase: number;
}

const PhaseProgressTracker = ({ phases, currentPhase }: PhaseProgressTrackerProps) => {
  const progress = (phases.filter(p => p.status === "completed").length / phases.length) * 100;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-primary animate-pulse" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "border-green-500/50 bg-green-500/10";
      case "in_progress":
        return "border-primary bg-primary/10";
      case "failed":
        return "border-red-500/50 bg-red-500/10";
      default:
        return "border-muted bg-muted/5";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Overall Progress</span>
        <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-2 mb-6" />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {phases.map((phase) => (
          <Card
            key={phase.number}
            className={`p-3 border transition-all ${getStatusColor(phase.status)} ${
              phase.number === currentPhase ? "ring-2 ring-primary" : ""
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              {getStatusIcon(phase.status)}
              <span className="text-xs font-semibold">Phase {phase.number}</span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{phase.name}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PhaseProgressTracker;