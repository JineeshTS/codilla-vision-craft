import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { saveTaskArtifact, getPhaseArtifacts } from "@/lib/phaseUtils";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";

interface Competitor {
  name: string;
  description: string;
  strengths: string;
  weaknesses: string;
  marketShare: string;
  pricing: string;
}

interface CompetitiveAnalysisTaskProps {
  projectId: string;
  phaseNumber: number;
  taskId: string;
}

const CompetitiveAnalysisTask = ({ projectId, phaseNumber, taskId }: CompetitiveAnalysisTaskProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [competitors, setCompetitors] = useState<Competitor[]>([
    { name: "", description: "", strengths: "", weaknesses: "", marketShare: "", pricing: "" }
  ]);
  const [positioning, setPositioning] = useState("");
  const [differentiation, setDifferentiation] = useState("");

  useEffect(() => {
    loadExistingData();
  }, [projectId, phaseNumber, taskId]);

  const loadExistingData = async () => {
    const result = await getPhaseArtifacts(projectId, phaseNumber);
    if (result.success && result.data) {
      const artifact = result.data.find(a => a.task_id === taskId);
      if (artifact) {
        setCompetitors(artifact.artifact_data.competitors || []);
        setPositioning(artifact.artifact_data.positioning || "");
        setDifferentiation(artifact.artifact_data.differentiation || "");
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
        "competitive_analysis",
        { competitors, positioning, differentiation }
      );

      if (result.success) {
        toast({
          title: "Saved!",
          description: "Competitive analysis saved successfully",
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

  const addCompetitor = () => {
    setCompetitors([...competitors, { 
      name: "", description: "", strengths: "", weaknesses: "", marketShare: "", pricing: "" 
    }]);
  };

  const removeCompetitor = (index: number) => {
    setCompetitors(competitors.filter((_, i) => i !== index));
  };

  const updateCompetitor = (index: number, field: keyof Competitor, value: string) => {
    const updated = [...competitors];
    updated[index] = { ...updated[index], [field]: value };
    setCompetitors(updated);
  };

  return (
    <Card className="glass-panel p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Competitive Analysis</h3>
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

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold">Competitors</h4>
          <Button onClick={addCompetitor} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Competitor
          </Button>
        </div>

        {competitors.map((competitor, index) => (
          <Card key={index} className="p-4 bg-background/50 border-muted">
            <div className="flex justify-between items-start mb-4">
              <h5 className="font-medium">Competitor {index + 1}</h5>
              {competitors.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCompetitor(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <Label>Company Name</Label>
                <Input
                  placeholder="Competitor name"
                  value={competitor.name}
                  onChange={(e) => updateCompetitor(index, "name", e.target.value)}
                />
              </div>
              <div>
                <Label>Description & Product</Label>
                <Textarea
                  placeholder="What do they offer?"
                  value={competitor.description}
                  onChange={(e) => updateCompetitor(index, "description", e.target.value)}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Strengths</Label>
                  <Textarea
                    placeholder="Their advantages..."
                    value={competitor.strengths}
                    onChange={(e) => updateCompetitor(index, "strengths", e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Weaknesses</Label>
                  <Textarea
                    placeholder="Their gaps..."
                    value={competitor.weaknesses}
                    onChange={(e) => updateCompetitor(index, "weaknesses", e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Market Share</Label>
                  <Input
                    placeholder="e.g., 15%"
                    value={competitor.marketShare}
                    onChange={(e) => updateCompetitor(index, "marketShare", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Pricing</Label>
                  <Input
                    placeholder="e.g., $99/mo"
                    value={competitor.pricing}
                    onChange={(e) => updateCompetitor(index, "pricing", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}

        <div>
          <Label>Your Competitive Positioning</Label>
          <Textarea
            placeholder="How will you position yourself against competitors?"
            value={positioning}
            onChange={(e) => setPositioning(e.target.value)}
            rows={4}
          />
        </div>

        <div>
          <Label>Key Differentiation</Label>
          <Textarea
            placeholder="What makes you uniquely better?"
            value={differentiation}
            onChange={(e) => setDifferentiation(e.target.value)}
            rows={4}
          />
        </div>
      </div>
    </Card>
  );
};

export default CompetitiveAnalysisTask;
