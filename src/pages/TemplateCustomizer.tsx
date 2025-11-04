import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, Github } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  component_code: string;
  tailwind_config?: any;
  customizable_fields?: any;
  dependencies?: any;
}

const TemplateCustomizer = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = useAuthGuard();
  const { toast } = useToast();
  
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [customizations, setCustomizations] = useState<Record<string, string>>({});
  const [previewCode, setPreviewCode] = useState("");

  useEffect(() => {
    if (isAuthenticated && templateId) {
      fetchTemplate();
    }
  }, [isAuthenticated, templateId]);

  const fetchTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from('ui_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;
      
      setTemplate(data);
      setPreviewCode(data.component_code || "");
      
      // Initialize customizations with defaults
      if (data.customizable_fields) {
        const defaults: Record<string, string> = {};
        Object.keys(data.customizable_fields).forEach(key => {
          defaults[key] = data.customizable_fields[key].default || "";
        });
        setCustomizations(defaults);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading template",
        description: error.message,
      });
      navigate('/templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomizationChange = (field: string, value: string) => {
    const newCustomizations = { ...customizations, [field]: value };
    setCustomizations(newCustomizations);
    
    // Update preview code with customizations
    let updatedCode = template?.component_code || "";
    Object.entries(newCustomizations).forEach(([key, val]) => {
      // Simple placeholder replacement
      updatedCode = updatedCode.replace(new RegExp(`{{${key}}}`, 'g'), val);
    });
    setPreviewCode(updatedCode);
  };

  const handleDownload = () => {
    const blob = new Blob([previewCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template?.name.replace(/\s+/g, '-')}.tsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded!",
      description: "Template code downloaded successfully.",
    });
  };

  const handleCommitToGithub = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('selected_github_repo')
        .single();

      if (!profile?.selected_github_repo) {
        toast({
          variant: "destructive",
          title: "No GitHub repo selected",
          description: "Please select a repository in your dashboard first.",
        });
        return;
      }

      // TODO: Implement GitHub commit functionality
      toast({
        title: "Coming soon!",
        description: "GitHub commit functionality will be available soon.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen cosmic-bg">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="glass-panel p-12 text-center">
            <p className="text-muted-foreground">Loading template...</p>
          </Card>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen cosmic-bg">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="glass-panel p-12 text-center">
            <p className="text-muted-foreground">Template not found</p>
            <Button onClick={() => navigate('/templates')} className="mt-4">
              Back to Templates
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cosmic-bg">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/templates')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Templates
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold gradient-text mb-2">{template.name}</h1>
          <p className="text-muted-foreground">{template.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="glass-panel p-6">
            <h3 className="text-lg font-semibold mb-4">Customization</h3>
            
            {template.customizable_fields && Object.keys(template.customizable_fields).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(template.customizable_fields).map(([key, config]: [string, any]) => (
                  <div key={key}>
                    <Label htmlFor={key} className="capitalize">
                      {config.label || key.replace(/_/g, ' ')}
                    </Label>
                    {config.type === 'color' ? (
                      <Input
                        id={key}
                        type="color"
                        value={customizations[key] || config.default}
                        onChange={(e) => handleCustomizationChange(key, e.target.value)}
                        className="h-10 mt-2"
                      />
                    ) : (
                      <Input
                        id={key}
                        type="text"
                        value={customizations[key] || config.default}
                        onChange={(e) => handleCustomizationChange(key, e.target.value)}
                        placeholder={config.placeholder || ""}
                        className="mt-2"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                This template has no customizable fields.
              </p>
            )}

            <div className="flex flex-col gap-2 mt-6">
              <Button onClick={handleDownload} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download Code
              </Button>
              <Button onClick={handleCommitToGithub} variant="outline" className="w-full">
                <Github className="w-4 h-4 mr-2" />
                Commit to GitHub
              </Button>
            </div>
          </Card>

          <Card className="glass-panel p-6 lg:col-span-2">
            <Tabs defaultValue="preview">
              <TabsList className="mb-4">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="code">Code</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview" className="mt-0">
                <div className="bg-background/50 rounded-lg border border-muted p-4 min-h-[400px]">
                  <p className="text-sm text-muted-foreground text-center">
                    Live preview will be rendered here
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="code" className="mt-0">
                <div className="bg-background/50 rounded-lg border border-muted p-4 overflow-auto max-h-[600px]">
                  <pre className="text-sm">
                    <code>{previewCode}</code>
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TemplateCustomizer;
