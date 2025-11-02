import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface AIAgent {
  name: string;
  specialty: string;
  status: "idle" | "processing" | "completed" | "failed";
  score?: number;
  feedback?: string;
}

interface ThreeAIIndicatorProps {
  agents: AIAgent[];
  avgScore?: number;
  consensus?: boolean;
}

export const ThreeAIIndicator = ({ agents, avgScore, consensus }: ThreeAIIndicatorProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case "processing":
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Brain className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "border-green-400/30 bg-green-400/10";
      case "processing":
        return "border-primary/30 bg-primary/10";
      case "failed":
        return "border-destructive/30 bg-destructive/10";
      default:
        return "border-muted";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Three-AI Consensus System
          </h3>
          <p className="text-xs text-muted-foreground">
            Multiple AI agents analyze your submission for comprehensive feedback
          </p>
        </div>
        {consensus !== undefined && (
          <Badge className={consensus ? "bg-green-400/20 text-green-400" : "bg-yellow-400/20 text-yellow-400"}>
            {consensus ? "Consensus Reached" : "Mixed Results"}
          </Badge>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <Card 
            key={agent.name}
            className={`p-4 transition-all ${getStatusColor(agent.status)}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {getStatusIcon(agent.status)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">{agent.name}</h4>
                <p className="text-xs text-muted-foreground mb-2">{agent.specialty}</p>
                
                {agent.status === "processing" && (
                  <div className="space-y-1">
                    <Progress value={undefined} className="h-1" />
                    <p className="text-xs text-muted-foreground">Analyzing...</p>
                  </div>
                )}
                
                {agent.status === "completed" && agent.score !== undefined && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Score</span>
                      <span className="text-lg font-bold text-primary">{agent.score}/10</span>
                    </div>
                    <Progress value={agent.score * 10} className="h-1.5" />
                  </div>
                )}
                
                {agent.status === "failed" && (
                  <p className="text-xs text-destructive">Analysis failed</p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {avgScore !== undefined && (
        <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold mb-1">Overall Consensus Score</h4>
              <p className="text-xs text-muted-foreground">
                Average across all AI agents
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold gradient-text">{avgScore}/10</div>
              <Progress value={avgScore * 10} className="h-2 mt-2 w-32" />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
