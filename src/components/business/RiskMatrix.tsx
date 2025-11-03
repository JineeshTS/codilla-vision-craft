import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface RiskMatrixProps {
  data?: any;
  onChange: (data: any) => void;
}

const RiskMatrix = ({ data = {}, onChange }: RiskMatrixProps) => {
  const risks = data.risks || [];

  const addRisk = () => {
    onChange({
      ...data,
      risks: [...risks, { name: "", description: "", probability: "medium", impact: "medium", mitigation: "" }],
    });
  };

  const updateRisk = (index: number, field: string, value: string) => {
    const updatedRisks = [...risks];
    updatedRisks[index] = { ...updatedRisks[index], [field]: value };
    onChange({ ...data, risks: updatedRisks });
  };

  const removeRisk = (index: number) => {
    onChange({ ...data, risks: risks.filter((_: any, i: number) => i !== index) });
  };

  return (
    <Card className="glass-panel p-6">
      <h2 className="text-2xl font-bold mb-6">Risk Assessment Matrix</h2>
      
      <div className="space-y-6">
        {risks.map((risk: any, index: number) => (
          <Card key={index} className="p-4 bg-background/50">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold">Risk {index + 1}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeRisk(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Risk Name</Label>
                <Input
                  placeholder="e.g., Market Competition"
                  value={risk.name || ""}
                  onChange={(e) => updateRisk(index, "name", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Probability</Label>
                  <Select
                    value={risk.probability || "medium"}
                    onValueChange={(value) => updateRisk(index, "probability", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Impact</Label>
                  <Select
                    value={risk.impact || "medium"}
                    onValueChange={(value) => updateRisk(index, "impact", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the risk in detail"
                value={risk.description || ""}
                onChange={(e) => updateRisk(index, "description", e.target.value)}
                rows={3}
              />
            </div>

            <div className="mt-4">
              <Label>Mitigation Strategy</Label>
              <Textarea
                placeholder="How will you address or reduce this risk?"
                value={risk.mitigation || ""}
                onChange={(e) => updateRisk(index, "mitigation", e.target.value)}
                rows={3}
              />
            </div>
          </Card>
        ))}

        <Button onClick={addRisk} variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Risk
        </Button>
      </div>
    </Card>
  );
};

export default RiskMatrix;
