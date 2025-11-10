/**
 * Reusable card component for displaying projects
 */

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Rocket, GitBranch, ExternalLink } from "lucide-react";
import type { Project } from "@/types";

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  return (
    <Card
      className="glass-panel p-6 cursor-pointer hover:scale-105 transition-transform"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <Badge className="bg-primary/20">
          Phase {project.current_phase}/10
        </Badge>
        <Rocket className="w-5 h-5 text-primary" />
      </div>
      
      <h3 className="text-xl font-semibold mb-4">{project.name}</h3>
      
      <div className="space-y-3 mb-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">{project.progress_percentage}%</span>
          </div>
          <Progress value={project.progress_percentage} className="h-2" />
        </div>
      </div>

      <div className="flex gap-2">
        {project.repository_url && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.open(project.repository_url!, "_blank");
            }}
          >
            <GitBranch className="w-3 h-3 mr-1" />
            Repo
          </Button>
        )}
        {project.deployment_url && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.open(project.deployment_url!, "_blank");
            }}
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Live
          </Button>
        )}
      </div>

      <div className="text-xs text-muted-foreground mt-4">
        Started {new Date(project.created_at).toLocaleDateString()}
      </div>
    </Card>
  );
}
