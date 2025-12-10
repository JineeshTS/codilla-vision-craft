import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import Navbar from "@/components/Navbar";
import { Layers, Search, Filter } from "lucide-react";
import { Pagination } from "@/components/shared/Pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string;
  preview_image_url: string | null;
  usage_count: number;
}

const ITEMS_PER_PAGE = 12;

const Templates = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuthGuard();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTemplates();
    }
  }, [isAuthenticated]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("ui_templates")
        .select("*")
        .eq("is_public", true)
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

  const categories = useMemo(() => [
    "all",
    ...Array.from(new Set(templates.map(t => t.category)))
  ], [templates]);

  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [templates, searchQuery, selectedCategory]);

  const totalPages = Math.ceil(filteredTemplates.length / ITEMS_PER_PAGE);
  const paginatedTemplates = filteredTemplates.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const handleUseTemplate = (templateId: string) => {
    navigate(`/template/${templateId}`);
  };

  return (
    <div className="min-h-screen cosmic-bg">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Layers className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold gradient-text">UI Template Library</h1>
          </div>
          <p className="text-muted-foreground">
            Pre-built, customizable components and layouts for your projects
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat === "all" ? "All Categories" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="glass-panel p-6 h-[300px] animate-pulse" />
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Card className="glass-panel p-12 text-center">
            <Layers className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No templates found</h3>
            <p className="text-muted-foreground">
              {searchQuery || selectedCategory !== "all" 
                ? "Try adjusting your search or filters"
                : "No templates available yet"}
            </p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedTemplates.map(template => (
                <Card key={template.id} className="glass-panel p-6 flex flex-col">
                  <div className="aspect-video bg-background/50 rounded-lg mb-4 flex items-center justify-center border border-muted">
                    {template.preview_image_url ? (
                      <img 
                        src={template.preview_image_url} 
                        alt={template.name}
                        className="w-full h-full object-cover rounded-lg"
                        loading="lazy"
                      />
                    ) : (
                      <Layers className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">{template.name}</h3>
                    <Badge variant="secondary">{template.category}</Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4 flex-1">
                    {template.description || "No description available"}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {template.usage_count} uses
                    </span>
                    <Button 
                      onClick={() => handleUseTemplate(template.id)}
                      size="sm"
                    >
                      Use Template
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              className="mt-8"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Templates;
