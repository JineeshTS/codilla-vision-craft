import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import PRDGenerator from "@/components/product/PRDGenerator";
import UserPersonas from "@/components/product/UserPersonas";
import FeatureSpecification from "@/components/product/FeatureSpecification";
import UserStories from "@/components/product/UserStories";
import { RequirementsChat } from "@/components/phases/RequirementsChat";

const ProductDefinition = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAuthenticated = useAuthGuard();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (isAuthenticated && id) {
      fetchProject();
    }
  }, [isAuthenticated, id]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*, ideas(*)")
        .eq("id", id)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading project",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-prd", {
        body: { projectId: id },
      });

      if (error) throw error;

      toast({
        title: "PRD Generated!",
        description: `Used ${data.tokensUsed} tokens`,
      });

      await fetchProject();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error.message,
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen cosmic-bg">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen cosmic-bg">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Product Definition</h1>
          <p className="text-muted-foreground">{project?.name}</p>
        </div>

        {!project?.prd_data?.features && (
          <Card className="glass-panel p-6 mb-8 text-center">
            <h3 className="text-xl font-semibold mb-4">Ready to Define Your Product?</h3>
            <p className="text-muted-foreground mb-6">
              AI will generate a comprehensive Product Requirements Document including features,
              user personas, and user stories.
            </p>
            <Button onClick={handleGenerate} disabled={generating} size="lg">
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating PRD...
                </>
              ) : (
                "Generate PRD (20,000 tokens)"
              )}
            </Button>
          </Card>
        )}

        {project?.prd_data?.features && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-8">
              <PRDGenerator data={project.prd_data} />
              <FeatureSpecification features={project.prd_data.features} />
              <UserPersonas personas={project.user_personas || []} />
              <UserStories stories={project.user_stories || []} />
            </div>

            <div className="lg:col-span-1">
              <RequirementsChat 
                ideaId={id!} 
                ideaTitle={project?.name || "Product Definition"} 
              />
            </div>
          </div>
        )}

        <div className="mt-8">
          <Button onClick={() => navigate(`/projects/${id}`)} variant="outline">
            Back to Project
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductDefinition;
