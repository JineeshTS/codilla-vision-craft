import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UserStoriesProps {
  stories: any[];
}

const UserStories = ({ stories }: UserStoriesProps) => {
  if (!stories || stories.length === 0) {
    return null;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Card className="glass-panel p-6">
      <h2 className="text-2xl font-bold mb-6">User Stories</h2>
      <div className="space-y-4">
        {stories.map((story: any, index: number) => (
          <Card key={index} className="p-4 bg-background/50">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold">{story.title}</h3>
              <div className="flex gap-2">
                {story.priority && (
                  <Badge variant={getPriorityColor(story.priority)}>
                    {story.priority}
                  </Badge>
                )}
                {story.estimatedEffort && (
                  <Badge variant="outline">{story.estimatedEffort}</Badge>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-3 italic">
              {story.story}
            </p>

            {story.acceptanceCriteria && story.acceptanceCriteria.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">Acceptance Criteria:</p>
                <ul className="space-y-1">
                  {story.acceptanceCriteria.map((criteria: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>{criteria}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        ))}
      </div>
    </Card>
  );
};

export default UserStories;
