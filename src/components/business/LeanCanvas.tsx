import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface LeanCanvasProps {
  data?: any;
  onChange: (data: any) => void;
}

const LeanCanvas = ({ data = {}, onChange }: LeanCanvasProps) => {
  const updateField = (field: string, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <Card className="glass-panel p-6">
      <h2 className="text-2xl font-bold mb-6">Lean Canvas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label>Problem</Label>
            <Textarea
              placeholder="Top 3 problems your customers face"
              value={data.problem || ""}
              onChange={(e) => updateField("problem", e.target.value)}
              rows={4}
            />
          </div>
          <div>
            <Label>Solution</Label>
            <Textarea
              placeholder="Top 3 features that solve the problems"
              value={data.solution || ""}
              onChange={(e) => updateField("solution", e.target.value)}
              rows={4}
            />
          </div>
          <div>
            <Label>Unique Value Proposition</Label>
            <Textarea
              placeholder="Single, clear, compelling message"
              value={data.uniqueValue || ""}
              onChange={(e) => updateField("uniqueValue", e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <Label>Unfair Advantage</Label>
            <Textarea
              placeholder="Something that cannot be easily copied or bought"
              value={data.unfairAdvantage || ""}
              onChange={(e) => updateField("unfairAdvantage", e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Customer Segments</Label>
            <Textarea
              placeholder="Target customers and early adopters"
              value={data.customerSegments || ""}
              onChange={(e) => updateField("customerSegments", e.target.value)}
              rows={4}
            />
          </div>
          <div>
            <Label>Key Metrics</Label>
            <Textarea
              placeholder="Key activities you measure"
              value={data.keyMetrics || ""}
              onChange={(e) => updateField("keyMetrics", e.target.value)}
              rows={4}
            />
          </div>
          <div>
            <Label>Channels</Label>
            <Textarea
              placeholder="Path to customers"
              value={data.channels || ""}
              onChange={(e) => updateField("channels", e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <Label>Cost Structure</Label>
            <Textarea
              placeholder="Customer acquisition costs, distribution costs, hosting, people, etc."
              value={data.costStructure || ""}
              onChange={(e) => updateField("costStructure", e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <Label>Revenue Streams</Label>
            <Textarea
              placeholder="Revenue model, lifetime value, revenue, gross margin"
              value={data.revenueStreams || ""}
              onChange={(e) => updateField("revenueStreams", e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default LeanCanvas;
