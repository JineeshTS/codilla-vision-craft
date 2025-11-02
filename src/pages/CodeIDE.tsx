import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import CodeGenerator from "@/components/CodeGenerator";
import { Card } from "@/components/ui/card";
import { Code, Sparkles } from "lucide-react";

const CodeIDE = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthGuard();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUser();
    }
  }, [isAuthenticated]);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  return (
    <div className="min-h-screen cosmic-bg">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Code className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold gradient-text">AI Development IDE</h1>
          </div>
          <p className="text-muted-foreground">
            Generate code with AI assistance powered by Lovable AI Gateway
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <CodeGenerator 
              context="Full-stack web application development"
              onCodeGenerated={(code) => {
                console.log("Generated code:", code);
              }}
            />

            <Card className="glass-panel p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">AI Models Available</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-ai-claude mt-2" />
                  <div>
                    <p className="font-medium text-ai-claude">Claude (Gemini 2.5 Pro)</p>
                    <p className="text-muted-foreground">Best for complex reasoning and architecture design</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-ai-gemini mt-2" />
                  <div>
                    <p className="font-medium text-ai-gemini">Gemini (Gemini 2.5 Flash)</p>
                    <p className="text-muted-foreground">Balanced performance for general development</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-ai-codex mt-2" />
                  <div>
                    <p className="font-medium text-ai-codex">Codex (Gemini 2.5 Flash Lite)</p>
                    <p className="text-muted-foreground">Fast code generation and simple tasks</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div>
            <Card className="glass-panel p-6">
              <h3 className="text-lg font-semibold mb-4">Code Examples</h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-background/50 rounded border border-muted">
                  <p className="font-medium mb-1">React Component</p>
                  <p className="text-muted-foreground">
                    "Create a responsive navbar component with mobile menu"
                  </p>
                </div>
                <div className="p-3 bg-background/50 rounded border border-muted">
                  <p className="font-medium mb-1">API Endpoint</p>
                  <p className="text-muted-foreground">
                    "Build a REST API endpoint for user authentication with JWT"
                  </p>
                </div>
                <div className="p-3 bg-background/50 rounded border border-muted">
                  <p className="font-medium mb-1">Database Schema</p>
                  <p className="text-muted-foreground">
                    "Design a Postgres schema for an e-commerce product catalog"
                  </p>
                </div>
                <div className="p-3 bg-background/50 rounded border border-muted">
                  <p className="font-medium mb-1">UI Component</p>
                  <p className="text-muted-foreground">
                    "Create a data table with sorting, filtering, and pagination"
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeIDE;