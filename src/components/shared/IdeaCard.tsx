/**
 * Reusable card component for displaying ideas
 */

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingUp, Archive } from "lucide-react";
import type { Idea } from "@/types";

interface IdeaCardProps {
  idea: Idea;
  onClick: () => void;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "draft":
      return <Lightbulb className="w-4 h-4" />;
    case "validating":
    case "validated":
    case "in_development":
      return <TrendingUp className="w-4 h-4" />;
    case "completed":
      return <Archive className="w-4 h-4" />;
    default:
      return <Lightbulb className="w-4 h-4" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "draft":
      return "bg-muted";
    case "validating":
      return "bg-blue-500/20 text-blue-400";
    case "validated":
      return "bg-green-500/20 text-green-400";
    case "in_development":
      return "bg-purple-500/20 text-purple-400";
    case "completed":
      return "bg-primary/20";
    default:
      return "bg-muted";
  }
};

export function IdeaCard({ idea, onClick }: IdeaCardProps) {
  return (
    <Card
      className="glass-panel p-6 cursor-pointer hover:scale-105 transition-transform"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <Badge className={getStatusColor(idea.status)}>
          {getStatusIcon(idea.status)}
          <span className="ml-1">{idea.status.replace("_", " ")}</span>
        </Badge>
        {idea.consensus_score && (
          <div className="text-sm font-semibold text-primary">
            {idea.consensus_score}% consensus
          </div>
        )}
      </div>
      
      <h3 className="text-xl font-semibold mb-2">{idea.title}</h3>
      
      <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
        {idea.description}
      </p>
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{idea.tokens_spent} tokens spent</span>
        <span>{new Date(idea.created_at).toLocaleDateString()}</span>
      </div>
    </Card>
  );
}
