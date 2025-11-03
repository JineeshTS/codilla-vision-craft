import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PHASE_STRUCTURES } from "@/config/phaseStructure";
import { Sparkles, CheckCircle2, Clock, Coins } from "lucide-react";

export const FrameworkDetail = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Deep Dive into the <span className="gradient-text">Framework</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Each phase is broken down into specific tasks with AI-guided workflows.
            Expand any phase to see the detailed breakdown of activities and deliverables.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {PHASE_STRUCTURES.map((phase) => (
              <AccordionItem
                key={phase.phaseNumber}
                value={`phase-${phase.phaseNumber}`}
                className="glass-card border-0 rounded-lg overflow-hidden"
              >
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-primary/5">
                  <div className="flex items-center gap-4 text-left flex-1">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold text-lg">{phase.phaseNumber}</span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold">{phase.phaseName}</h3>
                        <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
                          <Sparkles className="w-3 h-3" />
                          AI
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {phase.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Coins className="w-3 h-3" />
                          {phase.totalTokens} tokens
                        </span>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="px-6 pb-6">
                  <div className="pt-4 space-y-6">
                    {/* Phase Description */}
                    <div>
                      <p className="text-muted-foreground mb-2">{phase.description}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-foreground">Decision Gate:</span>
                        <Badge variant="secondary">{phase.decisionGate}</Badge>
                      </div>
                    </div>

                    {/* Tasks */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        Key Tasks & Deliverables
                      </h4>
                      <div className="grid gap-3">
                        {phase.tasks.map((task, index) => (
                          <Card key={task.id} className="bg-background/50">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <CardTitle className="text-base flex items-center gap-2">
                                    <span className="text-primary font-mono text-sm">
                                      {phase.phaseNumber}.{index + 1}
                                    </span>
                                    {task.title}
                                  </CardTitle>
                                  <CardDescription className="mt-1">
                                    {task.description}
                                  </CardDescription>
                                </div>
                                <Badge variant="outline" className="flex-shrink-0 text-xs">
                                  ~{task.estimatedTokens.toLocaleString()} tokens
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">AI Assistance: </span>
                                {task.aiPromptContext}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
