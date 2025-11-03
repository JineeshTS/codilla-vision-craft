import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, AlertCircle, XCircle } from "lucide-react";

interface FeatureSpecificationProps {
  features: any;
}

const FeatureSpecification = ({ features }: FeatureSpecificationProps) => {
  const renderFeatureList = (title: string, items: string[], icon: any, color: string) => {
    if (!items || items.length === 0) return null;

    return (
      <Card className="p-4 bg-background/50">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <h3 className="font-semibold">{title}</h3>
        </div>
        <ul className="space-y-2">
          {items.map((item: string, index: number) => (
            <li key={index} className="flex items-start gap-2">
              <span className={`text-${color}-400 mt-1`}>•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Card>
    );
  };

  return (
    <Card className="glass-panel p-6">
      <h2 className="text-2xl font-bold mb-6">Feature Specification (MoSCoW)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderFeatureList(
          "Must Have",
          features?.mustHave,
          <CheckCircle2 className="w-5 h-5 text-green-400" />,
          "green"
        )}
        {renderFeatureList(
          "Should Have",
          features?.shouldHave,
          <Circle className="w-5 h-5 text-blue-400" />,
          "blue"
        )}
        {renderFeatureList(
          "Could Have",
          features?.couldHave,
          <AlertCircle className="w-5 h-5 text-yellow-400" />,
          "yellow"
        )}
        {renderFeatureList(
          "Won't Have (This Time)",
          features?.wontHave,
          <XCircle className="w-5 h-5 text-red-400" />,
          "red"
        )}
      </div>
    </Card>
  );
};

export default FeatureSpecification;
