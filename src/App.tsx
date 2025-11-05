import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";

// Eager load critical pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Lazy load other pages for code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Ideas = lazy(() => import("./pages/Ideas"));
const NewIdea = lazy(() => import("./pages/NewIdea"));
const IdeaDetail = lazy(() => import("./pages/IdeaDetail"));
const BusinessValidation = lazy(() => import("./pages/BusinessValidation"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const ProductDefinition = lazy(() => import("./pages/ProductDefinition"));
const Tokens = lazy(() => import("./pages/Tokens"));
const Templates = lazy(() => import("./pages/Templates"));
const TemplateApply = lazy(() => import("./pages/TemplateApply"));
const TemplateCustomizer = lazy(() => import("./pages/TemplateCustomizer"));
const Analytics = lazy(() => import("./pages/Analytics"));
const CodeIDE = lazy(() => import("./pages/CodeIDE"));
const PhaseDetail = lazy(() => import("./pages/PhaseDetail"));
const DevelopmentPrep = lazy(() => import("./pages/DevelopmentPrep"));
const AIAssistedDev = lazy(() => import("./pages/AIAssistedDev"));
const TemplateSelection = lazy(() => import("./pages/TemplateSelection"));
const Deployment = lazy(() => import("./pages/Deployment"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center cosmic-bg">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/reset-password" element={<ResetPassword />} />
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
            <Route path="/template/:templateId" element={<TemplateCustomizer />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/code-ide" element={<CodeIDE />} />
            <Route path="/deployment" element={<Deployment />} />
            <Route path="/projects/:projectId/template-selection" element={<TemplateSelection />} />
            <Route path="/projects/:projectId/development-prep" element={<DevelopmentPrep />} />
            <Route path="/projects/:projectId/ai-development" element={<AIAssistedDev />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/analytics" element={<Analytics />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
