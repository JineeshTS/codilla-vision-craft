import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Brain, Code, Zap } from "lucide-react";
import { Link } from "react-router-dom";

export const Hero = () => {
  const scrollToPhases = () => {
    const element = document.getElementById("phases-section");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Validation BEFORE Coding</span>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6">
            Transform Ideas into Apps
            <br />
            <span className="gradient-text">with AI Consensus</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto animate-fade-in animation-delay-200 px-4">
            Three AI agents guide you through a proven 10-phase framework.
            From idea validation to deployment, build your app the right way.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 glow-primary">
                Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-primary/30 hover:bg-primary/10"
              onClick={scrollToPhases}
              aria-label="Scroll to see how the 10-phase framework works"
            >
              See How It Works
            </Button>
          </div>

          {/* AI Agents showcase */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 max-w-3xl mx-auto animate-fade-in animation-delay-400">
            <div className="glass-card p-6 hover:scale-105 transition-transform" role="article" aria-label="Claude AI Agent">
              <div className="w-12 h-12 rounded-full bg-ai-claude/20 flex items-center justify-center mb-4 mx-auto" aria-hidden="true">
                <Code className="w-6 h-6 text-ai-claude" />
              </div>
              <h3 className="font-semibold mb-2">Claude</h3>
              <p className="text-sm text-muted-foreground">Generates initial code and architecture</p>
            </div>

            <div className="glass-card p-6 hover:scale-105 transition-transform" role="article" aria-label="Gemini AI Agent">
              <div className="w-12 h-12 rounded-full bg-ai-gemini/20 flex items-center justify-center mb-4 mx-auto" aria-hidden="true">
                <Brain className="w-6 h-6 text-ai-gemini" />
              </div>
              <h3 className="font-semibold mb-2">Gemini</h3>
              <p className="text-sm text-muted-foreground">Reviews and suggests improvements</p>
            </div>

            <div className="glass-card p-6 hover:scale-105 transition-transform" role="article" aria-label="Codex AI Agent">
              <div className="w-12 h-12 rounded-full bg-ai-codex/20 flex items-center justify-center mb-4 mx-auto" aria-hidden="true">
                <Zap className="w-6 h-6 text-ai-codex" />
              </div>
              <h3 className="font-semibold mb-2">Codex</h3>
              <p className="text-sm text-muted-foreground">Optimizes and finalizes the solution</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto mt-16 animate-fade-in animation-delay-500" role="region" aria-label="Platform Statistics">
            <div>
              <div className="text-2xl md:text-3xl font-bold gradient-text mb-2">60-70%</div>
              <div className="text-xs md:text-sm text-muted-foreground">Success Rate</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold gradient-text mb-2">80%</div>
              <div className="text-xs md:text-sm text-muted-foreground">Code from Templates</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold gradient-text mb-2">10</div>
              <div className="text-xs md:text-sm text-muted-foreground">Structured Phases</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
