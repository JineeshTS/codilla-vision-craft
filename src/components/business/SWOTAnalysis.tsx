import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SWOTAnalysisProps {
  data?: any;
  onChange: (data: any) => void;
}

const SWOTAnalysis = ({ data = {}, onChange }: SWOTAnalysisProps) => {
  const updateField = (field: string, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <Card className="glass-panel p-6">
      <h2 className="text-2xl font-bold mb-6">SWOT Analysis</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4 bg-green-500/10 border-green-500/20">
          <Label className="text-green-400">Strengths</Label>
          <Textarea
            placeholder="Internal positive attributes and resources"
            value={data.strengths || ""}
            onChange={(e) => updateField("strengths", e.target.value)}
            rows={8}
            className="mt-2"
          />
        </Card>

        <Card className="p-4 bg-red-500/10 border-red-500/20">
          <Label className="text-red-400">Weaknesses</Label>
          <Textarea
            placeholder="Internal negative attributes and resources"
            value={data.weaknesses || ""}
            onChange={(e) => updateField("weaknesses", e.target.value)}
            rows={8}
            className="mt-2"
          />
        </Card>

        <Card className="p-4 bg-blue-500/10 border-blue-500/20">
          <Label className="text-blue-400">Opportunities</Label>
          <Textarea
            placeholder="External factors you can capitalize on"
            value={data.opportunities || ""}
            onChange={(e) => updateField("opportunities", e.target.value)}
            rows={8}
            className="mt-2"
          />
        </Card>

        <Card className="p-4 bg-yellow-500/10 border-yellow-500/20">
          <Label className="text-yellow-400">Threats</Label>
          <Textarea
            placeholder="External factors that could cause trouble"
            value={data.threats || ""}
            onChange={(e) => updateField("threats", e.target.value)}
            rows={8}
            className="mt-2"
          />
        </Card>
      </div>
    </Card>
  );
};

export default SWOTAnalysis;
