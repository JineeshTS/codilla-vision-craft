import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Rocket, Shield, TestTube } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { DeploymentChecklist } from "@/components/deployment/DeploymentChecklist";
import { TestRunner } from "@/components/testing/TestRunner";

const Deployment = () => {
  useAuthGuard();
  const [projectId] = useState("demo-project-id");

  return (
    <div className="min-h-screen cosmic-bg">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Rocket className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold gradient-text">Deployment & Testing</h1>
          </div>
          <p className="text-muted-foreground">
            Ensure your project is production-ready with automated checks and testing
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <Card className="glass-panel p-6">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Security</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              RLS policies, authentication, and data protection
            </p>
          </Card>

          <Card className="glass-panel p-6">
            <div className="flex items-center gap-3 mb-2">
              <TestTube className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Testing</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Automated test suite for critical functionality
            </p>
          </Card>

          <Card className="glass-panel p-6">
            <div className="flex items-center gap-3 mb-2">
              <Rocket className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Deployment</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Environment setup and production configuration
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DeploymentChecklist projectId={projectId} />
          <TestRunner />
        </div>
      </div>
    </div>
  );
};

export default Deployment;