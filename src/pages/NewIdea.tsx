import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Lightbulb, ArrowRight, Save, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { ideaSchema, sanitizeText } from "@/lib/validation";
import { z } from "zod";
import { Phase1Form } from "@/components/phases/Phase1Form";

const NewIdea = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    // Phase 1: Basic Information
    title: "",
    description: "",
    category: "",
    business_model: "",
    audience_size: "",
    inspiration_source: "",
    
    // Problem Statement
    problem_statement: "",
    target_audience: "",
    current_solutions: [] as any[],
    
    // Solution Overview
    unique_value_proposition: "",
    key_differentiator: "",
    expected_outcomes: {
      total_users: "",
      active_users: "",
      revenue: "",
      time_saved: "",
      money_saved: ""
    },
    
    // Personal Fit
    passion_score: 0,
    domain_knowledge_score: 0,
  });

  // Use centralized auth guard (UX-only, RLS provides actual security)
  useAuthGuard();

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveDraft = async () => {
    setErrors({});
    
    // Validate required fields
    try {
      ideaSchema.parse({
        title: formData.title,
        description: formData.description,
        problem_statement: formData.problem_statement || undefined,
        target_audience: formData.target_audience || undefined,
        unique_value_proposition: formData.unique_value_proposition || undefined,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Please check the form for errors.",
        });
        return;
      }
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Calculate screening score
      const screeningScore = Math.round((formData.passion_score + formData.domain_knowledge_score) / 2);
      
      // Sanitize inputs before saving
      const { data, error} = await supabase
        .from("ideas")
        .insert({
          user_id: user.id,
          title: sanitizeText(formData.title),
          description: sanitizeText(formData.description),
          category: formData.category || null,
          business_model: formData.business_model || null,
          audience_size: formData.audience_size || null,
          inspiration_source: formData.inspiration_source || null,
          problem_statement: formData.problem_statement ? sanitizeText(formData.problem_statement) : null,
          target_audience: formData.target_audience ? sanitizeText(formData.target_audience) : null,
          current_solutions: formData.current_solutions,
          unique_value_proposition: formData.unique_value_proposition ? sanitizeText(formData.unique_value_proposition) : null,
          key_differentiator: formData.key_differentiator || null,
          expected_outcomes: formData.expected_outcomes,
          passion_score: formData.passion_score,
          domain_knowledge_score: formData.domain_knowledge_score,
          screening_score: screeningScore,
          decision_status: screeningScore >= 7 ? 'go' : screeningScore >= 5 ? 'conditional' : 'no-go',
          current_phase: 1,
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
        description: error.message || "Failed to save draft. Please try again.",
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
    if (step < totalSteps) setStep(step + 1);
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
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full mx-1 ${
                  i + 1 <= step ? "bg-primary" : "bg-muted"
                } transition-colors`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Step {step} of {totalSteps}
          </p>
        </div>

        <Card className="glass-panel p-8">
          <Phase1Form
            formData={formData}
            errors={errors}
            onChange={handleChange}
            step={step}
          />

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
              {step < totalSteps ? (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSaveDraft} disabled={loading}>
                  Complete Phase 1
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