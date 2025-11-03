import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { saveTaskArtifact, getPhaseArtifacts } from "@/lib/phaseUtils";

interface Wireframe {
  screenName: string;
  description: string;
  components: string;
  userFlow: string;
}

interface WireframesTaskProps {
  projectId: string;
  phaseNumber: number;
  taskId: string;
}

const WireframesTask = ({ projectId, phaseNumber, taskId }: WireframesTaskProps) => {
  const [wireframes, setWireframes] = useState<Wireframe[]>([
    { screenName: "", description: "", components: "", userFlow: "" }
  ]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadExistingData();
  }, [projectId, phaseNumber, taskId]);

  const loadExistingData = async () => {
    const { success, data } = await getPhaseArtifacts(projectId, phaseNumber);
    if (success && data) {
      const artifact = data.find((a: any) => a.task_id === taskId);
      if (artifact?.artifact_data?.wireframes) {
        setWireframes(artifact.artifact_data.wireframes);
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { success, error } = await saveTaskArtifact(
      projectId,
      phaseNumber,
      taskId,
      "wireframes",
      { wireframes }
    );

    if (success) {
      toast({ title: "Wireframes saved successfully" });
    } else {
      toast({ title: "Failed to save", description: error, variant: "destructive" });
    }
    setSaving(false);
  };

  const addWireframe = () => {
    setWireframes([...wireframes, { screenName: "", description: "", components: "", userFlow: "" }]);
  };

  const removeWireframe = (index: number) => {
    if (wireframes.length > 1) {
      setWireframes(wireframes.filter((_, i) => i !== index));
    }
  };

  const updateWireframe = (index: number, field: keyof Wireframe, value: string) => {
    const updated = [...wireframes];
    updated[index] = { ...updated[index], [field]: value };
    setWireframes(updated);
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Wireframes</h3>
        <div className="flex gap-2">
          <Button onClick={addWireframe} variant="outline" size="sm">
            Add Screen
          </Button>
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {wireframes.map((wireframe, index) => (
          <Card key={index} className="p-4 space-y-4">
            <div className="flex justify-between items-start">
              <h4 className="font-medium">Screen {index + 1}</h4>
              {wireframes.length > 1 && (
                <Button
                  onClick={() => removeWireframe(index)}
                  variant="ghost"
                  size="sm"
                >
                  Remove
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label>Screen Name</Label>
              <Input
                value={wireframe.screenName}
                onChange={(e) => updateWireframe(index, "screenName", e.target.value)}
                placeholder="Home, Dashboard, Profile..."
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={wireframe.description}
                onChange={(e) => updateWireframe(index, "description", e.target.value)}
                placeholder="Purpose and key functionality of this screen..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Components</Label>
              <Textarea
                value={wireframe.components}
                onChange={(e) => updateWireframe(index, "components", e.target.value)}
                placeholder="List of UI components: Header, Navigation, Cards, Forms..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>User Flow</Label>
              <Textarea
                value={wireframe.userFlow}
                onChange={(e) => updateWireframe(index, "userFlow", e.target.value)}
                placeholder="How users interact with this screen..."
                rows={3}
              />
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
};

export default WireframesTask;
