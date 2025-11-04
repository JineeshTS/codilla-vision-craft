import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Zap, BookCheck, Sparkles, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CodeReviewProps {
  initialCode?: string;
  language?: string;
  model?: 'claude' | 'gemini' | 'codex';
}

interface ReviewResult {
  score?: number;
  security_issues?: Array<{
    severity: 'low' | 'medium' | 'high';
    issue: string;
    fix: string;
  }>;
  performance_tips?: string[];
  best_practices?: string[];
  improvements?: string[];
  raw_review?: string;
}

const CodeReview = ({ initialCode = "", language = "javascript", model = 'gemini' }: CodeReviewProps) => {
  const [code, setCode] = useState(initialCode);
  const [reviewing, setReviewing] = useState(false);
  const [review, setReview] = useState<ReviewResult | null>(null);

  const handleReview = async () => {
    if (!code.trim()) {
      toast.error("Please provide code to review");
      return;
    }

    setReviewing(true);
    setReview(null);

    try {
      const { data, error } = await supabase.functions.invoke('code-review', {
        body: { code, language, model }
      });

      if (error) throw error;

      setReview(data);
      toast.success("Code review completed!");
    } catch (error: any) {
      toast.error(error.message || "Failed to review code");
    } finally {
      setReviewing(false);
    }
  };

  const getSeverityColor = (severity: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-panel p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">AI Code Review</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Paste your code:
            </label>
            <Textarea
              placeholder="// Your code here..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={12}
              disabled={reviewing}
              className="font-mono text-sm"
            />
          </div>

          <Button
            onClick={handleReview}
            disabled={reviewing || !code.trim()}
            className="w-full"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {reviewing ? "Reviewing..." : "Review Code"}
          </Button>
        </div>
      </Card>

      {review && (
        <div className="space-y-4">
          {/* Score */}
          {review.score !== undefined && (
            <Card className="glass-panel p-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Code Quality Score</h4>
                <span className="text-2xl font-bold">{review.score}/10</span>
              </div>
              <Progress value={review.score * 10} className="h-2" />
            </Card>
          )}

          {/* Security Issues */}
          {review.security_issues && review.security_issues.length > 0 && (
            <Card className="glass-panel p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <h4 className="font-semibold">Security Issues</h4>
              </div>
              <div className="space-y-3">
                {review.security_issues.map((issue, idx) => (
                  <div key={idx} className="border-l-2 border-destructive pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getSeverityColor(issue.severity)}>
                        {issue.severity}
                      </Badge>
                    </div>
                    <p className="text-sm mb-2">{issue.issue}</p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Fix:</strong> {issue.fix}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Performance Tips */}
          {review.performance_tips && review.performance_tips.length > 0 && (
            <Card className="glass-panel p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-primary" />
                <h4 className="font-semibold">Performance Optimization</h4>
              </div>
              <ul className="space-y-2">
                {review.performance_tips.map((tip, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Best Practices */}
          {review.best_practices && review.best_practices.length > 0 && (
            <Card className="glass-panel p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookCheck className="w-5 h-5 text-primary" />
                <h4 className="font-semibold">Best Practices</h4>
              </div>
              <ul className="space-y-2">
                {review.best_practices.map((practice, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{practice}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Improvements */}
          {review.improvements && review.improvements.length > 0 && (
            <Card className="glass-panel p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h4 className="font-semibold">Suggested Improvements</h4>
              </div>
              <ul className="space-y-2">
                {review.improvements.map((improvement, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Raw Review (fallback) */}
          {review.raw_review && (
            <Card className="glass-panel p-6">
              <h4 className="font-semibold mb-4">Review</h4>
              <pre className="text-sm whitespace-pre-wrap">{review.raw_review}</pre>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default CodeReview;