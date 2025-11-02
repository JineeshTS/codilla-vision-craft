import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { FileText, Search, TrendingUp, Sparkles } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string;
  template_data: any;
  usage_count: number;
  created_at: string;
}

const Templates = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    fetchTemplates();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
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

  const handleUseTemplate = async (template: Template) => {
    try {
      // Increment usage count
      await supabase
        .from("templates")
        .update({ usage_count: template.usage_count + 1 })
        .eq("id", template.id);

      toast({
        title: "Template applied!",
        description: "Starting new idea with this template...",
      });

      // Navigate to new idea page with template data
      navigate("/ideas/new", { state: { template: template.template_data } });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error using template",
        description: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen cosmic-bg">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold gradient-text">Templates</h1>
          </div>
          <p className="text-muted-foreground">
            Jumpstart your ideas with proven templates
          </p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex gap-2 mb-8 flex-wrap">
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

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <Card className="glass-panel p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-semibold mb-2">No templates yet</h2>
            <p className="text-muted-foreground mb-6">
              Templates will appear here as they become available
            </p>
          </Card>
        ) : filteredTemplates.length === 0 ? (
          <Card className="glass-panel p-12 text-center">
            <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">No templates found</h2>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className="glass-panel p-6 cursor-pointer hover:scale-105 transition-transform"
              >
                <div className="flex items-start justify-between mb-4">
                  <Badge className="bg-primary/20">{template.category}</Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    <span>{template.usage_count}</span>
                  </div>
                </div>

                <h3 className="text-xl font-semibold mb-2">{template.name}</h3>
                
                {template.description && (
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                    {template.description}
                  </p>
                )}

                <Button
                  onClick={() => handleUseTemplate(template)}
                  className="w-full"
                  variant="outline"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Use Template
                </Button>
              </Card>
            ))}
          </div>
        )}

        <Card className="glass-panel p-8 mt-8">
          <div className="text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-semibold mb-2">Create Custom Template</h2>
            <p className="text-muted-foreground mb-6">
              Save your successful ideas as templates for future projects
            </p>
            <Button
              onClick={() => {
                toast({
                  title: "Coming soon!",
                  description: "Custom template creation will be available soon.",
                });
              }}
            >
              Create Template
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Templates;