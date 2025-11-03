import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";

interface UnitEconomicsProps {
  data?: any;
  onChange: (data: any) => void;
}

const UnitEconomics = ({ data = {}, onChange }: UnitEconomicsProps) => {
  const [metrics, setMetrics] = useState({
    averageRevenuePerUser: data.averageRevenuePerUser || 0,
    grossMargin: data.grossMargin || 0,
    customerAcquisitionCost: data.customerAcquisitionCost || 0,
    churnRate: data.churnRate || 0,
    ...data,
  });

  const updateField = (field: string, value: any) => {
    const updated = { ...metrics, [field]: value };
    setMetrics(updated);
    onChange(updated);
  };

  const calculateLTV = () => {
    const { averageRevenuePerUser, grossMargin, churnRate } = metrics;
    if (churnRate === 0) return 0;
    return (averageRevenuePerUser * (grossMargin / 100)) / (churnRate / 100);
  };

  const calculateLTVCAC = () => {
    const ltv = calculateLTV();
    const { customerAcquisitionCost } = metrics;
    if (customerAcquisitionCost === 0) return 0;
    return ltv / customerAcquisitionCost;
  };

  const calculatePaybackPeriod = () => {
    const { customerAcquisitionCost, averageRevenuePerUser, grossMargin } = metrics;
    const monthlyGrossProfit = averageRevenuePerUser * (grossMargin / 100);
    if (monthlyGrossProfit === 0) return 0;
    return customerAcquisitionCost / monthlyGrossProfit;
  };

  useEffect(() => {
    onChange(metrics);
  }, []);

  const ltv = calculateLTV();
  const ltvCacRatio = calculateLTVCAC();
  const paybackPeriod = calculatePaybackPeriod();

  return (
    <Card className="glass-panel p-6">
      <h2 className="text-2xl font-bold mb-6">Unit Economics Calculator</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <Label>Average Revenue Per User (Monthly)</Label>
          <Input
            type="number"
            placeholder="₹"
            value={metrics.averageRevenuePerUser}
            onChange={(e) => updateField("averageRevenuePerUser", parseFloat(e.target.value) || 0)}
          />
        </div>

        <div>
          <Label>Gross Margin (%)</Label>
          <Input
            type="number"
            placeholder="%"
            value={metrics.grossMargin}
            onChange={(e) => updateField("grossMargin", parseFloat(e.target.value) || 0)}
          />
        </div>

        <div>
          <Label>Customer Acquisition Cost (CAC)</Label>
          <Input
            type="number"
            placeholder="₹"
            value={metrics.customerAcquisitionCost}
            onChange={(e) => updateField("customerAcquisitionCost", parseFloat(e.target.value) || 0)}
          />
        </div>

        <div>
          <Label>Monthly Churn Rate (%)</Label>
          <Input
            type="number"
            placeholder="%"
            value={metrics.churnRate}
            onChange={(e) => updateField("churnRate", parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-4 bg-primary/10 border-primary/20">
          <Label className="text-sm text-muted-foreground">Customer Lifetime Value (LTV)</Label>
          <p className="text-2xl font-bold mt-2">₹{ltv.toFixed(2)}</p>
        </Card>

        <Card className="p-4 bg-primary/10 border-primary/20">
          <Label className="text-sm text-muted-foreground">LTV:CAC Ratio</Label>
          <p className="text-2xl font-bold mt-2">{ltvCacRatio.toFixed(2)}:1</p>
          <p className="text-xs text-muted-foreground mt-1">
            {ltvCacRatio >= 3 ? "✓ Healthy" : "⚠ Needs improvement"}
          </p>
        </Card>

        <Card className="p-4 bg-primary/10 border-primary/20">
          <Label className="text-sm text-muted-foreground">CAC Payback Period</Label>
          <p className="text-2xl font-bold mt-2">{paybackPeriod.toFixed(1)} months</p>
          <p className="text-xs text-muted-foreground mt-1">
            {paybackPeriod <= 12 ? "✓ Good" : "⚠ Long payback"}
          </p>
        </Card>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Cost Structure Breakdown</Label>
          <Textarea
            placeholder="Detail your fixed and variable costs (hosting, salaries, marketing, etc.)"
            value={metrics.costBreakdown || ""}
            onChange={(e) => updateField("costBreakdown", e.target.value)}
            rows={4}
          />
        </div>

        <div>
          <Label>Revenue Assumptions</Label>
          <Textarea
            placeholder="Explain your revenue model and pricing assumptions"
            value={metrics.revenueAssumptions || ""}
            onChange={(e) => updateField("revenueAssumptions", e.target.value)}
            rows={4}
          />
        </div>

        <div>
          <Label>Path to Profitability</Label>
          <Textarea
            placeholder="When and how will your unit economics become profitable?"
            value={metrics.profitabilityPath || ""}
            onChange={(e) => updateField("profitabilityPath", e.target.value)}
            rows={4}
          />
        </div>
      </div>
    </Card>
  );
};

export default UnitEconomics;
