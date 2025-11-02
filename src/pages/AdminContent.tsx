import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, FileText, Trash2, Eye } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getIdeaStatusConfig, formatStatus } from "@/lib/formatters";
import type { IdeaStatus } from "@/lib/types";

interface Idea {
  id: string;
  title: string;
  description: string;
  status: string;
  consensus_score: number | null;
  created_at: string;
  user_email?: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  usage_count: number;
  is_public: boolean;
  created_at: string;
}

const AdminContent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useAuthGuard();

  useEffect(() => {
    checkAdminRole();
  }, []);

  const checkAdminRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!roleData || roleData.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel.",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    fetchContent();
  };

  const fetchContent = async () => {
    try {
      setLoading(true);

      // Fetch all ideas with user email
      const { data: ideasData, error: ideasError } = await supabase
        .from("ideas")
        .select(`
          *,
          profiles (email)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (ideasError) throw ideasError;

      const ideasWithEmail = ideasData.map((idea: any) => ({
        ...idea,
        user_email: idea.profiles?.email || "Unknown",
      }));

      setIdeas(ideasWithEmail);

      // Fetch all templates
      const { data: templatesData, error: templatesError } = await supabase
        .from("templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (templatesError) throw templatesError;

      setTemplates(templatesData || []);
    } catch (error) {
      console.error("Error fetching content:", error);
      toast({
        title: "Error",
        description: "Failed to load content.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewIdea = (idea: Idea) => {
    setSelectedIdea(idea);
    setDialogOpen(true);
  };

  const handleDeleteIdea = async (ideaId: string) => {
    if (!confirm("Are you sure you want to delete this idea? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase.from("ideas").delete().eq("id", ideaId);

      if (error) throw error;

      toast({
        title: "Idea Deleted",
        description: "The idea has been successfully deleted.",
      });

      fetchContent(); // Refresh list
    } catch (error) {
      console.error("Error deleting idea:", error);
      toast({
        title: "Error",
        description: "Failed to delete idea.",
        variant: "destructive",
      });
    }
  };

  const handleToggleTemplateVisibility = async (template: Template) => {
    try {
      const { error } = await supabase
        .from("templates")
        .update({ is_public: !template.is_public })
        .eq("id", template.id);

      if (error) throw error;

      toast({
        title: "Template Updated",
        description: `Template is now ${!template.is_public ? "public" : "private"}.`,
      });

      fetchContent(); // Refresh list
    } catch (error) {
      console.error("Error updating template:", error);
      toast({
        title: "Error",
        description: "Failed to update template.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase.from("templates").delete().eq("id", templateId);

      if (error) throw error;

      toast({
        title: "Template Deleted",
        description: "The template has been successfully deleted.",
      });

      fetchContent(); // Refresh list
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "Error",
        description: "Failed to delete template.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen cosmic-bg">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading content...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cosmic-bg">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Content Moderation</h1>
          <p className="text-muted-foreground">Review and manage ideas and templates</p>
        </div>

        <Tabs defaultValue="ideas" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="ideas" className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Ideas ({ideas.length})
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Templates ({templates.length})
            </TabsTrigger>
          </TabsList>

          {/* Ideas Tab */}
          <TabsContent value="ideas">
            <div className="grid grid-cols-1 gap-4">
              {ideas.length === 0 ? (
                <Card className="glass-panel p-8 text-center">
                  <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No ideas found.</p>
                </Card>
              ) : (
                ideas.map((idea) => (
                  <Card key={idea.id} className="glass-panel p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{idea.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {idea.description}
                        </p>
                        <div className="flex flex-wrap gap-2 items-center">
                          <Badge className={getIdeaStatusConfig(idea.status as IdeaStatus).bgColor}>
                            {formatStatus(idea.status)}
                          </Badge>
                          {idea.consensus_score !== null && (
                            <Badge variant="outline">Score: {idea.consensus_score}/100</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            by {idea.user_email}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(idea.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button variant="ghost" size="sm" onClick={() => handleViewIdea(idea)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteIdea(idea.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.length === 0 ? (
                <Card className="glass-panel p-8 text-center md:col-span-2">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No templates found.</p>
                </Card>
              ) : (
                templates.map((template) => (
                  <Card key={template.id} className="glass-panel p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-2">{template.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {template.description}
                      </p>
                      <div className="flex flex-wrap gap-2 items-center mb-4">
                        <Badge>{template.category}</Badge>
                        <Badge variant={template.is_public ? "default" : "secondary"}>
                          {template.is_public ? "Public" : "Private"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {template.usage_count} uses
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleTemplateVisibility(template)}
                        className="flex-1"
                      >
                        {template.is_public ? "Make Private" : "Make Public"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Idea Details Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="glass-panel max-w-2xl">
            <DialogHeader>
              <DialogTitle>Idea Details</DialogTitle>
              <DialogDescription>View complete idea information</DialogDescription>
            </DialogHeader>

            {selectedIdea && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-1">Title</h3>
                  <p>{selectedIdea.title}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Description</h3>
                  <p className="text-muted-foreground">{selectedIdea.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-1">Status</h3>
                    <Badge className={getIdeaStatusConfig(selectedIdea.status as IdeaStatus).bgColor}>
                      {formatStatus(selectedIdea.status)}
                    </Badge>
                  </div>
                  {selectedIdea.consensus_score !== null && (
                    <div>
                      <h3 className="font-semibold mb-1">Consensus Score</h3>
                      <p>{selectedIdea.consensus_score}/100</p>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Created By</h3>
                  <p className="text-muted-foreground">{selectedIdea.user_email}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Created At</h3>
                  <p className="text-muted-foreground">
                    {new Date(selectedIdea.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminContent;
