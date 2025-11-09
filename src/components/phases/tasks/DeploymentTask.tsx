import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveTaskArtifact, getPhaseArtifacts } from "@/lib/phaseUtils";
import { toast } from "sonner";

interface DeploymentTaskProps {
  projectId: string;
  phaseNumber: number;
  taskId: string;
}

export const DeploymentTask = ({ projectId, phaseNumber, taskId }: DeploymentTaskProps) => {
  const [data, setData] = useState({
    productionUrl: "",
    deploymentDate: "",
    deploymentMethod: "",
    environmentVariables: "",
    dnsConfiguration: "",
    sslSetup: "",
    deploymentNotes: ""
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadExistingData();
  }, [projectId, phaseNumber, taskId]);

  const loadExistingData = async () => {
    const result = await getPhaseArtifacts(projectId, phaseNumber);
    if (result.success && result.data) {
      const existingArtifact = result.data.find(a => a.task_id === taskId);
      if (existingArtifact?.artifact_data) {
        setData(existingArtifact.artifact_data as typeof data);
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await saveTaskArtifact(projectId, phaseNumber, taskId, "deployment", data);

    if (result.success) {
      toast.success("Deployment information saved successfully");
    } else {
      toast.error("Failed to save deployment information");
    }
    setIsSaving(false);
  };

  const updateField = (field: string, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Production Deployment</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="productionUrl">Production URL</Label>
            <Input
              id="productionUrl"
              value={data.productionUrl}
              onChange={(e) => updateField("productionUrl", e.target.value)}
              placeholder="https://your-app.com"
            />
          </div>
          <div>
            <Label htmlFor="deploymentDate">Deployment Date & Time</Label>
            <Input
              id="deploymentDate"
              type="datetime-local"
              value={data.deploymentDate}
              onChange={(e) => updateField("deploymentDate", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="deploymentMethod">Deployment Method</Label>
            <Input
              id="deploymentMethod"
              value={data.deploymentMethod}
              onChange={(e) => updateField("deploymentMethod", e.target.value)}
              placeholder="e.g., Vercel, Netlify, AWS, Docker"
            />
          </div>
          <div>
            <Label htmlFor="dnsConfiguration">DNS Configuration</Label>
            <Textarea
              id="dnsConfiguration"
              value={data.dnsConfiguration}
              onChange={(e) => updateField("dnsConfiguration", e.target.value)}
              placeholder="DNS records and configuration details"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="sslSetup">SSL/TLS Setup</Label>
            <Textarea
              id="sslSetup"
              value={data.sslSetup}
              onChange={(e) => updateField("sslSetup", e.target.value)}
              placeholder="SSL certificate details and configuration"
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="environmentVariables">Environment Variables</Label>
            <Textarea
              id="environmentVariables"
              value={data.environmentVariables}
              onChange={(e) => updateField("environmentVariables", e.target.value)}
              placeholder="List of environment variables configured (without sensitive values)"
              rows={4}
            />
          </div>
          <div>
            <Label htmlFor="deploymentNotes">Deployment Notes</Label>
            <Textarea
              id="deploymentNotes"
              value={data.deploymentNotes}
              onChange={(e) => updateField("deploymentNotes", e.target.value)}
              placeholder="Any additional notes about the deployment process"
              rows={3}
            />
          </div>
        </div>
      </Card>

      <Button onClick={handleSave} disabled={isSaving} className="w-full">
        {isSaving ? "Saving..." : "Save Deployment Info"}
      </Button>
    </div>
  );
};
