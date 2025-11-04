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
    <section className="py-12 sm:py-16 md:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4 px-2">
            Why <span className="gradient-text">Codilla.ai</span>?
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto px-4">
            Built for non-technical founders who want to build apps the right way
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="glass-card hover:scale-105 transition-transform animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-3 sm:mb-4`}>
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
