import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting: 10 Phase 2 validations per hour
    const rateLimitResult = checkRateLimit(user.id, {
      limit: 10,
      windowMs: 60 * 60 * 1000, // 1 hour
    });

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          retryAfter: rateLimitResult.retryAfter,
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { ideaId, businessData } = await req.json();

    if (!ideaId || !businessData) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch idea details
    const { data: idea, error: ideaError } = await supabase
      .from("ideas")
      .select("*")
      .eq("id", ideaId)
      .eq("user_id", user.id)
      .single();

    if (ideaError || !idea) {
      return new Response(
        JSON.stringify({ error: "Idea not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Comprehensive Phase 2 analysis prompt
    const systemPrompt = `You are an expert business analyst evaluating startup ideas. Analyze the business validation frameworks provided and give comprehensive scores and recommendations.

Your analysis should cover:
1. Business Model Canvas (BMC) - Score each of the 9 blocks (0-10 each)
2. Lean Canvas - Problem-Solution Fit, Product-Market Fit, Business Model Fit (0-10 each)
3. Value Proposition Canvas - Fit Score (0-100)
4. SWOT Analysis - List 3-5 items for each quadrant with strategic recommendations
5. Porter's Five Forces - Score each force (0-10), calculate industry attractiveness (0-50)
6. Jobs-to-Be-Done - Identify core functional job and success criteria
7. Blue Ocean Strategy - Identify what to Eliminate, Reduce, Raise, Create
8. Risk Assessment - Categorize risks by probability and impact
9. Go-to-Market Strategy - Market segmentation and channel recommendations
10. Unit Economics - Estimate LTV/CAC ratio and assess viability

Return a comprehensive business validation report with:
- Overall business viability score (0-120)
- Decision recommendation: "go", "pivot", or "kill"
- Detailed scores for each framework
- Key findings and action items
- Risk mitigation strategies`;

    const userPrompt = `Analyze this startup idea for Phase 2 Business Validation:

**Idea Details:**
Title: ${idea.title}
Description: ${idea.description}
Problem Statement: ${idea.problem_statement || "Not provided"}
Target Audience: ${idea.target_audience || "Not provided"}
Unique Value Proposition: ${idea.unique_value_proposition || "Not provided"}
Business Model: ${idea.business_model || "Not provided"}

**Business Data Provided:**
${JSON.stringify(businessData, null, 2)}

Provide a comprehensive business validation analysis with scores, recommendations, and a clear GO/PIVOT/KILL decision.`;

    // Get AI provider config
    const { data: aiConfig } = await supabase
      .from('system_config')
      .select('config_value')
      .eq('config_key', 'ai_providers')
      .single();

    const aiProvider = (aiConfig?.config_value as any)?.primary || 'openai';
    const aiApiKey = Deno.env.get(aiProvider === 'openai' ? 'OPENAI_API_KEY' : aiProvider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'GOOGLE_API_KEY') || LOVABLE_API_KEY || '';
    
    if (!aiApiKey) {
      throw new Error('AI provider API key not configured');
    }

    // Call AI for analysis
    const { callAI: aiCall } = await import("../_shared/ai-provider.ts");
    const aiResponse = await aiCall(
      {
        provider: aiProvider as "openai" | "anthropic" | "google",
        apiKey: aiApiKey,
        model: aiProvider === 'openai' ? 'gpt-4o-mini' : 'google/gemini-2.5-flash',
        temperature: 0.7,
      },
      [
        { role: "system" as const, content: systemPrompt },
        { role: "user" as const, content: userPrompt },
      ],
      false
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      throw new Error("Failed to analyze business validation");
    }

    const aiResult = await aiResponse.json();
    const analysis = aiResult.choices[0].message.content;

    // Calculate token usage (estimate)
    const tokensUsed = 8000; // Phase 2 comprehensive analysis

    // Parse AI response to extract scores (simplified - you may want more robust parsing)
    const overallScore = extractScore(analysis, "business viability score", 0, 120);
    const decision = extractDecision(analysis);

    // Update idea with Phase 2 data
    const { error: updateError } = await supabase
      .from("ideas")
      .update({
        phase_2_data: {
          ...businessData,
          analysis,
          analyzed_at: new Date().toISOString(),
        },
        business_validation_score: overallScore,
        phase_2_decision: decision,
        phase_2_completed_at: new Date().toISOString(),
        tokens_spent: (idea.tokens_spent || 0) + tokensUsed,
      })
      .eq("id", ideaId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Failed to update idea:", updateError);
      throw new Error("Failed to save validation results");
    }

    // Deduct tokens from user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("tokens_used")
      .eq("id", user.id)
      .single();

    await supabase
      .from("profiles")
      .update({ tokens_used: (profile?.tokens_used || 0) + tokensUsed })
      .eq("id", user.id);

    // Log token transaction
    await supabase
      .from("token_transactions")
      .insert({
        user_id: user.id,
        transaction_type: "usage",
        amount: -tokensUsed,
        balance_after: (profile?.tokens_used || 0) + tokensUsed,
        description: `Phase 2 Business Validation for: ${idea.title}`,
        metadata: { idea_id: ideaId, phase: 2 },
      });

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        overallScore,
        decision,
        tokensUsed,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper functions
function extractScore(text: string, keyword: string, min: number, max: number): number {
  const regex = new RegExp(`${keyword}[:\\s]+(\\d+)`, "i");
  const match = text.match(regex);
  if (match && match[1]) {
    const score = parseInt(match[1]);
    return Math.max(min, Math.min(max, score));
  }
  return Math.floor((min + max) / 2); // Default to middle if not found
}

function extractDecision(text: string): string {
  const lowerText = text.toLowerCase();
  if (lowerText.includes("decision:") || lowerText.includes("recommendation:")) {
    if (lowerText.includes('"go"') || lowerText.includes("go ahead") || lowerText.includes("proceed")) {
      return "go";
    } else if (lowerText.includes('"pivot"') || lowerText.includes("pivot")) {
      return "pivot";
    } else if (lowerText.includes('"kill"') || lowerText.includes("kill") || lowerText.includes("stop")) {
      return "kill";
    }
  }
  return "pivot"; // Default to pivot if unclear
}
