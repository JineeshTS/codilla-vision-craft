import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Lightbulb, ArrowRight, Save } from "lucide-react";
import { Card } from "@/components/ui/card";

const NewIdea = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    problem_statement: "",
    target_audience: "",
    unique_value_proposition: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("ideas")
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          problem_statement: formData.problem_statement,
          target_audience: formData.target_audience,
          unique_value_proposition: formData.unique_value_proposition,
          status: "draft",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Draft saved!",
        description: "Your idea has been saved as a draft.",
      });

      navigate(`/ideas/${data.id}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error saving draft",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && (!formData.title || !formData.description)) {
      toast({
        variant: "destructive",
        title: "Required fields",
        description: "Please fill in title and description.",
      });
      return;
    }
    if (step < 3) setStep(step + 1);
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen cosmic-bg">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold gradient-text">Capture Your Idea</h1>
          </div>
          <p className="text-muted-foreground">
            Let's bring your vision to life through AI-powered validation
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full mx-1 ${
                  i <= step ? "bg-primary" : "bg-muted"
                } transition-colors`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Step {step} of 3
          </p>
        </div>

        <Card className="glass-panel p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Idea Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., AI-Powered Task Manager"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your idea in detail..."
                  rows={6}
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="problem">Problem Statement</Label>
                <Textarea
                  id="problem"
                  placeholder="What problem does your idea solve?"
                  rows={4}
                  value={formData.problem_statement}
                  onChange={(e) => handleChange("problem_statement", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience</Label>
                <Textarea
                  id="audience"
                  placeholder="Who will benefit from this solution?"
                  rows={4}
                  value={formData.target_audience}
                  onChange={(e) => handleChange("target_audience", e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="uvp">Unique Value Proposition</Label>
                <Textarea
                  id="uvp"
                  placeholder="What makes your idea unique and valuable?"
                  rows={6}
                  value={formData.unique_value_proposition}
                  onChange={(e) => handleChange("unique_value_proposition", e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={step === 1}
            >
              Previous
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={loading || !formData.title || !formData.description}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              {step < 3 ? (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSaveDraft} disabled={loading}>
                  Complete
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default NewIdea;