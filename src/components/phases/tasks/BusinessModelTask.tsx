import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { saveTaskArtifact, getPhaseArtifacts } from "@/lib/phaseUtils";
import { Loader2, Save } from "lucide-react";

interface BusinessModelTaskProps {
  projectId: string;
  phaseNumber: number;
  taskId: string;
}

const BusinessModelTask = ({ projectId, phaseNumber, taskId }: BusinessModelTaskProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({
    keyPartners: "",
    keyActivities: "",
    keyResources: "",
    valuePropositions: "",
    customerRelationships: "",
    channels: "",
    customerSegments: "",
    costStructure: "",
    revenueStreams: "",
  });

  useEffect(() => {
    loadExistingData();
  }, [projectId, phaseNumber, taskId]);

  const loadExistingData = async () => {
    const result = await getPhaseArtifacts(projectId, phaseNumber);
    if (result.success && result.data) {
      const artifact = result.data.find(a => a.task_id === taskId);
      if (artifact) {
        setData(artifact.artifact_data as typeof data);
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
        "business_model_canvas",
        data
      );

      if (result.success) {
        toast({
          title: "Saved!",
          description: "Business Model Canvas saved successfully",
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
        <h3 className="text-xl font-semibold">Business Model Canvas</h3>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div>
            <Label>Key Partners</Label>
            <Textarea
              placeholder="Who are your key partners and suppliers?"
              value={data.keyPartners}
              onChange={(e) => updateField("keyPartners", e.target.value)}
              rows={4}
            />
          </div>
          <div>
            <Label>Key Activities</Label>
            <Textarea
              placeholder="What key activities does your value proposition require?"
              value={data.keyActivities}
              onChange={(e) => updateField("keyActivities", e.target.value)}
              rows={4}
            />
          </div>
          <div>
            <Label>Key Resources</Label>
            <Textarea
              placeholder="What key resources does your value proposition require?"
              value={data.keyResources}
              onChange={(e) => updateField("keyResources", e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Value Propositions</Label>
            <Textarea
              placeholder="What value do you deliver to the customer?"
              value={data.valuePropositions}
              onChange={(e) => updateField("valuePropositions", e.target.value)}
              rows={6}
            />
          </div>
          <div>
            <Label>Customer Relationships</Label>
            <Textarea
              placeholder="What type of relationship does each customer segment expect?"
              value={data.customerRelationships}
              onChange={(e) => updateField("customerRelationships", e.target.value)}
              rows={6}
            />
          </div>
          <div>
            <Label>Channels</Label>
            <Textarea
              placeholder="Through which channels do customers want to be reached?"
              value={data.channels}
              onChange={(e) => updateField("channels", e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Customer Segments</Label>
            <Textarea
              placeholder="For whom are you creating value?"
              value={data.customerSegments}
              onChange={(e) => updateField("customerSegments", e.target.value)}
              rows={6}
            />
          </div>
          <div>
            <Label>Cost Structure</Label>
            <Textarea
              placeholder="What are the most important costs?"
              value={data.costStructure}
              onChange={(e) => updateField("costStructure", e.target.value)}
              rows={5}
            />
          </div>
          <div>
            <Label>Revenue Streams</Label>
            <Textarea
              placeholder="For what value are customers willing to pay?"
              value={data.revenueStreams}
              onChange={(e) => updateField("revenueStreams", e.target.value)}
              rows={5}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BusinessModelTask;
