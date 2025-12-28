import { Suspense, lazy } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { useActivityTracking } from "@/hooks/useActivityTracking";
import { useIsFeatureEnabled } from "@/hooks/useFeatureFlag";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { SessionTimeoutDialog } from "@/components/shared/SessionTimeoutDialog";
import { FloatingAIChat } from "@/components/shared/FloatingAIChat";
import { CookieConsentBanner } from "@/components/shared/CookieConsentBanner";
import { Footer } from "@/components/shared/Footer";
import MaintenancePage from "@/pages/MaintenancePage";

// Eager load critical pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Lazy load other pages for code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const About = lazy(() => import("./pages/About"));
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
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminContent = lazy(() => import("./pages/AdminContent"));
const AdminPayments = lazy(() => import("./pages/AdminPayments"));
const AdminAnnouncements = lazy(() => import("./pages/AdminAnnouncements"));
const AdminAuditLogs = lazy(() => import("./pages/AdminAuditLogs"));
const AdminApiKeys = lazy(() => import("./pages/AdminApiKeys"));
const AdminEmailTemplates = lazy(() => import("./pages/AdminEmailTemplates"));
const AdminFeatures = lazy(() => import("./pages/AdminFeatures"));

// Legal pages
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const Contact = lazy(() => import("./pages/Contact"));
const AdminEnquiries = lazy(() => import("./pages/AdminEnquiries"));

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

const AppContent = () => {
  // Check maintenance mode and admin status
  const { isEnabled: isMaintenanceMode, isLoading: isLoadingFlags } = useIsFeatureEnabled('maintenance_mode');
  const { data: isAdmin, isLoading: isLoadingAdmin } = useIsAdmin();

  // Enable session timeout (30 minutes of inactivity)
  const { showWarning, secondsRemaining, extendSession, logout } = useSessionTimeout({
    timeoutMinutes: 30,
    warningMinutes: 5,
  });

  // Track user activity for analytics
  useActivityTracking();

  // Show maintenance page if enabled (admins can bypass)
  if (!isLoadingFlags && !isLoadingAdmin && isMaintenanceMode && !isAdmin) {
    return <MaintenancePage />;
  }

  return (
    <>
      <SessionTimeoutDialog
        open={showWarning}
        secondsRemaining={secondsRemaining}
        onExtend={extendSession}
        onLogout={logout}
      />
      <div className="flex flex-col min-h-screen">
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
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/content" element={<AdminContent />} />
              <Route path="/admin/enquiries" element={<AdminEnquiries />} />
              <Route path="/admin/payments" element={<AdminPayments />} />
              <Route path="/admin/announcements" element={<AdminAnnouncements />} />
              <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
              <Route path="/admin/api-keys" element={<AdminApiKeys />} />
              <Route path="/admin/email-templates" element={<AdminEmailTemplates />} />
              <Route path="/admin/analytics" element={<Analytics />} />
              <Route path="/admin/features" element={<AdminFeatures />} />
              <Route path="/about" element={<About />} />
              {/* Legal & Contact pages */}
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              <Route path="/contact" element={<Contact />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
      <Footer />
      </div>
      <FloatingAIChat />
      <CookieConsentBanner />
    </>
  );
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
