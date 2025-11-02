import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Shield, Zap, Target, TrendingUp, RefreshCw } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Validation Before Coding",
    description: "Save tokens and prevent failures by validating your idea thoroughly before writing a single line of code.",
    color: "text-ai-claude",
  },
  {
    icon: Sparkles,
    title: "Three-AI Consensus",
    description: "Claude generates, Gemini reviews, and Codex optimizes. Three minds are better than one.",
    color: "text-primary",
  },
  {
    icon: Zap,
    title: "80% Template-Based",
    description: "Leverage battle-tested templates for common features. Only build what's unique to your app.",
    color: "text-secondary",
  },
  {
    icon: Target,
    title: "Structured Framework",
    description: "Follow a proven 10-phase process used by successful founders worldwide.",
    color: "text-ai-gemini",
  },
  {
    icon: TrendingUp,
    title: "60-70% Success Rate",
    description: "Our structured approach achieves 6-7x higher success rate than unstructured development.",
    color: "text-ai-codex",
  },
  {
    icon: RefreshCw,
    title: "Token Economy",
    description: "Pay only for what you use. No subscriptions, no waste. Full transparency on costs.",
    color: "text-primary",
  },
];

export const Features = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Why <span className="gradient-text">Codilla.ai</span>?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Built for non-technical founders who want to build apps the right way
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="glass-card hover:scale-105 transition-transform animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
