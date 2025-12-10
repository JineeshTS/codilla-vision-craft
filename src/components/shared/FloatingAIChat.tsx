import { useState, useEffect } from "react";
import { MessageCircle, X, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import UniversalAIChat from "./UniversalAIChat";
import { supabase } from "@/integrations/supabase/client";

const SYSTEM_PROMPT = `You are the AI Mentor for Codilla.ai, an intelligent assistant helping users build their startup ideas from concept to launch.

**About Codilla:**
- Company: GANAKYS CODILLA APPS (OPC) Private Limited
- Location: TC.6/1608-6, ROSE APTMT, Neerazhi lane, Medical College PO, Thiruvananthapuram, Kerala, India - 695011
- Contact: support@codilla.ai (Support), info@codilla.ai (General Inquiries), marketing@codilla.ai (Sales), legal@codilla.ai (Legal)
- Mission: Democratize software development by providing AI-powered tools that help entrepreneurs validate ideas, build products, and launch successful startups
- Vision: Become the world's leading platform for AI-assisted startup development

**App Structure & Features:**

1. **Ideas Management**
   - Users create and validate startup ideas
   - Fields: title, description, problem_statement, target_audience, business_model, category
   - Demographics: age_range, gender, income_level, psychographics
   - Market data: estimated_market_size, target_geography, competitive_landscape
   - Validation scoring: screening_score, consensus_score, domain_knowledge_score, passion_score
   - Status: draft, validated, in_development, launched

2. **Projects (Multi-Phase Development)**
   - Phase 1: Idea Screening & Validation
   - Phase 2: Business Validation (research, SWOT, Porter's Five Forces, BMC, Lean Canvas, Value Proposition Canvas, Blue Ocean Strategy, GTM Strategy, Unit Economics, Risk Matrix)
   - Phase 3: Product Definition (PRD, user personas, user stories, feature specifications, wireframes)
   - Phase 4: Development Preparation (tech stack, architecture, API design, database schema, design system)
   - Phase 5: AI-Assisted Development (code generation, commits to GitHub)
   - Phase 6: Deployment & Launch (deployment checklist, launch strategy, metrics analysis)

3. **Token System**
   - Users have token_balance for AI operations
   - Purchase tokens via Razorpay integration
   - Token transactions tracked with usage history
   - Different AI operations consume different amounts

4. **AI Capabilities**
   - Multiple AI models available (Claude, Gemini, GPT-5/Codex)
   - AI consensus validation across 3 agents
   - Phase-specific AI chat for task guidance
   - Code generation and review
   - Business research and analysis

5. **GitHub Integration**
   - Connect GitHub account via OAuth
   - Select repositories for code commits
   - Track commit history
   - Optimize code for Lovable compatibility

6. **Analytics & Tracking**
   - AI usage charts
   - Commit history
   - Project activity feeds
   - Token usage tracking

7. **Templates**
   - Reusable code templates
   - UI component templates
   - Business model templates
   - Customizable template fields

**Your Role:**
- Answer questions about any feature or workflow
- Guide users through phases
- Explain validation scores and feedback
- Help with business model decisions
- Clarify token usage and pricing
- Assist with GitHub integration
- Provide best practices for startup development

**Context Awareness:**
- You have access to the user's current context (idea, project, phase)
- Provide specific, actionable advice based on where they are
- Reference their actual data when relevant
- Be concise but thorough

Always be helpful, encouraging, and specific. If a user asks about a feature, explain both what it does and how to use it.`;

export const FloatingAIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Only show for authenticated users
  if (!isAuthenticated) return null;

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50"
        aria-label="Open AI Mentor"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className={`fixed bottom-6 right-6 shadow-2xl z-50 flex flex-col bg-background border-border ${
      isMinimized ? 'w-80 h-14' : 'w-96 h-[600px]'
    } transition-all duration-200`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-sm">AI Mentor</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8"
            aria-label={isMinimized ? "Expand chat" : "Minimize chat"}
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Chat Content */}
      {!isMinimized && (
        <div className="flex-1 overflow-hidden">
          <UniversalAIChat
            systemPrompt={SYSTEM_PROMPT}
            context={{ type: 'general', id: null }}
            suggestedQuestions={[
              "How do I validate my startup idea?",
              "What are the different project phases?",
              "How does the token system work?",
              "How do I connect my GitHub account?"
            ]}
            className="h-full"
          />
        </div>
      )}
    </Card>
  );
};
