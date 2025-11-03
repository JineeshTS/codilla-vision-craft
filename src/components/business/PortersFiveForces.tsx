import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";

interface PortersFiveForcesProps {
  data?: any;
  onChange: (data: any) => void;
}

const PortersFiveForces = ({ data = {}, onChange }: PortersFiveForcesProps) => {
  const updateField = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const forces = [
    { key: "competitiveRivalry", label: "Competitive Rivalry", description: "Intensity of competition in your industry" },
    { key: "threatNewEntrants", label: "Threat of New Entrants", description: "Ease of new competitors entering the market" },
    { key: "bargainingPowerSuppliers", label: "Bargaining Power of Suppliers", description: "Supplier influence on pricing and terms" },
    { key: "bargainingPowerBuyers", label: "Bargaining Power of Buyers", description: "Customer influence on pricing and demands" },
    { key: "threatSubstitutes", label: "Threat of Substitutes", description: "Availability of alternative products/services" },
  ];

  return (
    <Card className="glass-panel p-6">
      <h2 className="text-2xl font-bold mb-6">Porter's Five Forces</h2>
      <div className="space-y-6">
        {forces.map((force) => (
          <div key={force.key} className="space-y-3">
            <div>
              <Label>{force.label}</Label>
              <p className="text-sm text-muted-foreground">{force.description}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm w-16">Low</span>
              <Slider
                value={[data[`${force.key}Score`] || 5]}
                onValueChange={(value) => updateField(`${force.key}Score`, value[0])}
                max={10}
                step={1}
                className="flex-1"
              />
              <span className="text-sm w-16 text-right">High</span>
              <span className="text-lg font-semibold w-12 text-center">
                {data[`${force.key}Score`] || 5}/10
              </span>
            </div>
            <Textarea
              placeholder={`Describe the ${force.label.toLowerCase()} in your industry`}
              value={data[force.key] || ""}
              onChange={(e) => updateField(force.key, e.target.value)}
              rows={3}
            />
          </div>
        ))}
      </div>
    </Card>
  );
};

export default PortersFiveForces;
