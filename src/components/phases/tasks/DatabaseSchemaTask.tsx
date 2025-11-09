import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { saveTaskArtifact, getPhaseArtifacts } from "@/lib/phaseUtils";

interface Table {
  name: string;
  description: string;
  fields: string;
  relationships: string;
}

interface DatabaseSchemaTaskProps {
  projectId: string;
  phaseNumber: number;
  taskId: string;
}

const DatabaseSchemaTask = ({ projectId, phaseNumber, taskId }: DatabaseSchemaTaskProps) => {
  const [tables, setTables] = useState<Table[]>([
    { name: "", description: "", fields: "", relationships: "" }
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
        const artifactData = artifact.artifact_data as { tables?: Table[] };
        if (artifactData.tables) {
          setTables(artifactData.tables);
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
      "database_schema",
      { tables }
    );

    if (success) {
      toast({ title: "Database schema saved successfully" });
    } else {
      toast({ title: "Failed to save", description: error, variant: "destructive" });
    }
    setSaving(false);
  };

  const addTable = () => {
    setTables([...tables, { name: "", description: "", fields: "", relationships: "" }]);
  };

  const removeTable = (index: number) => {
    if (tables.length > 1) {
      setTables(tables.filter((_, i) => i !== index));
    }
  };

  const updateTable = (index: number, field: keyof Table, value: string) => {
    const updated = [...tables];
    updated[index] = { ...updated[index], [field]: value };
    setTables(updated);
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Database Schema</h3>
        <div className="flex gap-2">
          <Button onClick={addTable} variant="outline" size="sm">
            Add Table
          </Button>
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {tables.map((table, index) => (
          <Card key={index} className="p-4 space-y-4">
            <div className="flex justify-between items-start">
              <h4 className="font-medium">Table {index + 1}</h4>
              {tables.length > 1 && (
                <Button
                  onClick={() => removeTable(index)}
                  variant="ghost"
                  size="sm"
                >
                  Remove
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label>Table Name</Label>
              <Input
                value={table.name}
                onChange={(e) => updateTable(index, "name", e.target.value)}
                placeholder="users, products, orders..."
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={table.description}
                onChange={(e) => updateTable(index, "description", e.target.value)}
                placeholder="What this table stores..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Fields</Label>
              <Textarea
                value={table.fields}
                onChange={(e) => updateTable(index, "fields", e.target.value)}
                placeholder="id (UUID), name (string), email (string), created_at (timestamp)..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Relationships</Label>
              <Textarea
                value={table.relationships}
                onChange={(e) => updateTable(index, "relationships", e.target.value)}
                placeholder="Foreign keys and relationships with other tables..."
                rows={2}
              />
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
};

export default DatabaseSchemaTask;
