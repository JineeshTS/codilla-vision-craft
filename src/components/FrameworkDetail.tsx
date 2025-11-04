import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PHASE_STRUCTURES } from "@/config/phaseStructure";
import { Sparkles, CheckCircle2, Clock, Coins } from "lucide-react";

export const FrameworkDetail = () => {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4 px-2">
            Deep Dive into the <span className="gradient-text">Idea to App Framework</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-3xl mx-auto px-4">
            Each phase is broken down into specific tasks with AI-guided workflows.
            Expand any phase to see the detailed breakdown of activities and deliverables.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3 sm:space-y-4">
            {PHASE_STRUCTURES.map((phase) => (
              <AccordionItem
                key={phase.phaseNumber}
                value={`phase-${phase.phaseNumber}`}
                className="glass-card border-0 rounded-lg overflow-hidden"
              >
                <AccordionTrigger className="px-4 sm:px-6 py-3 sm:py-4 hover:no-underline hover:bg-primary/5">
                  <div className="flex items-center gap-3 sm:gap-4 text-left flex-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold text-base sm:text-lg">{phase.phaseNumber}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                        <h3 className="text-sm sm:text-base md:text-lg font-semibold">{phase.phaseName}</h3>
                        <Badge variant="outline" className="gap-1 border-primary/30 text-primary text-[10px] sm:text-xs">
                          <Sparkles className="w-2 h-2 sm:w-3 sm:h-3" />
                          AI
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          {phase.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Coins className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          {phase.totalTokens} tokens
                        </span>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className="pt-3 sm:pt-4 space-y-4 sm:space-y-6">
                    {/* Phase Description */}
                    <div>
                      <p className="text-muted-foreground mb-2 text-xs sm:text-sm">{phase.description}</p>
                      <div className="flex items-center gap-2 text-xs sm:text-sm flex-wrap">
                        <span className="font-medium text-foreground">Decision Gate:</span>
                        <Badge variant="secondary" className="text-[10px] sm:text-xs">{phase.decisionGate}</Badge>
                      </div>
                    </div>

                    {/* Tasks */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base">
                        <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                        Key Tasks & Deliverables
                      </h4>
                      <div className="grid gap-3">
                        {phase.tasks.map((task, index) => (
                          <Card key={task.id} className="bg-background/50">
                            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                              <div className="flex items-start justify-between gap-2 sm:gap-4 flex-col sm:flex-row">
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-sm sm:text-base flex items-center gap-2 flex-wrap">
                                    <span className="text-primary font-mono text-xs sm:text-sm">
                                      {phase.phaseNumber}.{index + 1}
                                    </span>
                                    <span className="break-words">{task.title}</span>
                                  </CardTitle>
                                  <CardDescription className="mt-1 text-xs sm:text-sm">
                                    {task.description}
                                  </CardDescription>
                                </div>
                                <Badge variant="outline" className="flex-shrink-0 text-[10px] sm:text-xs self-start">
                                  ~{task.estimatedTokens.toLocaleString()} tokens
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0 p-3 sm:p-6 sm:pt-0">
                              <div className="bg-muted/50 rounded-lg p-2 sm:p-3 text-xs sm:text-sm text-muted-foreground">
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
