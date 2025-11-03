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

interface Feature {
  name: string;
  description: string;
  priority: "must-have" | "should-have" | "could-have" | "wont-have";
  complexity: "low" | "medium" | "high";
  dependencies: string;
  acceptanceCriteria: string;
}

interface FeatureSpecTaskProps {
  projectId: string;
  phaseNumber: number;
  taskId: string;
}

const FeatureSpecTask = ({ projectId, phaseNumber, taskId }: FeatureSpecTaskProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [features, setFeatures] = useState<Feature[]>([
    { name: "", description: "", priority: "must-have", complexity: "medium", dependencies: "", acceptanceCriteria: "" }
  ]);

  useEffect(() => {
    loadExistingData();
  }, [projectId, phaseNumber, taskId]);

  const loadExistingData = async () => {
    const result = await getPhaseArtifacts(projectId, phaseNumber);
    if (result.success && result.data) {
      const artifact = result.data.find(a => a.task_id === taskId);
      if (artifact && artifact.artifact_data.features) {
        setFeatures(artifact.artifact_data.features);
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
        "feature_specification",
        { features }
      );

      if (result.success) {
        toast({
          title: "Saved!",
          description: "Feature specifications saved successfully",
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

  const addFeature = () => {
    setFeatures([...features, { 
      name: "", description: "", priority: "should-have", complexity: "medium", dependencies: "", acceptanceCriteria: "" 
    }]);
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const updateFeature = (index: number, field: keyof Feature, value: string) => {
    const updated = [...features];
    updated[index] = { ...updated[index], [field]: value };
    setFeatures(updated);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "must-have": return "bg-red-500/20 text-red-400";
      case "should-have": return "bg-yellow-500/20 text-yellow-400";
      case "could-have": return "bg-blue-500/20 text-blue-400";
      case "wont-have": return "bg-gray-500/20 text-gray-400";
      default: return "bg-muted";
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "high": return "bg-red-500/20 text-red-400";
      case "medium": return "bg-yellow-500/20 text-yellow-400";
      case "low": return "bg-green-500/20 text-green-400";
      default: return "bg-muted";
    }
  };

  return (
    <Card className="glass-panel p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold">Feature Specifications (MoSCoW)</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Must have, Should have, Could have, Won't have
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={addFeature} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Feature
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
        {features.map((feature, index) => (
          <Card key={index} className="p-6 bg-background/50 border-muted">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <h5 className="font-medium">Feature #{index + 1}</h5>
                <Badge className={getPriorityColor(feature.priority)}>
                  {feature.priority}
                </Badge>
                <Badge className={getComplexityColor(feature.complexity)}>
                  {feature.complexity}
                </Badge>
              </div>
              {features.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFeature(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <Label>Feature Name</Label>
                <Input
                  placeholder="e.g., User Authentication"
                  value={feature.name}
                  onChange={(e) => updateFeature(index, "name", e.target.value)}
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Detailed description of the feature and its functionality..."
                  value={feature.description}
                  onChange={(e) => updateFeature(index, "description", e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority (MoSCoW)</Label>
                  <Select
                    value={feature.priority}
                    onValueChange={(value: any) => updateFeature(index, "priority", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="must-have">Must Have</SelectItem>
                      <SelectItem value="should-have">Should Have</SelectItem>
                      <SelectItem value="could-have">Could Have</SelectItem>
                      <SelectItem value="wont-have">Won't Have</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Complexity</Label>
                  <Select
                    value={feature.complexity}
                    onValueChange={(value: any) => updateFeature(index, "complexity", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Dependencies</Label>
                <Textarea
                  placeholder="Other features or systems this depends on..."
                  value={feature.dependencies}
                  onChange={(e) => updateFeature(index, "dependencies", e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <Label>Acceptance Criteria</Label>
                <Textarea
                  placeholder="Clear criteria for when this feature is complete and working..."
                  value={feature.acceptanceCriteria}
                  onChange={(e) => updateFeature(index, "acceptanceCriteria", e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
};

export default FeatureSpecTask;
