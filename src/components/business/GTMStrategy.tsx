import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface GTMStrategyProps {
  data?: any;
  onChange: (data: any) => void;
}

const GTMStrategy = ({ data = {}, onChange }: GTMStrategyProps) => {
  const updateField = (field: string, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <Card className="glass-panel p-6">
      <h2 className="text-2xl font-bold mb-6">Go-to-Market Strategy</h2>
      <div className="space-y-6">
        <div>
          <Label>Target Market</Label>
          <Textarea
            placeholder="Who is your ideal customer? Define demographics, psychographics, and firmographics"
            value={data.targetMarket || ""}
            onChange={(e) => updateField("targetMarket", e.target.value)}
            rows={4}
          />
        </div>

        <div>
          <Label>Positioning Statement</Label>
          <Textarea
            placeholder="For [target customer] who [statement of need], our product is [product category] that [key benefit]"
            value={data.positioning || ""}
            onChange={(e) => updateField("positioning", e.target.value)}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Pricing Strategy</Label>
            <Input
              placeholder="e.g., Freemium, Subscription, One-time"
              value={data.pricingStrategy || ""}
              onChange={(e) => updateField("pricingStrategy", e.target.value)}
            />
          </div>

          <div>
            <Label>Initial Price Point</Label>
            <Input
              placeholder="e.g., $49/month"
              value={data.pricePoint || ""}
              onChange={(e) => updateField("pricePoint", e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label>Distribution Channels</Label>
          <Textarea
            placeholder="How will customers access your product? (Direct sales, Partners, App stores, etc.)"
            value={data.distributionChannels || ""}
            onChange={(e) => updateField("distributionChannels", e.target.value)}
            rows={4}
          />
        </div>

        <div>
          <Label>Marketing Channels</Label>
          <Textarea
            placeholder="How will you reach customers? (Content marketing, SEO, Paid ads, Social media, etc.)"
            value={data.marketingChannels || ""}
            onChange={(e) => updateField("marketingChannels", e.target.value)}
            rows={4}
          />
        </div>

        <div>
          <Label>Sales Strategy</Label>
          <Textarea
            placeholder="Describe your sales process and team structure"
            value={data.salesStrategy || ""}
            onChange={(e) => updateField("salesStrategy", e.target.value)}
            rows={4}
          />
        </div>

        <div>
          <Label>Launch Timeline</Label>
          <Textarea
            placeholder="Key milestones and dates for your go-to-market launch"
            value={data.timeline || ""}
            onChange={(e) => updateField("timeline", e.target.value)}
            rows={4}
          />
        </div>

        <div>
          <Label>Success Metrics</Label>
          <Textarea
            placeholder="How will you measure GTM success? (CAC, Conversion rate, MRR, etc.)"
            value={data.successMetrics || ""}
            onChange={(e) => updateField("successMetrics", e.target.value)}
            rows={4}
          />
        </div>
      </div>
    </Card>
  );
};

export default GTMStrategy;
