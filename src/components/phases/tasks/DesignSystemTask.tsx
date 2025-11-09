import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { saveTaskArtifact, getPhaseArtifacts } from "@/lib/phaseUtils";

interface DesignSystemTaskProps {
  projectId: string;
  phaseNumber: number;
  taskId: string;
}

const DesignSystemTask = ({ projectId, phaseNumber, taskId }: DesignSystemTaskProps) => {
  const [data, setData] = useState({
    colorPalette: "",
    typography: "",
    spacing: "",
    components: "",
    brandGuidelines: "",
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadExistingData();
  }, [projectId, phaseNumber, taskId]);

  const loadExistingData = async () => {
    const { success, data: artifacts } = await getPhaseArtifacts(projectId, phaseNumber);
    if (success && artifacts) {
      const artifact = artifacts.find(a => a.task_id === taskId);
      if (artifact?.artifact_data) {
        setData(artifact.artifact_data as typeof data);
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { success, error } = await saveTaskArtifact(
      projectId,
      phaseNumber,
      taskId,
      "design_system",
      data
    );

    if (success) {
      toast({ title: "Design system saved successfully" });
    } else {
      toast({ title: "Failed to save", description: error, variant: "destructive" });
    }
    setSaving(false);
  };

  const updateField = (field: keyof typeof data, value: string) => {
    setData({ ...data, [field]: value });
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Design System</h3>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Color Palette</Label>
          <Textarea
            value={data.colorPalette}
            onChange={(e) => updateField("colorPalette", e.target.value)}
            placeholder="Primary: #..., Secondary: #..., Accent: #..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Typography</Label>
          <Textarea
            value={data.typography}
            onChange={(e) => updateField("typography", e.target.value)}
            placeholder="Font families, sizes, weights, line heights..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Spacing System</Label>
          <Textarea
            value={data.spacing}
            onChange={(e) => updateField("spacing", e.target.value)}
            placeholder="Spacing scale: 4px, 8px, 16px, 24px, 32px..."
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>UI Components</Label>
          <Textarea
            value={data.components}
            onChange={(e) => updateField("components", e.target.value)}
            placeholder="Buttons, Cards, Forms, Navigation - specifications and variants..."
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label>Brand Guidelines</Label>
          <Textarea
            value={data.brandGuidelines}
            onChange={(e) => updateField("brandGuidelines", e.target.value)}
            placeholder="Logo usage, voice & tone, imagery style..."
            rows={3}
          />
        </div>
      </div>
    </Card>
  );
};

export default DesignSystemTask;
