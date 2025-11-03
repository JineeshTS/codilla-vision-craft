import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { sanitizeError, createErrorResponse } from "../_shared/error-handler.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const requestSchema = z.object({
  phaseId: z.string().uuid({ message: "Invalid phase ID format" }),
  userInput: z.string().min(1).max(5000, { message: "User input must be between 1 and 5000 characters" }),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const errorId = crypto.randomUUID();

  try {
    // Get authorization token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Authentication required', 401, corsHeaders, errorId);
    }

    const requestBody = await req.json();
    
    // Validate input
    const validation = requestSchema.safeParse(requestBody);
    if (!validation.success) {
      console.error('Input validation failed:', validation.error);
      return new Response(
        JSON.stringify({ error: 'Invalid input format', details: validation.error.issues }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { phaseId, userInput } = validation.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      return createErrorResponse('Service configuration error', 500, corsHeaders, errorId);
    }

    // Create client with user's token for authorization check
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return createErrorResponse('Authentication required', 401, corsHeaders, errorId);
    }

    console.log("Authenticated user:", user.id);

    // Check rate limit (20 phase validations per hour)
    const rateLimit = checkRateLimit(user.id, {
      limit: 20,
      windowMs: 60 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      console.log("Rate limit exceeded for user:", user.id);
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please try again later.",
          retryAfter: rateLimit.retryAfter,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(rateLimit.retryAfter),
            "X-RateLimit-Limit": "20",
            "X-RateLimit-Remaining": String(rateLimit.remaining),
            "X-RateLimit-Reset": new Date(rateLimit.resetAt).toISOString(),
          },
        }
      );
    }

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: phaseData, error: phaseError } = await serviceClient
      .from("phases")
      .select(`
        *,
        projects!inner (
          id,
          name,
          user_id,
          ideas!inner (
            title,
            description
          )
        )
      `)
      .eq("id", phaseId)
      .single();

    if (phaseError || !phaseData) {
      console.error("Error fetching phase:", phaseError);
      return createErrorResponse('Resource not found', 404, corsHeaders, errorId);
    }

    // Verify ownership
    if (phaseData.projects.user_id !== user.id) {
      return createErrorResponse('Access denied', 403, corsHeaders, errorId);
    }

    const phaseDescriptions: Record<number, string> = {
      1: "Concept & Planning Phase: Define requirements, create wireframes, plan architecture",
      2: "Foundation Phase: Set up project structure, implement core features, establish design system",
      3: "Implementation Phase: Build main functionality, integrate APIs, implement business logic",
      4: "Refinement Phase: Polish UI/UX, optimize performance, fix bugs",
      5: "Deployment Phase: Prepare for production, deploy to hosting, set up monitoring",
    };

    const validationPrompt = `
You are a development phase validator. Evaluate if this phase deliverable meets requirements.

Project: ${phaseData.projects.name}
Idea: ${phaseData.projects.ideas.title}
Phase ${phaseData.phase_number}: ${phaseData.phase_name}
Expected: ${phaseDescriptions[phaseData.phase_number]}

User's Submission:
${userInput}

Respond with ONLY a valid JSON object (no markdown, no code blocks):
{
  "score": <number 0-100>,
  "approved": <boolean>,
  "feedback": "<string>",
  "issues": ["<string>", ...],
  "recommendations": ["<string>", ...]
}`;

    // Get AI provider config
    const { data: aiConfig } = await serviceClient
      .from('system_config')
      .select('config_value')
      .eq('config_key', 'ai_providers')
      .single();

    const aiProvider = (aiConfig?.config_value as any)?.primary || 'openai';
    const aiApiKey = Deno.env.get(aiProvider === 'openai' ? 'OPENAI_API_KEY' : aiProvider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'GOOGLE_API_KEY') || LOVABLE_API_KEY || '';
    
    if (!aiApiKey) {
      throw new Error('AI provider API key not configured');
    }

    const callAI = async (agentName: string) => {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${aiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: "user", content: validationPrompt }],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        console.error(`${agentName} error:`, response.status);
        return createErrorResponse('AI service unavailable', 503, corsHeaders, errorId);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "{}";
      return JSON.parse(content);
    };

    const [claudeResult, geminiResult, codexResult] = await Promise.all([
      callAI("Claude"),
      callAI("Gemini"),
      callAI("Codex"),
    ]);

    const results = [
      { agent: "claude", ...claudeResult },
      { agent: "gemini", ...geminiResult },
      { agent: "codex", ...codexResult },
    ];

    const avgScore = Math.round(
      results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length
    );
    const approvedCount = results.filter(r => r.approved).length;
    const consensusReached = approvedCount >= 2;

    const tokensUsed = 100;

    const updateData: any = {
      claude_validation: results[0],
      gemini_validation: results[1],
      codex_validation: results[2],
      consensus_reached: consensusReached,
      tokens_spent: tokensUsed,
    };

    if (consensusReached) {
      updateData.status = "completed";
      updateData.completed_at = new Date().toISOString();
    }

    const { error: updateError } = await serviceClient
      .from("phases")
      .update(updateData)
      .eq("id", phaseId);

    if (updateError) {
      console.error("Error updating phase:", updateError);
      return createErrorResponse('Failed to save validation results', 500, corsHeaders, errorId);
    }

    if (consensusReached) {
      const totalPhases = 5;
      const progress = Math.round((phaseData.phase_number / totalPhases) * 100);

      await serviceClient
        .from("projects")
        .update({
          current_phase: Math.min(phaseData.phase_number + 1, totalPhases),
          progress_percentage: progress,
        })
        .eq("id", phaseData.projects.id);
    }

    console.log("✅ Validation complete! Consensus:", consensusReached);

    return new Response(
      JSON.stringify({
        success: true,
        consensus: consensusReached,
        avgScore,
        validations: results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in validate-phase function:", error);
    return createErrorResponse(error, 500, corsHeaders, errorId);
  }
});
