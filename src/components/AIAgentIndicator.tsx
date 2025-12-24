import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles, Zap } from "lucide-react";

interface AIAgentIndicatorProps {
  agent: "agent1" | "agent2" | "agent3";
  score?: number;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

const AIAgentIndicator = ({ 
  agent, 
  score, 
  size = "md",
  showIcon = true 
}: AIAgentIndicatorProps) => {
  const agentConfig = {
    agent1: {
      name: "Agent 1",
      color: "text-primary",
      bgColor: "bg-primary/20",
      icon: Brain,
    },
    agent2: {
      name: "Agent 2",
      color: "text-secondary",
      bgColor: "bg-secondary/20",
      icon: Sparkles,
    },
    agent3: {
      name: "Agent 3",
      color: "text-primary",
      bgColor: "bg-primary/20",
      icon: Zap,
    },
  };

  const config = agentConfig[agent];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  return (
    <Badge className={`${config.bgColor} ${config.color} ${sizeClasses[size]} gap-1.5`}>
      {showIcon && <Icon className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />}
      <span>{config.name}</span>
      {score !== undefined && <span className="font-bold">• {score}%</span>}
    </Badge>
  );
};

export default AIAgentIndicator;