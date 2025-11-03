import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BusinessModelCanvasProps {
  data?: any;
  onChange: (data: any) => void;
}

const BusinessModelCanvas = ({ data = {}, onChange }: BusinessModelCanvasProps) => {
  const updateField = (field: string, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <Card className="glass-panel p-6">
      <h2 className="text-2xl font-bold mb-6">Business Model Canvas</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div>
            <Label>Key Partners</Label>
            <Textarea
              placeholder="Who are your key partners and suppliers?"
              value={data.keyPartners || ""}
              onChange={(e) => updateField("keyPartners", e.target.value)}
              rows={4}
            />
          </div>
          <div>
            <Label>Key Activities</Label>
            <Textarea
              placeholder="What key activities does your value proposition require?"
              value={data.keyActivities || ""}
              onChange={(e) => updateField("keyActivities", e.target.value)}
              rows={4}
            />
          </div>
          <div>
            <Label>Key Resources</Label>
            <Textarea
              placeholder="What key resources does your value proposition require?"
              value={data.keyResources || ""}
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
              value={data.valuePropositions || ""}
              onChange={(e) => updateField("valuePropositions", e.target.value)}
              rows={6}
            />
          </div>
          <div>
            <Label>Customer Relationships</Label>
            <Textarea
              placeholder="What type of relationship does each customer segment expect?"
              value={data.customerRelationships || ""}
              onChange={(e) => updateField("customerRelationships", e.target.value)}
              rows={6}
            />
          </div>
          <div>
            <Label>Channels</Label>
            <Textarea
              placeholder="Through which channels do customers want to be reached?"
              value={data.channels || ""}
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
              value={data.customerSegments || ""}
              onChange={(e) => updateField("customerSegments", e.target.value)}
              rows={6}
            />
          </div>
          <div>
            <Label>Cost Structure</Label>
            <Textarea
              placeholder="What are the most important costs inherent in your business model?"
              value={data.costStructure || ""}
              onChange={(e) => updateField("costStructure", e.target.value)}
              rows={5}
            />
          </div>
          <div>
            <Label>Revenue Streams</Label>
            <Textarea
              placeholder="For what value are your customers willing to pay?"
              value={data.revenueStreams || ""}
              onChange={(e) => updateField("revenueStreams", e.target.value)}
              rows={5}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BusinessModelCanvas;
