import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Brain, Code, Zap } from "lucide-react";
import { Link } from "react-router-dom";

export const Hero = () => {
  console.log("Hero component rendering");
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full glass-card mb-6 sm:mb-8">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
            <span className="text-xs sm:text-sm font-medium">Validation BEFORE Coding</span>
          </div>

          {/* Main heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 px-2">
            Transform Ideas into Apps
            <br />
            <span className="gradient-text">with AI Consensus</span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-12 max-w-2xl mx-auto animate-fade-in px-4" style={{ animationDelay: "0.2s" }}>
            Three AI agents guide you through a proven 10-phase framework.
            From idea validation to deployment, build your app the right way.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-16 px-4">
            <Link to="/auth" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 glow-primary">
                Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary/30 hover:bg-primary/10">
              See How It Works
            </Button>
          </div>

          {/* AI Agents showcase */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 max-w-3xl mx-auto animate-fade-in px-4" style={{ animationDelay: "0.4s" }}>
            <div className="glass-card p-4 sm:p-6 hover:scale-105 transition-transform">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-ai-claude/20 flex items-center justify-center mb-3 sm:mb-4 mx-auto">
                <Code className="w-5 h-5 sm:w-6 sm:h-6 text-ai-claude" />
              </div>
              <h3 className="font-semibold mb-2 text-sm sm:text-base">Claude</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Generates initial code and architecture</p>
            </div>

            <div className="glass-card p-4 sm:p-6 hover:scale-105 transition-transform">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-ai-gemini/20 flex items-center justify-center mb-3 sm:mb-4 mx-auto">
                <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-ai-gemini" />
              </div>
              <h3 className="font-semibold mb-2 text-sm sm:text-base">Gemini</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Reviews and suggests improvements</p>
            </div>

            <div className="glass-card p-4 sm:p-6 hover:scale-105 transition-transform">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-ai-codex/20 flex items-center justify-center mb-3 sm:mb-4 mx-auto">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-ai-codex" />
              </div>
              <h3 className="font-semibold mb-2 text-sm sm:text-base">Codex</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Optimizes and finalizes the solution</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-8 max-w-2xl mx-auto mt-12 sm:mt-16 animate-fade-in px-4" style={{ animationDelay: "0.5s" }}>
            <div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text mb-1 sm:mb-2">60-70%</div>
              <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Success Rate</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text mb-1 sm:mb-2">80%</div>
              <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Code from Templates</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text mb-1 sm:mb-2">10</div>
              <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Structured Phases</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
