import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { saveTaskArtifact, getPhaseArtifacts } from "@/lib/phaseUtils";

interface APIEndpoint {
  method: string;
  path: string;
  description: string;
  requestBody: string;
  responseBody: string;
}

interface APIDesignTaskProps {
  projectId: string;
  phaseNumber: number;
  taskId: string;
}

const APIDesignTask = ({ projectId, phaseNumber, taskId }: APIDesignTaskProps) => {
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([
    { method: "GET", path: "", description: "", requestBody: "", responseBody: "" }
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
        const artifactData = artifact.artifact_data as { endpoints?: APIEndpoint[] };
        if (artifactData.endpoints) {
          setEndpoints(artifactData.endpoints);
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
      "api_design",
      { endpoints }
    );

    if (success) {
      toast({ title: "API design saved successfully" });
    } else {
      toast({ title: "Failed to save", description: error, variant: "destructive" });
    }
    setSaving(false);
  };

  const addEndpoint = () => {
    setEndpoints([...endpoints, { method: "GET", path: "", description: "", requestBody: "", responseBody: "" }]);
  };

  const removeEndpoint = (index: number) => {
    if (endpoints.length > 1) {
      setEndpoints(endpoints.filter((_, i) => i !== index));
    }
  };

  const updateEndpoint = (index: number, field: keyof APIEndpoint, value: string) => {
    const updated = [...endpoints];
    updated[index] = { ...updated[index], [field]: value };
    setEndpoints(updated);
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">API Design</h3>
        <div className="flex gap-2">
          <Button onClick={addEndpoint} variant="outline" size="sm">
            Add Endpoint
          </Button>
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {endpoints.map((endpoint, index) => (
          <Card key={index} className="p-4 space-y-4">
            <div className="flex justify-between items-start">
              <h4 className="font-medium">Endpoint {index + 1}</h4>
              {endpoints.length > 1 && (
                <Button
                  onClick={() => removeEndpoint(index)}
                  variant="ghost"
                  size="sm"
                >
                  Remove
                </Button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Method</Label>
                <Input
                  value={endpoint.method}
                  onChange={(e) => updateEndpoint(index, "method", e.target.value)}
                  placeholder="GET, POST, PUT..."
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Path</Label>
                <Input
                  value={endpoint.path}
                  onChange={(e) => updateEndpoint(index, "path", e.target.value)}
                  placeholder="/api/users/:id"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={endpoint.description}
                onChange={(e) => updateEndpoint(index, "description", e.target.value)}
                placeholder="What this endpoint does..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Request Body</Label>
              <Textarea
                value={endpoint.requestBody}
                onChange={(e) => updateEndpoint(index, "requestBody", e.target.value)}
                placeholder='{ "name": "string", "email": "string" }'
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Response Body</Label>
              <Textarea
                value={endpoint.responseBody}
                onChange={(e) => updateEndpoint(index, "responseBody", e.target.value)}
                placeholder='{ "id": "uuid", "name": "string", "email": "string" }'
                rows={3}
              />
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
};

export default APIDesignTask;
