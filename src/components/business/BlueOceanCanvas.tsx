import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BlueOceanCanvasProps {
  data?: any;
  onChange: (data: any) => void;
}

const BlueOceanCanvas = ({ data = {}, onChange }: BlueOceanCanvasProps) => {
  const updateField = (field: string, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <Card className="glass-panel p-6">
      <h2 className="text-2xl font-bold mb-6">Blue Ocean Strategy - Four Actions Framework</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4 bg-red-500/10 border-red-500/20">
          <Label className="text-red-400">Eliminate</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Which factors that the industry takes for granted should be eliminated?
          </p>
          <Textarea
            placeholder="List factors to eliminate completely"
            value={data.eliminate || ""}
            onChange={(e) => updateField("eliminate", e.target.value)}
            rows={6}
          />
        </Card>

        <Card className="p-4 bg-yellow-500/10 border-yellow-500/20">
          <Label className="text-yellow-400">Reduce</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Which factors should be reduced well below the industry standard?
          </p>
          <Textarea
            placeholder="List factors to reduce significantly"
            value={data.reduce || ""}
            onChange={(e) => updateField("reduce", e.target.value)}
            rows={6}
          />
        </Card>

        <Card className="p-4 bg-blue-500/10 border-blue-500/20">
          <Label className="text-blue-400">Raise</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Which factors should be raised well above the industry standard?
          </p>
          <Textarea
            placeholder="List factors to raise significantly"
            value={data.raise || ""}
            onChange={(e) => updateField("raise", e.target.value)}
            rows={6}
          />
        </Card>

        <Card className="p-4 bg-green-500/10 border-green-500/20">
          <Label className="text-green-400">Create</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Which factors should be created that the industry has never offered?
          </p>
          <Textarea
            placeholder="List factors to create from scratch"
            value={data.create || ""}
            onChange={(e) => updateField("create", e.target.value)}
            rows={6}
          />
        </Card>
      </div>

      <div className="mt-6">
        <Label>New Value Curve</Label>
        <Textarea
          placeholder="Describe how your new value curve differs from industry competitors"
          value={data.valueCurve || ""}
          onChange={(e) => updateField("valueCurve", e.target.value)}
          rows={4}
        />
      </div>
    </Card>
  );
};

export default BlueOceanCanvas;
