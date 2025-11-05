import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useProjectActivity, ActivityItem } from "@/hooks/useProjectActivity";
import { 
  Brain, 
  GitCommit, 
  CheckCircle, 
  FileText,
  Clock,
  ExternalLink
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ProjectActivityFeedProps {
  projectId: string;
}

const getActivityIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case 'ai_request':
      return <Brain className="h-4 w-4" />;
    case 'code_commit':
      return <GitCommit className="h-4 w-4" />;
    case 'phase_complete':
      return <CheckCircle className="h-4 w-4" />;
    case 'artifact_version':
      return <FileText className="h-4 w-4" />;
  }
};

const getActivityColor = (type: ActivityItem['type']) => {
  switch (type) {
    case 'ai_request':
      return 'bg-primary/10 text-primary';
    case 'code_commit':
      return 'bg-green-500/10 text-green-500';
    case 'phase_complete':
      return 'bg-blue-500/10 text-blue-500';
    case 'artifact_version':
      return 'bg-purple-500/10 text-purple-500';
  }
};

export const ProjectActivityFeed = ({ projectId }: ProjectActivityFeedProps) => {
  const { data: activities, isLoading } = useProjectActivity(projectId);

  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Activity Feed</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Activity Feed</h3>
        <p className="text-sm text-muted-foreground">No activity yet</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Activity Feed</h3>
      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-4 pb-4 border-b last:border-0">
              <div className={`flex items-center justify-center h-10 w-10 rounded-full shrink-0 ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-medium text-sm truncate">{activity.title}</h4>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {activity.description}
                </p>
                
                {activity.metadata && (
                  <div className="flex flex-wrap gap-2">
                    {activity.metadata.tokens_used && (
                      <Badge variant="secondary" className="text-xs">
                        {activity.metadata.tokens_used.toLocaleString()} tokens
                      </Badge>
                    )}
                    {activity.metadata.ai_agent && (
                      <Badge variant="outline" className="text-xs">
                        {activity.metadata.ai_agent}
                      </Badge>
                    )}
                    {activity.metadata.commit_url && (
                      <a 
                        href={activity.metadata.commit_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        View commit <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {activity.metadata.is_auto_save && (
                      <Badge variant="outline" className="text-xs">
                        Auto-saved
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
