import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { saveTaskArtifact, getPhaseArtifacts } from "@/lib/phaseUtils";

interface ArchitectureTaskProps {
  projectId: string;
  phaseNumber: number;
  taskId: string;
}

const ArchitectureTask = ({ projectId, phaseNumber, taskId }: ArchitectureTaskProps) => {
  const [data, setData] = useState({
    systemOverview: "",
    componentBreakdown: "",
    dataFlow: "",
    scalabilityConsiderations: "",
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
      "architecture",
      data
    );

    if (success) {
      toast({ title: "Architecture design saved successfully" });
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
        <h3 className="text-xl font-semibold">Architecture Design</h3>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label>System Overview</Label>
          <Textarea
            value={data.systemOverview}
            onChange={(e) => updateField("systemOverview", e.target.value)}
            placeholder="High-level description of the system architecture..."
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label>Component Breakdown</Label>
          <Textarea
            value={data.componentBreakdown}
            onChange={(e) => updateField("componentBreakdown", e.target.value)}
            placeholder="Major components and their responsibilities..."
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label>Data Flow</Label>
          <Textarea
            value={data.dataFlow}
            onChange={(e) => updateField("dataFlow", e.target.value)}
            placeholder="How data moves through the system..."
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label>Scalability Considerations</Label>
          <Textarea
            value={data.scalabilityConsiderations}
            onChange={(e) => updateField("scalabilityConsiderations", e.target.value)}
            placeholder="How the architecture will scale..."
            rows={4}
          />
        </div>
      </div>
    </Card>
  );
};

export default ArchitectureTask;
