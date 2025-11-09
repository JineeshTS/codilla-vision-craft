import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { saveTaskArtifact, getPhaseArtifacts } from "@/lib/phaseUtils";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";

interface UserStory {
  title: string;
  asA: string;
  iWant: string;
  soThat: string;
  acceptanceCriteria: string;
  priority: "high" | "medium" | "low";
  estimatedEffort: string;
}

interface UserStoriesTaskProps {
  projectId: string;
  phaseNumber: number;
  taskId: string;
}

const UserStoriesTask = ({ projectId, phaseNumber, taskId }: UserStoriesTaskProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [stories, setStories] = useState<UserStory[]>([
    { title: "", asA: "", iWant: "", soThat: "", acceptanceCriteria: "", priority: "medium", estimatedEffort: "" }
  ]);

  useEffect(() => {
    loadExistingData();
  }, [projectId, phaseNumber, taskId]);

  const loadExistingData = async () => {
    const result = await getPhaseArtifacts(projectId, phaseNumber);
    if (result.success && result.data) {
      const artifact = result.data.find(a => a.task_id === taskId);
      if (artifact?.artifact_data) {
        const artifactData = artifact.artifact_data as { stories?: any[] };
        if (artifactData.stories) {
          setStories(artifactData.stories);
        }
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await saveTaskArtifact(
        projectId,
        phaseNumber,
        taskId,
        "user_stories",
        { stories }
      );

      if (result.success) {
        toast({
          title: "Saved!",
          description: "User stories saved successfully",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const addStory = () => {
    setStories([...stories, { 
      title: "", asA: "", iWant: "", soThat: "", acceptanceCriteria: "", priority: "medium", estimatedEffort: "" 
    }]);
  };

  const removeStory = (index: number) => {
    setStories(stories.filter((_, i) => i !== index));
  };

  const updateStory = (index: number, field: keyof UserStory, value: string) => {
    const updated = [...stories];
    updated[index] = { ...updated[index], [field]: value };
    setStories(updated);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/20 text-red-400";
      case "medium": return "bg-yellow-500/20 text-yellow-400";
      case "low": return "bg-green-500/20 text-green-400";
      default: return "bg-muted";
    }
  };

  return (
    <Card className="glass-panel p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">User Stories</h3>
        <div className="flex gap-2">
          <Button onClick={addStory} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Story
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {stories.map((story, index) => (
          <Card key={index} className="p-6 bg-background/50 border-muted">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <h5 className="font-medium">Story #{index + 1}</h5>
                <Badge className={getPriorityColor(story.priority)}>
                  {story.priority}
                </Badge>
              </div>
              {stories.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStory(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  placeholder="Brief title for this user story"
                  value={story.title}
                  onChange={(e) => updateStory(index, "title", e.target.value)}
                />
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <div>
                  <Label>As a...</Label>
                  <Input
                    placeholder="e.g., registered user"
                    value={story.asA}
                    onChange={(e) => updateStory(index, "asA", e.target.value)}
                  />
                </div>

                <div>
                  <Label>I want...</Label>
                  <Input
                    placeholder="e.g., to reset my password"
                    value={story.iWant}
                    onChange={(e) => updateStory(index, "iWant", e.target.value)}
                  />
                </div>

                <div>
                  <Label>So that...</Label>
                  <Input
                    placeholder="e.g., I can regain access to my account"
                    value={story.soThat}
                    onChange={(e) => updateStory(index, "soThat", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Acceptance Criteria</Label>
                <Textarea
                  placeholder="List the conditions that must be met for this story to be considered complete..."
                  value={story.acceptanceCriteria}
                  onChange={(e) => updateStory(index, "acceptanceCriteria", e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority</Label>
                  <Select
                    value={story.priority}
                    onValueChange={(value: any) => updateStory(index, "priority", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Estimated Effort</Label>
                  <Input
                    placeholder="e.g., 3 story points, 5 hours"
                    value={story.estimatedEffort}
                    onChange={(e) => updateStory(index, "estimatedEffort", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
};

export default UserStoriesTask;
