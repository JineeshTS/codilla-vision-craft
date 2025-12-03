import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import Navbar from "@/components/Navbar";
import { CheckCircle2, Code2, Database, FileCode, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  template_data: any;
}

const TemplateApply = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuthGuard();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [setupSql, setSetupSql] = useState("");
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (isAuthenticated && templateId) {
      fetchTemplate();
    }
  }, [isAuthenticated, templateId]);

  const fetchTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (error) throw error;
      setTemplate(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading template",
        description: error.message,
      });
      navigate("/templates");
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = async () => {
    if (!template) return;

    setApplying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `https://numyfjzmrtvzclgyfkpx.supabase.co/functions/v1/apply-template`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ templateId: template.id }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to apply template");
      }

      setSetupSql(result.setupSql);
      setCurrentStep(2);

      toast({
        title: "Template prepared!",
        description: "Review the setup instructions below.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error applying template",
        description: error.message,
      });
    } finally {
      setApplying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "SQL copied to clipboard",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen cosmic-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!template) return null;

  const templateData = template.template_data;

  return (
    <div className="min-h-screen cosmic-bg">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">
            Apply Template: {template.name}
          </h1>
          <p className="text-muted-foreground">{template.description}</p>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                1
              </div>
              <span className="text-sm font-medium">Review</span>
            </div>
            <div className="flex-1 h-0.5 bg-muted" />
            <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                2
              </div>
              <span className="text-sm font-medium">Setup</span>
            </div>
            <div className="flex-1 h-0.5 bg-muted" />
            <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                3
              </div>
              <span className="text-sm font-medium">Complete</span>
            </div>
          </div>
        </div>

        {currentStep === 1 && (
          <div className="space-y-6">
            <Card className="glass-panel p-6">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-primary" />
                What's Included
              </h2>
              
              <Tabs defaultValue="features" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="features">Features</TabsTrigger>
                  <TabsTrigger value="database">Database</TabsTrigger>
                  <TabsTrigger value="components">Components</TabsTrigger>
                </TabsList>

                <TabsContent value="features" className="space-y-4 mt-4">
                  {templateData.features?.map((feature: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium mb-1">{feature.name}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="database" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    {templateData.database?.tables?.map((table: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Database className="w-4 h-4 text-primary" />
                          <h3 className="font-medium">{table.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{table.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {table.columns?.slice(0, 5).map((col: any, colIdx: number) => (
                            <Badge key={colIdx} variant="outline" className="text-xs">
                              {col.name}
                            </Badge>
                          ))}
                          {table.columns?.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{table.columns.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="components" className="space-y-4 mt-4">
                  {templateData.components?.map((component: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                      <FileCode className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium mb-1">{component.name}</h3>
                        <p className="text-sm text-muted-foreground">{component.description}</p>
                      </div>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </Card>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This will create database tables and generate starter code for your project.
                Make sure you review all changes before proceeding.
              </AlertDescription>
            </Alert>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => navigate("/templates")}>
                Cancel
              </Button>
              <Button onClick={applyTemplate} disabled={applying}>
                {applying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Preparing...
                  </>
                ) : (
                  <>
                    Apply Template
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {currentStep === 2 && setupSql && (
          <div className="space-y-6">
            <Card className="glass-panel p-6">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Database className="w-6 h-6 text-primary" />
                Database Setup
              </h2>
              
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Copy and run the SQL below in your Supabase SQL Editor to set up the database schema.
                </AlertDescription>
              </Alert>

              <div className="relative">
                <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
                  <code>{setupSql}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(setupSql)}
                >
                  <Code2 className="w-4 h-4 mr-2" />
                  Copy SQL
                </Button>
              </div>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Back
              </Button>
              <Button onClick={() => {
                setCurrentStep(3);
                toast({
                  title: "Setup complete!",
                  description: "Your template has been applied successfully.",
                });
              }}>
                I've Run the SQL
              </Button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <Card className="glass-panel p-8 text-center">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="text-3xl font-bold mb-2">Template Applied!</h2>
            <p className="text-muted-foreground mb-6">
              Your project is ready. You can now start building with the template features.
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => navigate("/templates")}>
                Back to Templates
              </Button>
              <Button onClick={() => navigate("/projects")}>
                Go to Projects
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TemplateApply;
