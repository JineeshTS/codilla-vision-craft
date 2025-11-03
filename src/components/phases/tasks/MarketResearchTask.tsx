import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { saveTaskArtifact, getPhaseArtifacts } from "@/lib/phaseUtils";
import { Loader2, Save } from "lucide-react";

interface MarketResearchTaskProps {
  projectId: string;
  phaseNumber: number;
  taskId: string;
}

const MarketResearchTask = ({ projectId, phaseNumber, taskId }: MarketResearchTaskProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({
    marketSize: "",
    targetMarket: "",
    marketTrends: "",
    growthRate: "",
    marketDynamics: "",
    customerSegments: "",
    geographicFocus: "",
  });

  useEffect(() => {
    loadExistingData();
  }, [projectId, phaseNumber, taskId]);

  const loadExistingData = async () => {
    const result = await getPhaseArtifacts(projectId, phaseNumber);
    if (result.success && result.data) {
      const artifact = result.data.find(a => a.task_id === taskId);
      if (artifact) {
        setData(artifact.artifact_data);
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
        "market_research",
        data
      );

      if (result.success) {
        toast({
          title: "Saved!",
          description: "Market research data saved successfully",
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

  const updateField = (field: string, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="glass-panel p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Market Research Analysis</h3>
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

      <div className="space-y-4">
        <div>
          <Label>Total Addressable Market (TAM)</Label>
          <Input
            placeholder="e.g., $5B globally, $500M in US"
            value={data.marketSize}
            onChange={(e) => updateField("marketSize", e.target.value)}
          />
        </div>

        <div>
          <Label>Target Market Description</Label>
          <Textarea
            placeholder="Describe your specific target market segment..."
            value={data.targetMarket}
            onChange={(e) => updateField("targetMarket", e.target.value)}
            rows={4}
          />
        </div>

        <div>
          <Label>Market Trends</Label>
          <Textarea
            placeholder="What are the current trends affecting this market?"
            value={data.marketTrends}
            onChange={(e) => updateField("marketTrends", e.target.value)}
            rows={4}
          />
        </div>

        <div>
          <Label>Growth Rate & Projections</Label>
          <Textarea
            placeholder="Historical and projected growth rates..."
            value={data.growthRate}
            onChange={(e) => updateField("growthRate", e.target.value)}
            rows={3}
          />
        </div>

        <div>
          <Label>Market Dynamics</Label>
          <Textarea
            placeholder="Key forces shaping the market (regulatory, technological, social...)"
            value={data.marketDynamics}
            onChange={(e) => updateField("marketDynamics", e.target.value)}
            rows={4}
          />
        </div>

        <div>
          <Label>Customer Segments</Label>
          <Textarea
            placeholder="Break down your market into distinct customer segments..."
            value={data.customerSegments}
            onChange={(e) => updateField("customerSegments", e.target.value)}
            rows={4}
          />
        </div>

        <div>
          <Label>Geographic Focus</Label>
          <Textarea
            placeholder="Which geographic markets will you focus on?"
            value={data.geographicFocus}
            onChange={(e) => updateField("geographicFocus", e.target.value)}
            rows={3}
          />
        </div>
      </div>
    </Card>
  );
};

export default MarketResearchTask;
