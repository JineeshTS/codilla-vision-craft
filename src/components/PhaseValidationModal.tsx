import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { AGENT_CONFIG } from "@/lib/constants";

interface ValidationResult {
  score: number;
  approved: boolean;
  feedback: string;
  issues?: string[];
  recommendations?: string[];
  strengths?: string[];
  concerns?: string[];
}

interface PhaseValidationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phaseNumber: number;
  phaseName: string;
  claudeValidation: ValidationResult | null;
  geminiValidation: ValidationResult | null;
  codexValidation: ValidationResult | null;
  consensusReached: boolean;
  avgScore: number;
  tokensSpent: number;
}

export const PhaseValidationModal = ({
  open,
  onOpenChange,
  phaseNumber,
  phaseName,
  claudeValidation,
  geminiValidation,
  codexValidation,
  consensusReached,
  avgScore,
  tokensSpent,
}: PhaseValidationModalProps) => {
  const agents = [
    { name: "claude", data: claudeValidation, config: AGENT_CONFIG.claude },
    { name: "gemini", data: geminiValidation, config: AGENT_CONFIG.gemini },
    { name: "codex", data: codexValidation, config: AGENT_CONFIG.codex },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-500/10";
    if (score >= 60) return "bg-yellow-500/10";
    return "bg-red-500/10";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Phase {phaseNumber} Validation Results
          </DialogTitle>
          <p className="text-muted-foreground">{phaseName}</p>
        </DialogHeader>

        {/* Overall Summary */}
        <Card className="glass-panel p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Consensus Result</h3>
              <div className="flex items-center gap-2">
                {consensusReached ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <Badge className="bg-green-500/20 text-green-400">
                      Consensus Reached
                    </Badge>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-400" />
                    <Badge className="bg-red-500/20 text-red-400">
                      Consensus Not Reached
                    </Badge>
                  </>
                )}
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Average Score</p>
              <p className={`text-4xl font-bold ${getScoreColor(avgScore)}`}>
                {avgScore}<span className="text-2xl">/100</span>
              </p>
              <Progress value={avgScore} className="w-32 h-2 mt-2" />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
            <div>
              <span className="font-medium">Tokens Used:</span> {tokensSpent}
            </div>
            <div>
              <span className="font-medium">Validators:</span> {agents.filter(a => a.data).length}/3 agents responded
            </div>
          </div>
        </Card>

        {/* Individual Agent Responses */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <Card
              key={agent.name}
              className={`glass-panel p-5 ${!agent.data ? "opacity-50" : ""}`}
            >
              {/* Agent Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{agent.config.icon}</span>
                  <div>
                    <h4 className={`font-semibold ${agent.config.color}`}>
                      {agent.config.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {agent.config.description.split(" - ")[1]}
                    </p>
                  </div>
                </div>
              </div>

              {agent.data ? (
                <>
                  {/* Score */}
                  <div className={`p-3 rounded-lg mb-4 ${getScoreBgColor(agent.data.score)}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Score</span>
                      <span className={`text-2xl font-bold ${getScoreColor(agent.data.score)}`}>
                        {agent.data.score}
                      </span>
                    </div>
                    <Progress value={agent.data.score} className="mt-2 h-1" />
                  </div>

                  {/* Verdict */}
                  <div className="mb-4">
                    <Badge
                      className={
                        agent.data.approved
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }
                    >
                      {agent.data.approved ? (
                        <><CheckCircle className="w-3 h-3 mr-1" /> Approved</>
                      ) : (
                        <><XCircle className="w-3 h-3 mr-1" /> Not Approved</>
                      )}
                    </Badge>
                  </div>

                  {/* Feedback */}
                  <div className="mb-4">
                    <h5 className="text-sm font-semibold mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Feedback
                    </h5>
                    <p className="text-sm text-muted-foreground">{agent.data.feedback}</p>
                  </div>

                  {/* Strengths */}
                  {agent.data.strengths && agent.data.strengths.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-semibold mb-2 flex items-center gap-1 text-green-400">
                        <TrendingUp className="w-4 h-4" />
                        Strengths
                      </h5>
                      <ul className="text-sm space-y-1">
                        {agent.data.strengths.map((strength, i) => (
                          <li key={i} className="text-muted-foreground flex items-start gap-2">
                            <span className="text-green-400 mt-0.5">•</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Concerns/Issues */}
                  {((agent.data.concerns && agent.data.concerns.length > 0) ||
                    (agent.data.issues && agent.data.issues.length > 0)) && (
                    <div className="mb-4">
                      <h5 className="text-sm font-semibold mb-2 flex items-center gap-1 text-red-400">
                        <TrendingDown className="w-4 h-4" />
                        {agent.data.concerns ? "Concerns" : "Issues"}
                      </h5>
                      <ul className="text-sm space-y-1">
                        {(agent.data.concerns || agent.data.issues)?.map((item, i) => (
                          <li key={i} className="text-muted-foreground flex items-start gap-2">
                            <span className="text-red-400 mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {agent.data.recommendations && agent.data.recommendations.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold mb-2 flex items-center gap-1 text-blue-400">
                        💡 Recommendations
                      </h5>
                      <ul className="text-sm space-y-1">
                        {agent.data.recommendations.map((rec, i) => (
                          <li key={i} className="text-muted-foreground flex items-start gap-2">
                            <span className="text-blue-400 mt-0.5">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No response from {agent.config.name}</p>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Consensus Explanation */}
        <Card className="glass-panel p-4 mt-6 bg-primary/5 border-primary/20">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <span>ℹ️</span>
            How Consensus Works
          </h4>
          <p className="text-sm text-muted-foreground">
            Codilla.ai uses multi-agent consensus with 3 AI models (Claude, Gemini, and GPT-4o).
            At least <strong>2 out of 3 agents must approve</strong> for consensus to be reached.
            Each agent independently evaluates your deliverable and provides a score, verdict, and detailed feedback.
          </p>
        </Card>
      </DialogContent>
    </Dialog>
  );
};
