import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveTaskArtifact, getPhaseArtifacts } from "@/lib/phaseUtils";
import { toast } from "sonner";

interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  notes: string;
}

interface LaunchChecklistTaskProps {
  projectId: string;
  phaseNumber: number;
  taskId: string;
}

export const LaunchChecklistTask = ({ projectId, phaseNumber, taskId }: LaunchChecklistTaskProps) => {
  const [items, setItems] = useState<ChecklistItem[]>([
    { id: "perf-test", task: "Performance Testing", completed: false, notes: "" },
    { id: "security", task: "Security Review", completed: false, notes: "" },
    { id: "docs", task: "Documentation Complete", completed: false, notes: "" },
    { id: "support", task: "Support Setup", completed: false, notes: "" },
    { id: "backup", task: "Backup Strategy", completed: false, notes: "" },
    { id: "monitoring", task: "Monitoring Configured", completed: false, notes: "" }
  ]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadExistingData();
  }, [projectId, phaseNumber, taskId]);

  const loadExistingData = async () => {
    const result = await getPhaseArtifacts(projectId, phaseNumber);
    if (result.success && result.data) {
      const existingArtifact = result.data.find(a => a.task_id === taskId);
      if (existingArtifact?.artifact_data) {
        const artifactData = existingArtifact.artifact_data as { items?: ChecklistItem[] };
        if (artifactData.items) {
          setItems(artifactData.items);
        }
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await saveTaskArtifact(projectId, phaseNumber, taskId, "launch-checklist", {
      items,
      completionRate: (items.filter(i => i.completed).length / items.length * 100).toFixed(0)
    });

    if (result.success) {
      toast.success("Launch checklist saved successfully");
    } else {
      toast.error("Failed to save launch checklist");
    }
    setIsSaving(false);
  };

  const toggleItem = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const updateNotes = (id: string, notes: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, notes } : item
    ));
  };

  const addItem = () => {
    const newId = `custom-${Date.now()}`;
    setItems([...items, { id: newId, task: "", completed: false, notes: "" }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateTask = (id: string, task: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, task } : item
    ));
  };

  const completedCount = items.filter(i => i.completed).length;
  const totalCount = items.length;
  const completionRate = totalCount > 0 ? (completedCount / totalCount * 100).toFixed(0) : 0;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold">Launch Readiness Checklist</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {completedCount} of {totalCount} items completed ({completionRate}%)
            </p>
          </div>
          <Button onClick={addItem} variant="outline" size="sm">Add Item</Button>
        </div>

        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={item.id}
                    checked={item.completed}
                    onCheckedChange={() => toggleItem(item.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={item.task}
                        onChange={(e) => updateTask(item.id, e.target.value)}
                        placeholder="Task description"
                        className={item.completed ? "line-through" : ""}
                      />
                      {item.id.startsWith("custom-") && (
                        <Button 
                          onClick={() => removeItem(item.id)} 
                          variant="ghost" 
                          size="sm"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <div>
                      <Label htmlFor={`notes-${item.id}`} className="text-xs">Notes</Label>
                      <Input
                        id={`notes-${item.id}`}
                        value={item.notes}
                        onChange={(e) => updateNotes(item.id, e.target.value)}
                        placeholder="Additional notes or status"
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <Button onClick={handleSave} disabled={isSaving} className="w-full">
        {isSaving ? "Saving..." : "Save Launch Checklist"}
      </Button>
    </div>
  );
};
