import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PRDGeneratorProps {
  data: any;
}

const PRDGenerator = ({ data }: PRDGeneratorProps) => {
  return (
    <Card className="glass-panel p-6">
      <h2 className="text-2xl font-bold mb-6">Product Requirements Document</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-3">MVP Scope</h3>
          <div className="flex flex-wrap gap-2">
            {data.mvpScope?.map((feature: string, index: number) => (
              <Badge key={index} variant="default">
                {feature}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-3">Success Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.successMetrics && Object.entries(data.successMetrics).map(([key, value]) => (
              <Card key={key} className="p-4 bg-background/50">
                <p className="text-sm text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                <p className="text-lg font-semibold">{value as string}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PRDGenerator;
