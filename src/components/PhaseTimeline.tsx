import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";

const phases = [
  {
    number: 1,
    name: "Idea Capture & Screening",
    duration: "30-60 min",
    tokens: "500-1,500",
    aiPowered: true,
  },
  {
    number: 2,
    name: "Validation & Research",
    duration: "1-2 weeks",
    tokens: "60,000",
    aiPowered: true,
  },
  {
    number: 3,
    name: "Product Definition",
    duration: "3-5 days",
    tokens: "40,000",
    aiPowered: true,
  },
  {
    number: 4,
    name: "Technical Planning",
    duration: "2-3 days",
    tokens: "30,000",
    aiPowered: true,
  },
  {
    number: 5,
    name: "Design & Prototype",
    duration: "1 week",
    tokens: "50,000",
    aiPowered: true,
  },
  {
    number: 6,
    name: "Development Preparation",
    duration: "1-2 days",
    tokens: "20,000",
    aiPowered: false,
  },
  {
    number: 7,
    name: "AI-Assisted Development",
    duration: "2-4 weeks",
    tokens: "200,000+",
    aiPowered: true,
  },
  {
    number: 8,
    name: "Launch Preparation",
    duration: "3-5 days",
    tokens: "30,000",
    aiPowered: true,
  },
  {
    number: 9,
    name: "Deployment & Go-Live",
    duration: "1-2 days",
    tokens: "15,000",
    aiPowered: true,
  },
  {
    number: 10,
    name: "Post-Launch Operations",
    duration: "Ongoing",
    tokens: "Variable",
    aiPowered: true,
  },
];

interface PhaseTimelineProps {
  currentPhase?: number;
}

export const PhaseTimeline = ({ currentPhase = 0 }: PhaseTimelineProps) => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            The <span className="gradient-text">10-Phase Framework</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A structured approach that takes you from idea to launch, with AI guidance at every step
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {phases.map((phase) => {
            const isCompleted = currentPhase > phase.number;
            const isCurrent = currentPhase === phase.number;
            const isPending = currentPhase < phase.number;

            return (
              <Card
                key={phase.number}
                className={`glass-card transition-all hover:scale-[1.02] ${
                  isCurrent ? "border-primary glow-primary" : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Phase indicator */}
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="w-8 h-8 text-ai-gemini" />
                      ) : isCurrent ? (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center animate-pulse-glow">
                          <span className="text-primary font-bold">{phase.number}</span>
                        </div>
                      ) : (
                        <Circle className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>

                    {/* Phase content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{phase.name}</h3>
                        {phase.aiPowered && (
                          <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
                            <Sparkles className="w-3 h-3" />
                            AI
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>⏱️ {phase.duration}</span>
                        <span>🪙 {phase.tokens} tokens</span>
                      </div>
                    </div>

                    {/* Status badge */}
                    {isCompleted && (
                      <Badge className="bg-ai-gemini/20 text-ai-gemini border-0">Completed</Badge>
                    )}
                    {isCurrent && (
                      <Badge className="bg-primary/20 text-primary border-0">In Progress</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
