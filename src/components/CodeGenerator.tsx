import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Code, Sparkles, Copy, Check, Github } from "lucide-react";

interface CodeGeneratorProps {
  context?: string;
  model?: 'claude' | 'gemini' | 'codex';
  onCodeGenerated?: (code: string) => void;
}

const CodeGenerator = ({ context, model = 'gemini', onCodeGenerated }: CodeGeneratorProps) => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [optimizeForLovable, setOptimizeForLovable] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        variant: "destructive",
        title: "Empty prompt",
        description: "Please describe what code you want to generate.",
      });
      return;
    }

    setGenerating(true);
    setGeneratedCode("");

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-code`;
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ prompt, context, model, optimizeForLovable }),
      });

      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      }
      if (response.status === 402) {
        throw new Error("Payment required. Please add credits to your workspace.");
      }
      if (!response.ok || !response.body) {
        throw new Error("Failed to start code generation");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;
      let codeAccumulator = "";

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              codeAccumulator += content;
              setGeneratedCode(codeAccumulator);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (codeAccumulator && onCodeGenerated) {
        onCodeGenerated(codeAccumulator);
      }

      toast({
        title: "Code generated!",
        description: "Your code is ready to use.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: error.message,
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard.",
    });
  };

  const handleCommitToGitHub = async () => {
    if (!generatedCode) {
      toast({
        variant: "destructive",
        title: "No code to commit",
        description: "Please generate code first",
      });
      return;
    }

    try {
      setIsCommitting(true);

      // Get user's GitHub repo
      const { data: profile } = await supabase
        .from('profiles')
        .select('selected_github_repo, github_token')
        .single();

      if (!profile?.selected_github_repo || !profile?.github_token) {
        toast({
          variant: "destructive",
          title: "GitHub not configured",
          description: "Please connect GitHub and select a repository in your dashboard",
        });
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const fileName = prompt.trim().slice(0, 30).replace(/\s+/g, '') || 'Component';
      
      const response = await fetch(
        `https://numyfjzmrtvzclgyfkpx.supabase.co/functions/v1/commit-to-github`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            code: generatedCode,
            filePath: `src/components/${fileName}.tsx`,
            commitMessage: `AI Generated: ${prompt.slice(0, 50)}`,
            githubRepo: profile.selected_github_repo,
            githubToken: profile.github_token,
            projectId: null,
            phaseNumber: null,
            taskId: null,
            aiModel: model,
            optimizeForLovable
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      toast({
        title: "Committed to GitHub!",
        description: "Code has been committed to your repository",
      });

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Commit failed",
        description: error.message,
      });
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <Card className="glass-panel p-6">
      <div className="flex items-center gap-2 mb-4">
        <Code className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">AI Code Generator</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">
            Describe the code you need:
          </label>
          <Textarea
            placeholder="E.g., Create a React component for a user profile card with avatar, name, bio, and edit button..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            disabled={generating}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="lovable-optimize" 
            checked={optimizeForLovable}
            onCheckedChange={(checked) => setOptimizeForLovable(checked as boolean)}
          />
          <label
            htmlFor="lovable-optimize"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Optimize for Lovable.dev
          </label>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="flex-1"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {generating ? "Generating..." : "Generate Code"}
          </Button>
          
          {generatedCode && (
            <Button
              onClick={handleCommitToGitHub}
              disabled={isCommitting}
              variant="outline"
              className="flex-1"
            >
              <Github className="w-4 h-4 mr-2" />
              {isCommitting ? "Committing..." : "Commit to GitHub"}
            </Button>
          )}
        </div>

        {generatedCode && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Generated Code:</label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <pre className="bg-background/50 p-4 rounded-lg overflow-x-auto text-sm border border-muted">
              <code>{generatedCode}</code>
            </pre>
          </div>
        )}
      </div>
    </Card>
  );
};

export default CodeGenerator;