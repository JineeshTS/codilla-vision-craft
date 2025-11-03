import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ValuePropositionCanvasProps {
  data?: any;
  onChange: (data: any) => void;
}

const ValuePropositionCanvas = ({ data = {}, onChange }: ValuePropositionCanvasProps) => {
  const updateField = (field: string, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <Card className="glass-panel p-6">
      <h2 className="text-2xl font-bold mb-6">Value Proposition Canvas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Customer Profile</h3>
          <div>
            <Label>Customer Jobs</Label>
            <Textarea
              placeholder="What tasks are customers trying to get done?"
              value={data.customerJobs || ""}
              onChange={(e) => updateField("customerJobs", e.target.value)}
              rows={5}
            />
          </div>
          <div>
            <Label>Pains</Label>
            <Textarea
              placeholder="What annoys customers before, during, and after getting the job done?"
              value={data.pains || ""}
              onChange={(e) => updateField("pains", e.target.value)}
              rows={5}
            />
          </div>
          <div>
            <Label>Gains</Label>
            <Textarea
              placeholder="What outcomes and benefits do customers want?"
              value={data.gains || ""}
              onChange={(e) => updateField("gains", e.target.value)}
              rows={5}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Value Map</h3>
          <div>
            <Label>Products & Services</Label>
            <Textarea
              placeholder="What products and services do you offer?"
              value={data.productsServices || ""}
              onChange={(e) => updateField("productsServices", e.target.value)}
              rows={5}
            />
          </div>
          <div>
            <Label>Pain Relievers</Label>
            <Textarea
              placeholder="How do your products and services alleviate customer pains?"
              value={data.painRelievers || ""}
              onChange={(e) => updateField("painRelievers", e.target.value)}
              rows={5}
            />
          </div>
          <div>
            <Label>Gain Creators</Label>
            <Textarea
              placeholder="How do your products and services create customer gains?"
              value={data.gainCreators || ""}
              onChange={(e) => updateField("gainCreators", e.target.value)}
              rows={5}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ValuePropositionCanvas;
