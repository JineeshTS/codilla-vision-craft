import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { saveTaskArtifact, getPhaseArtifacts } from "@/lib/phaseUtils";

interface Technology {
  name: string;
  category: string;
  rationale: string;
}

interface TechStackTaskProps {
  projectId: string;
  phaseNumber: number;
  taskId: string;
}

const TechStackTask = ({ projectId, phaseNumber, taskId }: TechStackTaskProps) => {
  const [technologies, setTechnologies] = useState<Technology[]>([
    { name: "", category: "Frontend", rationale: "" }
  ]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadExistingData();
  }, [projectId, phaseNumber, taskId]);

  const loadExistingData = async () => {
    const { success, data } = await getPhaseArtifacts(projectId, phaseNumber);
    if (success && data) {
      const artifact = data.find(a => a.task_id === taskId);
      if (artifact?.artifact_data) {
        const artifactData = artifact.artifact_data as { technologies?: Technology[] };
        if (artifactData.technologies) {
          setTechnologies(artifactData.technologies);
        }
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { success, error } = await saveTaskArtifact(
      projectId,
      phaseNumber,
      taskId,
      "tech_stack",
      { technologies }
    );

    if (success) {
      toast({ title: "Tech stack saved successfully" });
    } else {
      toast({ title: "Failed to save", description: error, variant: "destructive" });
    }
    setSaving(false);
  };

  const addTechnology = () => {
    setTechnologies([...technologies, { name: "", category: "Frontend", rationale: "" }]);
  };

  const removeTechnology = (index: number) => {
    if (technologies.length > 1) {
      setTechnologies(technologies.filter((_, i) => i !== index));
    }
  };

  const updateTechnology = (index: number, field: keyof Technology, value: string) => {
    const updated = [...technologies];
    updated[index] = { ...updated[index], [field]: value };
    setTechnologies(updated);
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Technology Stack</h3>
        <div className="flex gap-2">
          <Button onClick={addTechnology} variant="outline" size="sm">
            Add Technology
          </Button>
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {technologies.map((tech, index) => (
          <Card key={index} className="p-4 space-y-4">
            <div className="flex justify-between items-start">
              <h4 className="font-medium">Technology {index + 1}</h4>
              {technologies.length > 1 && (
                <Button
                  onClick={() => removeTechnology(index)}
                  variant="ghost"
                  size="sm"
                >
                  Remove
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Technology Name</Label>
                <Input
                  value={tech.name}
                  onChange={(e) => updateTechnology(index, "name", e.target.value)}
                  placeholder="React, Node.js, PostgreSQL..."
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={tech.category}
                  onChange={(e) => updateTechnology(index, "category", e.target.value)}
                  placeholder="Frontend, Backend, Database..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Rationale</Label>
              <Textarea
                value={tech.rationale}
                onChange={(e) => updateTechnology(index, "rationale", e.target.value)}
                placeholder="Why this technology? What benefits does it provide?"
                rows={3}
              />
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
};

export default TechStackTask;
