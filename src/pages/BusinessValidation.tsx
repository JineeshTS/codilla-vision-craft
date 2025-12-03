import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import BusinessModelCanvas from "@/components/business/BusinessModelCanvas";
import LeanCanvas from "@/components/business/LeanCanvas";
import ValuePropositionCanvas from "@/components/business/ValuePropositionCanvas";
import SWOTAnalysis from "@/components/business/SWOTAnalysis";
import PortersFiveForces from "@/components/business/PortersFiveForces";
import JobsToBeDone from "@/components/business/JobsToBeDone";
import BlueOceanCanvas from "@/components/business/BlueOceanCanvas";
import RiskMatrix from "@/components/business/RiskMatrix";
import GTMStrategy from "@/components/business/GTMStrategy";
import UnitEconomics from "@/components/business/UnitEconomics";

const BusinessValidation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuthGuard();
  const [idea, setIdea] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [businessData, setBusinessData] = useState<any>({});

  useEffect(() => {
    if (isAuthenticated && id) {
      fetchIdea();
    }
  }, [isAuthenticated, id]);

  const fetchIdea = async () => {
    try {
      const { data, error } = await supabase
        .from("ideas")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setIdea(data);
      setBusinessData(data.phase_2_data || {});
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading idea",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    setValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke("validate-phase-2", {
        body: { ideaId: id, businessData },
      });

      if (error) throw error;

      toast({
        title: "Validation Complete!",
        description: `Decision: ${data.decision.toUpperCase()}`,
      });

      await fetchIdea();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Validation Failed",
        description: error.message,
      });
    } finally {
      setValidating(false);
    }
  };

  const updateFramework = (framework: string, data: any) => {
    setBusinessData((prev: any) => ({ ...prev, [framework]: data }));
  };

  if (loading || isAuthenticated === null) {
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
          <h1 className="text-4xl font-bold gradient-text mb-2">Business Validation</h1>
          <p className="text-muted-foreground">{idea?.title}</p>
        </div>

        {idea?.phase_2_decision && (
          <Card className="glass-panel p-6 mb-8">
            <div className="flex items-center gap-4">
              {idea.phase_2_decision === "go" && <CheckCircle2 className="w-8 h-8 text-green-500" />}
              {idea.phase_2_decision === "pivot" && <AlertTriangle className="w-8 h-8 text-yellow-500" />}
              {idea.phase_2_decision === "kill" && <XCircle className="w-8 h-8 text-red-500" />}
              <div>
                <h3 className="text-xl font-semibold">
                  AI Decision: {idea.phase_2_decision.toUpperCase()}
                </h3>
                <p className="text-muted-foreground">
                  Business Validation Score: {idea.business_validation_score}/100
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Display auto-generated business models if available */}
        {idea?.business_models && Object.keys(idea.business_models).length > 0 && (
          <Card className="glass-panel p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold">📈 Auto-Generated Business Models</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  AI-generated frameworks based on your idea validation
                </p>
              </div>
              <Badge variant="secondary">AI Generated</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Review the AI-generated models below and customize them using the interactive canvases.
            </p>
          </Card>
        )}

        <div className="space-y-6">
          <div>
            <Tabs defaultValue="bmc" className="space-y-6">
              <TabsList className="grid grid-cols-5 lg:grid-cols-10">
                <TabsTrigger value="bmc">BMC</TabsTrigger>
                <TabsTrigger value="lean">Lean</TabsTrigger>
                <TabsTrigger value="value">Value Prop</TabsTrigger>
                <TabsTrigger value="swot">SWOT</TabsTrigger>
                <TabsTrigger value="porter">Porter's</TabsTrigger>
                <TabsTrigger value="jtbd">JTBD</TabsTrigger>
                <TabsTrigger value="blue">Blue Ocean</TabsTrigger>
                <TabsTrigger value="risk">Risk</TabsTrigger>
                <TabsTrigger value="gtm">GTM</TabsTrigger>
                <TabsTrigger value="unit">Unit Econ</TabsTrigger>
              </TabsList>

          <TabsContent value="bmc">
            <BusinessModelCanvas
              data={businessData.bmc || idea?.business_models?.businessModelCanvas}
              onChange={(data) => updateFramework("bmc", data)}
            />
          </TabsContent>

          <TabsContent value="lean">
            <LeanCanvas
              data={businessData.lean || idea?.business_models?.leanCanvas}
              onChange={(data) => updateFramework("lean", data)}
            />
          </TabsContent>

          <TabsContent value="value">
            <ValuePropositionCanvas
              data={businessData.value}
              onChange={(data) => updateFramework("value", data)}
            />
          </TabsContent>

          <TabsContent value="swot">
            <SWOTAnalysis
              data={businessData.swot || idea?.business_models?.swot}
              onChange={(data) => updateFramework("swot", data)}
            />
          </TabsContent>

          <TabsContent value="porter">
            <PortersFiveForces
              data={businessData.porter || idea?.business_models?.portersFiveForces}
              onChange={(data) => updateFramework("porter", data)}
            />
          </TabsContent>

          <TabsContent value="jtbd">
            <JobsToBeDone
              data={businessData.jtbd}
              onChange={(data) => updateFramework("jtbd", data)}
            />
          </TabsContent>

          <TabsContent value="blue">
            <BlueOceanCanvas
              data={businessData.blue || idea?.business_models?.blueOcean}
              onChange={(data) => updateFramework("blue", data)}
            />
          </TabsContent>

          <TabsContent value="risk">
            <RiskMatrix
              data={businessData.risk || idea?.business_models?.riskAssessment}
              onChange={(data) => updateFramework("risk", data)}
            />
          </TabsContent>

          <TabsContent value="gtm">
            <GTMStrategy
              data={businessData.gtm}
              onChange={(data) => updateFramework("gtm", data)}
            />
          </TabsContent>

              <TabsContent value="unit">
                <UnitEconomics
                  data={businessData.unit}
                  onChange={(data) => updateFramework("unit", data)}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <Button onClick={() => navigate(`/ideas/${id}`)} variant="outline">
            Back to Idea
          </Button>
          <Button onClick={handleValidate} disabled={validating} className="ml-auto">
            {validating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              "Submit for AI Validation"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BusinessValidation;
