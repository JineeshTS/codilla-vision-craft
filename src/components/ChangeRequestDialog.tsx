import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Loader2, AlertTriangle, CheckCircle2, 
  XCircle, FileText, AlertCircle 
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ChangeRequestDialogProps {
  projectId: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export const ChangeRequestDialog = ({ 
  projectId, 
  trigger,
  onSuccess 
}: ChangeRequestDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [analysis, setAnalysis] = useState<any>(null);
  const [step, setStep] = useState<'input' | 'analysis' | 'confirm'>('input');

  const handleAnalyze = async () => {
    if (!title || !description) {
      toast({
        title: "Missing Information",
        description: "Please provide both title and description",
        variant: "destructive"
      });
      return;
    }

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-change-impact', {
        body: { 
          projectId,
          changeDescription: `${title}\n\n${description}`,
          currentState: {} // Fetch current app state
        }
      });

      if (error) throw error;

      setAnalysis(data.analysis);
      setStep('analysis');
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('change_requests')
        .insert({
          project_id: projectId,
          user_id: user.id,
          title,
          description,
          priority,
          impact_analysis: JSON.stringify(analysis),
          affected_components: analysis?.affectedComponents || [],
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Change Request Submitted",
        description: "Your request will be reviewed and implemented",
      });

      setOpen(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setAnalysis(null);
    setStep('input');
  };

  const getImpactColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Request Change
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Change</DialogTitle>
          <DialogDescription>
            Describe your requested change. We'll analyze its impact before implementation.
          </DialogDescription>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Change Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief description of the change"
              />
            </div>

            <div>
              <Label htmlFor="description">Detailed Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what you want to change and why..."
                rows={6}
              />
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 'analysis' && analysis && (
          <div className="space-y-4">
            <Card className="p-4 border-primary/30">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <h4 className="font-semibold">Impact Analysis</h4>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Impact Level</div>
                  <Badge className={getImpactColor(analysis.impactLevel)}>
                    {analysis.impactLevel?.toUpperCase()}
                  </Badge>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground mb-1">Analysis</div>
                  <p className="text-sm">{analysis.analysis}</p>
                </div>

                {analysis.affectedComponents?.length > 0 && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Affected Components</div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.affectedComponents.map((comp: string, i: number) => (
                        <Badge key={i} variant="outline">{comp}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.risks?.length > 0 && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Risks</div>
                    <ul className="space-y-1">
                      {analysis.risks.map((risk: string, i: number) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5" />
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.recommendations?.length > 0 && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Recommendations</div>
                    <ul className="space-y-1">
                      {analysis.recommendations.map((rec: string, i: number) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Estimated Effort</div>
                    <div className="text-sm font-medium">{analysis.estimatedEffort}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Breaking Changes</div>
                    <Badge variant={analysis.breakingChanges ? "destructive" : "outline"}>
                      {analysis.breakingChanges ? "Yes" : "No"}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        <DialogFooter>
          {step === 'input' && (
            <Button onClick={handleAnalyze} disabled={analyzing}>
              {analyzing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Analyze Impact
            </Button>
          )}
          {step === 'analysis' && (
            <>
              <Button variant="outline" onClick={() => setStep('input')}>
                Back
              </Button>
              <Button onClick={handleSubmit}>
                Submit Change Request
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};