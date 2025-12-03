import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import Navbar from "@/components/Navbar";
import { 
  FileText, Search, CheckCircle, Code, 
  Database, Shield, Users, Palette
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string;
  template_data: any;
  usage_count: number;
}

const TemplateSelection = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuthGuard();
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    if (isAuthenticated && projectId) {
      fetchProject();
      fetchTemplates();
    }
  }, [isAuthenticated, projectId]);

  const fetchProject = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single();

    if (data) setProjectName(data.name);
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .order("usage_count", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading templates",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(templates.map(t => t.category)));

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectTemplate = async (template: Template) => {
    try {
      // Update project with selected template
      const { error } = await supabase
        .from("projects")
        .update({ 
          selected_template_id: template.id,
          phase_5_completed_at: new Date().toISOString()
        })
        .eq("id", projectId);

      if (error) throw error;

      // Increment usage count
      await supabase
        .from("templates")
        .update({ usage_count: template.usage_count + 1 })
        .eq("id", template.id);

      toast({
        title: "Template Selected",
        description: `${template.name} will be used for development`,
      });

      // Navigate to template application page
      navigate(`/templates/${template.id}/apply?projectId=${projectId}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error selecting template",
        description: error.message,
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'authentication':
        return <Shield className="w-5 h-5" />;
      case 'admin':
        return <Users className="w-5 h-5" />;
      case 'full-stack':
        return <Code className="w-5 h-5" />;
      case 'database':
        return <Database className="w-5 h-5" />;
      case 'ui':
        return <Palette className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen cosmic-bg">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold gradient-text">Phase 5: Select Template</h1>
          </div>
          <p className="text-muted-foreground">
            Choose a template to jumpstart development for <span className="text-primary font-semibold">{projectName}</span>
          </p>
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => setSelectedCategory(null)}
              size="sm"
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                size="sm"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Card className="glass-panel p-12 text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No templates found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => {
              const features = template.template_data?.features || [];
              
              return (
                <Card key={template.id} className="glass-panel p-6 hover:border-primary/50 transition-all">
                  <div className="flex items-start gap-3 mb-4">
                    {getCategoryIcon(template.category)}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{template.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {template.description}
                  </p>

                  {features.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs text-muted-foreground mb-2">Includes:</div>
                      <div className="space-y-1">
                        {features.slice(0, 3).map((feature: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                        {features.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{features.length - 3} more features
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <span>Used {template.usage_count} times</span>
                  </div>

                  <Button 
                    onClick={() => handleSelectTemplate(template)}
                    className="w-full"
                  >
                    Select Template
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateSelection;