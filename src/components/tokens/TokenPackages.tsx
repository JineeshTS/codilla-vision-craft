import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";

interface TokenPackage {
  id: string;
  name: string;
  tokens: number;
  price: number;
  popular?: boolean;
  features: string[];
}

const packages: TokenPackage[] = [
  {
    id: "starter",
    name: "Starter",
    tokens: 10000,
    price: 499,
    features: [
      "10,000 AI tokens",
      "~3-4 complete ideas",
      "Phase 1-3 validation",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tokens: 50000,
    price: 1999,
    popular: true,
    features: [
      "50,000 AI tokens",
      "~15-18 complete ideas",
      "All 10 phases access",
      "Priority support",
      "Code generation",
    ],
  },
  {
    id: "business",
    name: "Business",
    tokens: 150000,
    price: 4999,
    features: [
      "150,000 AI tokens",
      "~45-50 complete ideas",
      "All 10 phases access",
      "Priority support",
      "Advanced code generation",
      "Custom templates",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tokens: 500000,
    price: 14999,
    features: [
      "500,000 AI tokens",
      "~150+ complete ideas",
      "All 10 phases access",
      "24/7 premium support",
      "Advanced code generation",
      "Custom templates",
      "Dedicated account manager",
    ],
  },
];

interface TokenPackagesProps {
  onSelectPackage: (pkg: TokenPackage) => void;
}

const TokenPackages = ({ onSelectPackage }: TokenPackagesProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {packages.map((pkg) => (
        <Card
          key={pkg.id}
          className={`relative p-6 border-2 transition-all hover:shadow-lg ${
            pkg.popular
              ? "border-primary bg-gradient-to-br from-primary/5 to-background"
              : "border-border"
          }`}
        >
          {pkg.popular && (
            <Badge className="absolute -top-3 right-6 bg-primary text-primary-foreground">
              <Sparkles className="w-3 h-3 mr-1" />
              Most Popular
            </Badge>
          )}

          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold">{pkg.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold">₹{pkg.price}</span>
                <span className="text-sm text-muted-foreground">one-time</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {pkg.tokens.toLocaleString()} tokens
              </p>
            </div>

            <ul className="space-y-2">
              {pkg.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={() => onSelectPackage(pkg)}
              className="w-full"
              variant={pkg.popular ? "default" : "outline"}
            >
              Purchase {pkg.name}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default TokenPackages;
