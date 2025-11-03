import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import Navbar from "@/components/Navbar";
import { PhaseValidationModal } from "@/components/PhaseValidationModal";
import { Rocket, CheckCircle, Clock, AlertCircle, ExternalLink, GitBranch, Send, Loader2, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Project {
  id: string;
  name: string;
  current_phase: number;
  progress_percentage: number;
  repository_url: string | null;
  deployment_url: string | null;
  created_at: string;
}

interface Phase {
  id: string;
  phase_number: number;
  phase_name: string;
  status: string;
  consensus_reached: boolean;
  tokens_spent: number;
  started_at: string | null;
  completed_at: string | null;
  claude_validation: any;
  gemini_validation: any;
  codex_validation: any;
}

// Aligned with Codilla.ai 10-Phase Framework
const phaseNames = [
  "Idea Capture & Screening",
  "Validation & Research",
  "Product Definition",
  "Technical Planning",
  "Design & Prototype",
  "Development Preparation",
  "AI-Assisted Development",
  "Launch Preparation",
  "Deployment & Go-Live",
  "Post-Launch Operations",
];

// Phase-specific deliverable examples and guidance
const PHASE_EXAMPLES: Record<number, string> = {
  1: `Example for Phase 1 - Idea Capture & Screening:

**Problem Statement:** Students struggle to find affordable, quality textbooks for their courses. Current options are either expensive new books or unreliable used marketplaces.

**Target Audience:** College students aged 18-24, particularly those from middle-income families who are price-sensitive but value quality education materials.

**Unique Value Proposition:** A peer-to-peer textbook marketplace with verified student IDs, quality guarantees, and escrow payment protection. Students save 60% compared to bookstore prices while sellers get 40% more than buyback programs.

**Market Opportunity:** $14B US college textbook market, 20M college students, average student spends $1,200/year on textbooks.

**Initial Validation:** Surveyed 50 students - 92% interested, 78% would use it for their next semester.`,

  2: `Example for Phase 2 - Validation & Research:

**Market Research:**
- Analyzed 5 competitors (Chegg, Amazon Textbooks, BookFinder, Facebook Marketplace)
- Identified gap: No dedicated student-to-student platform with trust mechanisms
- TAM: $14B, SAM: $2B (online marketplaces), SOM: $100M (target 5% in 3 years)

**User Interviews:**
- Interviewed 30 students across 5 universities
- Key insight: Trust and speed are bigger concerns than price
- 85% would pay 2-3% fee for verified transactions and fast shipping

**Competitor Analysis:**
- Chegg: Rental model, expensive, doesn't let students own books
- Amazon: Generic marketplace, no student verification
- Our advantage: Student-only, verified IDs, escrow protection, campus pickup options

**Technical Feasibility:**
- Built MVP prototype in 2 weeks using React + Node.js + Stripe
- Tested with 20 beta users - 95% successfully completed transactions
- Core features validated: listing, search, messaging, payments`,

  3: `Example for Phase 3 - Product Definition:

**MVP Feature List:**
1. User Registration (student email verification)
2. Profile Management (university, major, courses)
3. Book Listing (ISBN scan, condition grading, pricing suggestions)
4. Search & Discovery (by course, ISBN, title, author)
5. Messaging System (buyer-seller communication)
6. Escrow Payment (Stripe integration)
7. Rating & Reviews (trust system)

**User Stories:**
- As a seller, I want to list my textbook in under 2 minutes so I can quickly earn money
- As a buyer, I want to see verified condition photos so I know what I'm getting
- As a student, I want to filter by my specific course so I find the right edition

**Acceptance Criteria:**
- Book listing takes <3 minutes on average
- Search results return in <1 second
- Payment processing completes in <30 seconds
- Mobile responsive (60% of users on mobile)

**Success Metrics:**
- 1,000 registered users in first semester
- 200 successful transactions in first 3 months
- 4.5+ star average rating
- <2% dispute rate`,

  4: `Example for Phase 4 - Technical Planning:

**Architecture:**
- Frontend: React 18 + TypeScript + Tailwind CSS
- Backend: Node.js + Express + PostgreSQL
- Auth: Supabase Auth with university email verification
- Payments: Stripe Connect for escrow
- Image Storage: Cloudinary for book photos
- Hosting: Vercel (frontend) + Railway (backend)

**Database Schema:**
- users (id, email, university, verified, created_at)
- books (id, seller_id, isbn, title, condition, price, images, status)
- transactions (id, book_id, buyer_id, seller_id, amount, status)
- messages (id, sender_id, receiver_id, book_id, content, read)
- reviews (id, transaction_id, rating, comment, created_at)

**API Endpoints:**
- POST /api/auth/register - Create account
- GET /api/books - Search books
- POST /api/books - List book
- POST /api/transactions - Create transaction
- POST /api/messages - Send message
- PUT /api/reviews - Submit review

**Development Workflow:**
- Git flow: main, develop, feature branches
- CI/CD: GitHub Actions for automated testing
- Code review: Required PR approvals
- Testing: Jest + React Testing Library + Playwright`,

  5: `Example for Phase 5 - Design & Prototype:

**Design System:**
- Primary color: #3B82F6 (education blue)
- Secondary: #10B981 (trust green)
- Typography: Inter for UI, Lora for headings
- Spacing: 8px grid system
- Breakpoints: 640px, 768px, 1024px, 1280px

**Key Screens Designed:**
1. Landing Page - Hero, features, testimonials, CTA
2. Book Listing Form - ISBN scanner, photo upload, condition selector
3. Search Results - Grid view, filters, sorting
4. Book Detail Page - Photos carousel, seller profile, buy button
5. Checkout Flow - Address, payment, confirmation
6. Dashboard - My listings, purchases, messages
7. Messaging Interface - Chat view, book context sidebar

**Prototype Link:** https://figma.com/proto/abc123 (interactive prototype)

**Usability Testing:**
- Tested with 15 students
- Average task completion rate: 94%
- SUS Score: 82/100 (Excellent)
- Key finding: Users wanted instant price suggestions based on market data`,

  6: `Example for Phase 6 - Development Preparation:

**Environment Setup:**
- Local: Node 18, PostgreSQL 15, pnpm
- Staging: Railway preview environments per PR
- Production: Railway production + Vercel

**Repository Structure:**
- /frontend/src (components, pages, lib)
- /backend/src (routes, controllers, models)
- /backend/tests
- /.github/workflows (CI/CD)

**CI/CD Pipeline:**
1. On PR: Lint, type-check, unit tests, integration tests
2. On merge to develop: Deploy to staging
3. On merge to main: Deploy to production
4. Automated database migrations via Railway

**Testing Framework:**
- Unit: Jest (85% coverage target)
- Integration: Supertest for API
- E2E: Playwright for critical paths
- Load: k6 for performance testing

**Code Standards:**
- ESLint + Prettier configured
- Husky pre-commit hooks
- Conventional commits
- TypeScript strict mode enabled`,

  7: `Example for Phase 7 - AI-Assisted Development:

**Implemented Features:**
✅ User authentication with university email verification
✅ Book listing with ISBN scanning (camera + manual)
✅ Image upload with Cloudinary (up to 5 photos per book)
✅ Search with filters (course, condition, price range, university)
✅ Real-time messaging with WebSocket
✅ Stripe escrow payment flow
✅ Rating and review system
✅ Email notifications for key events
✅ Mobile-responsive design (tested on iOS/Android)
✅ Admin dashboard for moderation

**Repository:** https://github.com/username/textbook-marketplace
**Staging:** https://staging.bookswap.app

**Key Metrics:**
- 45,000 lines of code written
- 250 components created
- 85% test coverage achieved
- 0 critical security vulnerabilities (Snyk scan)
- Lighthouse score: 95/100 performance

**AI Tools Used:**
- GitHub Copilot for boilerplate code
- ChatGPT for complex algorithms (escrow logic, price suggestions)
- Claude for code review and optimization`,

  8: `Example for Phase 8 - Launch Preparation:

**Testing Completed:**
✅ Unit tests: 387 tests passing
✅ Integration tests: 45 API endpoints tested
✅ E2E tests: 25 critical user flows automated
✅ Load testing: Handles 1,000 concurrent users
✅ Security audit: No critical/high vulnerabilities
✅ Accessibility: WCAG 2.1 AA compliant
✅ Browser testing: Chrome, Firefox, Safari, Edge
✅ Mobile testing: iOS 15+, Android 11+

**Performance Optimizations:**
- Code splitting: Initial bundle reduced to 150KB
- Image optimization: WebP format, lazy loading
- Database indexing: Query time <100ms average
- CDN caching: 95% cache hit rate
- API response time: P95 <500ms

**Documentation:**
- User guide created (10 pages)
- API documentation (Swagger)
- Admin manual
- Troubleshooting guide
- Video tutorials (5 videos)

**Pre-Launch Checklist:**
✅ Domain purchased: bookswap.app
✅ SSL certificate configured
✅ Email service configured (SendGrid)
✅ Analytics setup (Google Analytics + Mixpanel)
✅ Error tracking (Sentry)
✅ Uptime monitoring (UptimeRobot)
✅ Legal pages (Terms, Privacy, Refund Policy)`,

  9: `Example for Phase 9 - Deployment & Go-Live:

**Production Deployment:**
✅ Frontend deployed to Vercel: https://bookswap.app
✅ Backend deployed to Railway: https://api.bookswap.app
✅ Database: PostgreSQL on Railway (automated backups)
✅ CDN: Cloudflare configured
✅ DNS: bookswap.app pointing to production

**Monitoring Setup:**
✅ Error tracking: Sentry integrated (real-time alerts)
✅ Analytics: GA4 + Mixpanel tracking all events
✅ Uptime: UptimeRobot pinging every 5 minutes
✅ Performance: New Relic APM configured
✅ Logs: Centralized logging with Datadog

**Smoke Testing Results:**
✅ Home page loads in 1.2s
✅ User registration works
✅ Book listing works
✅ Search returns results
✅ Payment flow completes
✅ Email notifications sending
✅ Mobile app responsive

**Go-Live:**
- Launch date: Monday, Jan 15, 2024 at 9 AM EST
- Soft launch to 100 beta users first
- Full launch after 48 hours of monitoring
- Press release scheduled for launch day`,

  10: `Example for Phase 10 - Post-Launch Operations:

**Week 1 Metrics:**
- 847 registered users (target: 500) ✅
- 124 books listed (target: 100) ✅
- 43 transactions completed (target: 30) ✅
- $2,140 GMV (Gross Merchandise Value)
- Average transaction: $49.77
- 4.8/5 star average rating

**User Feedback:**
- #1 request: Add textbook rental option (82 votes)
- #2 request: Campus pickup scheduling (67 votes)
- #3 request: Price history charts (45 votes)

**Issues Addressed:**
✅ Fixed search bug with special characters (Day 2)
✅ Improved photo upload speed (Day 3)
✅ Added more universities to whitelist (Day 4)
✅ Fixed mobile payment flow (Day 5)

**Scaling Actions:**
- Database connection pool increased to 50
- CDN cache TTL optimized
- Background job queue for email sending
- Database indexes added for popular queries

**Next Iteration:**
- Feature: Textbook rental (2 weeks)
- Feature: Campus pickup scheduling (1 week)
- Marketing: Instagram campaign (ongoing)
- Growth: Partner with 3 campus bookstores`
};

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAuthenticated = useAuthGuard();
  const [project, setProject] = useState<Project | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [phaseInput, setPhaseInput] = useState("");
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjectData();
    }
  }, [id, isAuthenticated]);

  const fetchProjectData = async () => {
    try {
      const [projectRes, phasesRes] = await Promise.all([
        supabase.from("projects").select("*").eq("id", id).single(),
        supabase.from("phases").select("*").eq("project_id", id).order("phase_number"),
      ]);

      if (projectRes.error) throw projectRes.error;
      if (phasesRes.error) throw phasesRes.error;

      setProject(projectRes.data);
      setPhases(phasesRes.data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading project",
        description: error.message,
      });
      navigate("/projects");
    } finally {
      setLoading(false);
    }
  };

  const handleStartPhase = (phase: Phase) => {
    if (phase.status === "completed") {
      toast({
        title: "Phase Already Completed",
        description: "This phase has already been validated with consensus.",
      });
      return;
    }

    setSelectedPhase(phase);
    setPhaseInput("");
    setSubmissionDialogOpen(true);
  };

  const handleSubmitPhase = async () => {
    if (!selectedPhase || !phaseInput.trim()) {
      toast({
        variant: "destructive",
        title: "Input Required",
        description: "Please describe your phase deliverables.",
      });
      return;
    }

    if (phaseInput.trim().length < 50) {
      toast({
        variant: "destructive",
        title: "Too Short",
        description: "Please provide at least 50 characters describing your work.",
      });
      return;
    }

    setValidating(true);

    try {
      // Mark phase as in_progress
      await supabase
        .from("phases")
        .update({ status: "in_progress", started_at: new Date().toISOString() })
        .eq("id", selectedPhase.id);

      // Call validate-phase edge function
      const { data, error } = await supabase.functions.invoke("validate-phase", {
        body: {
          phaseId: selectedPhase.id,
          userInput: phaseInput.trim(),
        },
      });

      if (error) throw error;

      // Refresh project data to show updated phase status
      await fetchProjectData();

      setSubmissionDialogOpen(false);
      setPhaseInput("");

      if (data?.consensusReached) {
        toast({
          title: "Consensus Reached! 🎉",
          description: `Phase ${selectedPhase.phase_number} has been validated successfully. Average score: ${data.avgScore}/100`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Consensus Not Reached",
          description: `Phase validation did not reach consensus. Average score: ${data.avgScore}/100. Please review AI feedback and try again.`,
        });
      }
    } catch (error: any) {
      console.error("Phase validation error:", error);
      toast({
        variant: "destructive",
        title: "Validation Failed",
        description: error.message || "Failed to validate phase. Please try again.",
      });
    } finally {
      setValidating(false);
    }
  };

  const getPhaseIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "in_progress": return <Clock className="w-5 h-5 text-primary animate-pulse" />;
      case "failed": return <AlertCircle className="w-5 h-5 text-red-400" />;
      default: return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getPhaseStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/20 text-green-400";
      case "in_progress": return "bg-primary/20";
      case "failed": return "bg-red-500/20 text-red-400";
      default: return "bg-muted";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen cosmic-bg">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="min-h-screen cosmic-bg">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Rocket className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold gradient-text">{project.name}</h1>
          </div>
          <p className="text-muted-foreground">
            Started {new Date(project.created_at).toLocaleDateString()}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-panel p-6">
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text mb-2">
                Phase {project.current_phase}/10
              </div>
              <p className="text-sm text-muted-foreground">Current Progress</p>
            </div>
          </Card>

          <Card className="glass-panel p-6">
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text mb-2">
                {project.progress_percentage}%
              </div>
              <p className="text-sm text-muted-foreground">Overall Progress</p>
              <Progress value={project.progress_percentage} className="h-2 mt-2" />
            </div>
          </Card>

          <Card className="glass-panel p-6">
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text mb-2">
                {phases.filter(p => p.status === "completed").length}
              </div>
              <p className="text-sm text-muted-foreground">Phases Completed</p>
            </div>
          </Card>
        </div>

        {(project.repository_url || project.deployment_url) && (
          <Card className="glass-panel p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Project Links</h2>
            <div className="flex gap-4">
              {project.repository_url && (
                <Button
                  variant="outline"
                  onClick={() => window.open(project.repository_url!, "_blank")}
                >
                  <GitBranch className="w-4 h-4 mr-2" />
                  Repository
                  <ExternalLink className="w-3 h-3 ml-2" />
                </Button>
              )}
              {project.deployment_url && (
                <Button
                  variant="outline"
                  onClick={() => window.open(project.deployment_url!, "_blank")}
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  Live Demo
                  <ExternalLink className="w-3 h-3 ml-2" />
                </Button>
              )}
            </div>
          </Card>
        )}

        <Card className="glass-panel p-6">
          <h2 className="text-2xl font-semibold mb-6">Development Phases</h2>
          <div className="space-y-4">
            {phases.map((phase, index) => (
              <div
                key={phase.id}
                className={`p-6 rounded-lg border transition-all ${
                  phase.status === "in_progress"
                    ? "border-primary bg-primary/5"
                    : "border-muted bg-background/50"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getPhaseIcon(phase.status)}
                    <div>
                      <h3 className="font-semibold">
                        Phase {phase.phase_number}: {phaseNames[index] || phase.phase_name}
                      </h3>
                      {phase.started_at && (
                        <p className="text-xs text-muted-foreground">
                          Started {new Date(phase.started_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPhaseStatusColor(phase.status)}>
                      {phase.status.replace("_", " ")}
                    </Badge>
                    {phase.consensus_reached && (
                      <Badge className="bg-green-500/20 text-green-400">
                        Consensus ✓
                      </Badge>
                    )}
                  </div>
                </div>

                {phase.status === "completed" && phase.completed_at && (
                  <div className="text-sm text-muted-foreground">
                    Completed {new Date(phase.completed_at).toLocaleDateString()} • 
                    {" "}{phase.tokens_spent} tokens used
                  </div>
                )}

                {phase.status === "in_progress" && (
                  <div className="mt-4">
                    <Progress value={45} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      AI agents are working on this phase...
                    </p>
                  </div>
                )}

                {/* Phase Action Buttons */}
                <div className="mt-4 flex justify-end">
                  {phase.status === "pending" && (
                    <Button
                      size="sm"
                      onClick={() => handleStartPhase(phase)}
                      disabled={phase.phase_number !== project.current_phase}
                    >
                      {phase.phase_number === project.current_phase ? "Start Phase" : "Locked"}
                    </Button>
                  )}
                  {phase.status === "in_progress" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStartPhase(phase)}
                    >
                      Submit Deliverable
                    </Button>
                  )}
                  {phase.status === "completed" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        // TODO: Show phase validation details modal
                        toast({
                          title: "Phase Complete",
                          description: `This phase reached consensus and was completed successfully.`,
                        });
                      }}
                    >
                      View Details
                    </Button>
                  )}
                  {phase.status === "failed" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleStartPhase(phase)}
                    >
                      Retry Phase
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass-panel p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Phase Actions</h2>
          <p className="text-sm text-muted-foreground mb-4">
            The AI consensus system will guide each development phase with validation from Claude, Gemini, and Codex.
          </p>
          <div className="flex gap-4">
            <Button
              onClick={() => {
                const currentPhase = phases.find(p => p.phase_number === project.current_phase);
                if (currentPhase) {
                  handleStartPhase(currentPhase);
                } else {
                  toast({
                    variant: "destructive",
                    title: "Phase Not Found",
                    description: "Unable to find the current phase. Please refresh the page.",
                  });
                }
              }}
              disabled={project.current_phase > 10}
            >
              {project.current_phase > 10 ? "All Phases Complete" : "Start Next Phase"}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`/projects`)}
            >
              Back to Projects
            </Button>
          </div>
        </Card>
      </div>

      {/* Phase Submission Dialog */}
      <Dialog open={submissionDialogOpen} onOpenChange={setSubmissionDialogOpen}>
        <DialogContent className="glass-panel max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Submit Phase {selectedPhase?.phase_number}: {selectedPhase ? phaseNames[selectedPhase.phase_number - 1] : ""}
            </DialogTitle>
            <DialogDescription>
              Describe your deliverables for this phase. The AI consensus system will evaluate your submission
              using Claude, Gemini, and Codex. Minimum 50 characters required.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div>
              <Label htmlFor="phase-input">Phase Deliverables</Label>
              <Textarea
                id="phase-input"
                placeholder="Describe what you've accomplished in this phase...

Examples:
- For Phase 1 (Idea Capture): Describe your idea, problem statement, target audience, and value proposition
- For Phase 2 (Validation): Share market research findings, competitor analysis, and user feedback
- For Phase 3 (Product Definition): Detail features, user stories, MVP scope, and success metrics
- For Phase 4 (Technical Planning): Describe architecture, tech stack, database schema, and API design
- For Phase 7 (Development): Share code repository link, implemented features, and functionality demos
- For Phase 9 (Deployment): Provide production URL, deployment logs, and monitoring setup details"
                value={phaseInput}
                onChange={(e) => setPhaseInput(e.target.value)}
                rows={12}
                className="resize-none"
                disabled={validating}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {phaseInput.length} / 50 characters minimum
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSubmissionDialogOpen(false);
                setPhaseInput("");
              }}
              disabled={validating}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitPhase} disabled={validating || phaseInput.trim().length < 50}>
              {validating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validating with AI...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit for Validation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectDetail;