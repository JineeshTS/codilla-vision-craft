import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Ideas from "./pages/Ideas";
import NewIdea from "./pages/NewIdea";
import IdeaDetail from "./pages/IdeaDetail";
import BusinessValidation from "./pages/BusinessValidation";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import ProductDefinition from "./pages/ProductDefinition";
import Tokens from "./pages/Tokens";
import Templates from "./pages/Templates";
import TemplateApply from "./pages/TemplateApply";
import Analytics from "./pages/Analytics";
import CodeIDE from "./pages/CodeIDE";
import PhaseDetail from "./pages/PhaseDetail";
import DevelopmentPrep from "./pages/DevelopmentPrep";
import AIAssistedDev from "./pages/AIAssistedDev";
import TemplateSelection from "./pages/TemplateSelection";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import AdminSettings from "./pages/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ideas" element={<Ideas />} />
          <Route path="/ideas/new" element={<NewIdea />} />
          <Route path="/ideas/:id" element={<IdeaDetail />} />
          <Route path="/ideas/:id/business-validation" element={<BusinessValidation />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/projects/:id/product-definition" element={<ProductDefinition />} />
          <Route path="/projects/:projectId/phase/:phaseNumber" element={<PhaseDetail />} />
          <Route path="/tokens" element={<Tokens />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/templates/:templateId/apply" element={<TemplateApply />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/code-ide" element={<CodeIDE />} />
          <Route path="/projects/:projectId/template-selection" element={<TemplateSelection />} />
          <Route path="/projects/:projectId/development-prep" element={<DevelopmentPrep />} />
          <Route path="/projects/:projectId/ai-development" element={<AIAssistedDev />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
