import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveTaskArtifact, getPhaseArtifacts } from "@/lib/phaseUtils";
import { toast } from "sonner";

interface Metric {
  name: string;
  currentValue: string;
  target: string;
  trend: string;
  insights: string;
}

interface MetricsAnalysisTaskProps {
  projectId: string;
  phaseNumber: number;
  taskId: string;
}

export const MetricsAnalysisTask = ({ projectId, phaseNumber, taskId }: MetricsAnalysisTaskProps) => {
  const [metrics, setMetrics] = useState<Metric[]>([
    { name: "User Acquisition", currentValue: "", target: "", trend: "", insights: "" },
    { name: "Activation Rate", currentValue: "", target: "", trend: "", insights: "" },
    { name: "Retention (Day 7)", currentValue: "", target: "", trend: "", insights: "" },
    { name: "Revenue", currentValue: "", target: "", trend: "", insights: "" }
  ]);
  const [overallInsights, setOverallInsights] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadExistingData();
  }, [projectId, phaseNumber, taskId]);

  const loadExistingData = async () => {
    const result = await getPhaseArtifacts(projectId, phaseNumber);
    if (result.success && result.data) {
      const existingArtifact = result.data.find((a: any) => a.task_id === taskId);
      if (existingArtifact?.artifact_data) {
        const data = existingArtifact.artifact_data;
        setMetrics(data.metrics || []);
        setOverallInsights(data.overallInsights || "");
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await saveTaskArtifact(projectId, phaseNumber, taskId, "metrics-analysis", {
      metrics,
      overallInsights,
      lastUpdated: new Date().toISOString()
    });

    if (result.success) {
      toast.success("Metrics analysis saved successfully");
    } else {
      toast.error("Failed to save metrics analysis");
    }
    setIsSaving(false);
  };

  const addMetric = () => {
    setMetrics([...metrics, { name: "", currentValue: "", target: "", trend: "", insights: "" }]);
  };

  const removeMetric = (index: number) => {
    setMetrics(metrics.filter((_, i) => i !== index));
  };

  const updateMetric = (index: number, field: keyof Metric, value: string) => {
    const updated = [...metrics];
    updated[index][field] = value;
    setMetrics(updated);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Key Metrics</h3>
          <Button onClick={addMetric} variant="outline" size="sm">Add Metric</Button>
        </div>
        {metrics.map((metric, index) => (
          <Card key={index} className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <Label>Metric {index + 1}</Label>
                {metrics.length > 1 && (
                  <Button onClick={() => removeMetric(index)} variant="ghost" size="sm">Remove</Button>
                )}
              </div>
              <div>
                <Label htmlFor={`name-${index}`}>Metric Name</Label>
                <Input
                  id={`name-${index}`}
                  value={metric.name}
                  onChange={(e) => updateMetric(index, "name", e.target.value)}
                  placeholder="e.g., Daily Active Users"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`current-${index}`}>Current Value</Label>
                  <Input
                    id={`current-${index}`}
                    value={metric.currentValue}
                    onChange={(e) => updateMetric(index, "currentValue", e.target.value)}
                    placeholder="e.g., 1,250"
                  />
                </div>
                <div>
                  <Label htmlFor={`target-${index}`}>Target Value</Label>
                  <Input
                    id={`target-${index}`}
                    value={metric.target}
                    onChange={(e) => updateMetric(index, "target", e.target.value)}
                    placeholder="e.g., 2,000"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor={`trend-${index}`}>Trend</Label>
                <Input
                  id={`trend-${index}`}
                  value={metric.trend}
                  onChange={(e) => updateMetric(index, "trend", e.target.value)}
                  placeholder="e.g., +15% week over week"
                />
              </div>
              <div>
                <Label htmlFor={`insights-${index}`}>Insights & Analysis</Label>
                <Textarea
                  id={`insights-${index}`}
                  value={metric.insights}
                  onChange={(e) => updateMetric(index, "insights", e.target.value)}
                  placeholder="What does this metric tell you? What actions should be taken?"
                  rows={3}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Overall Analysis</h3>
        <div>
          <Label htmlFor="overallInsights">Key Findings & Recommendations</Label>
          <Textarea
            id="overallInsights"
            value={overallInsights}
            onChange={(e) => setOverallInsights(e.target.value)}
            placeholder="Summarize the overall performance and key recommendations based on the metrics"
            rows={6}
          />
        </div>
      </Card>

      <Button onClick={handleSave} disabled={isSaving} className="w-full">
        {isSaving ? "Saving..." : "Save Metrics Analysis"}
      </Button>
    </div>
  );
};
