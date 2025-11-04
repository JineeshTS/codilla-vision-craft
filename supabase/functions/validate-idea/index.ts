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
  ideaId: z.string().uuid({ message: "Invalid idea ID format" }),
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
    
    const validation = requestSchema.safeParse(requestBody);
    if (!validation.success) {
      console.error('Input validation failed:', validation.error);
      return new Response(
        JSON.stringify({ error: 'Invalid input format', details: validation.error.issues }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { ideaId } = validation.data;

    const googleApiKey = Deno.env.get("GOOGLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!googleApiKey) {
      return createErrorResponse('Google API key not configured', 500, corsHeaders, errorId);
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      return createErrorResponse('Service configuration error', 500, corsHeaders, errorId);
    }

    // Create client with user's token for authorization check
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await userClient.auth.getUser(token);
    if (userError || !user) {
      console.error('Auth failed in validate-idea:', userError);
      return createErrorResponse('Authentication required', 401, corsHeaders, errorId);
    }

    console.log("Authenticated user:", user.id);

    // Check rate limit (10 validations per hour)
    const rateLimit = checkRateLimit(user.id, {
      limit: 10,
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
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": String(rateLimit.remaining),
            "X-RateLimit-Reset": new Date(rateLimit.resetAt).toISOString(),
          },
        }
      );
    }

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: idea, error: ideaError } = await serviceClient
      .from("ideas")
      .select("*")
      .eq("id", ideaId)
      .eq("user_id", user.id)
      .single();

    if (ideaError || !idea) {
      console.error("Error fetching idea:", ideaError);
      return createErrorResponse('Resource not found', 404, corsHeaders, errorId);
    }

    if (!idea.title || idea.title.trim().length < 5) {
      return new Response(
        JSON.stringify({ error: "Title must be at least 5 characters long" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!idea.description || idea.description.trim().length < 20) {
      return new Response(
        JSON.stringify({ error: "Description must be at least 20 characters long" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validationPrompt = `
You are a startup idea validator and business analyst. Conduct DEEP research and analysis on this startup idea.

Idea Title: ${idea.title}
Description: ${idea.description}
${idea.problem_statement ? `Problem: ${idea.problem_statement}` : ''}
${idea.target_audience ? `Target Audience: ${idea.target_audience}` : ''}
${idea.unique_value_proposition ? `Value Proposition: ${idea.unique_value_proposition}` : ''}

Conduct thorough research and provide comprehensive analysis. Respond with ONLY a valid JSON object (no markdown, no code blocks) in this exact format:
{
  "score": <number between 0-100>,
  "approved": <boolean>,
  "feedback": "<detailed feedback string>",
  "strengths": ["<string>", ...],
  "concerns": ["<string>", ...],
  "recommendations": ["<string>", ...],
  "researchProcess": "<Detailed explanation of your research methodology and sources considered>",
  "marketAnalysis": "<Deep market analysis with trends, size, growth>",
  "competitorInsights": "<Analysis of existing solutions and competitive landscape>",
  "swot": {
    "strengths": ["<string>", ...],
    "weaknesses": ["<string>", ...],
    "opportunities": ["<string>", ...],
    "threats": ["<string>", ...]
  },
  "portersFiveForces": {
    "threatOfNewEntrants": "<analysis>",
    "bargainingPowerOfSuppliers": "<analysis>",
    "bargainingPowerOfBuyers": "<analysis>",
    "threatOfSubstitutes": "<analysis>",
    "competitiveRivalry": "<analysis>"
  },
  "blueOcean": {
    "eliminate": ["<factor>", ...],
    "reduce": ["<factor>", ...],
    "raise": ["<factor>", ...],
    "create": ["<factor>", ...]
  },
  "leanCanvas": {
    "problem": ["<string>", ...],
    "solution": ["<string>", ...],
    "keyMetrics": ["<string>", ...],
    "uniqueValueProposition": "<string>",
    "unfairAdvantage": "<string>",
    "channels": ["<string>", ...],
    "customerSegments": ["<string>", ...],
    "costStructure": ["<string>", ...],
    "revenueStreams": ["<string>", ...]
  },
  "riskAssessment": {
    "high": ["<risk>", ...],
    "medium": ["<risk>", ...],
    "low": ["<risk>", ...]
  }
}`;

    // Call Google Gemini API directly
    const callAIAgent = async (agentName: string) => {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${googleApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                role: 'user',
                parts: [{ text: validationPrompt }]
              }],
              generationConfig: {
                temperature: 0.7,
                responseMimeType: 'application/json'
              },
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`${agentName} error:`, response.status, errorText);
          throw new Error(`AI service error: ${response.status}`);
        }

        const data = await response.json();
        const content: string = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

        // Helper to sanitize and extract JSON robustly
        const sanitizeToJson = (raw: string) => {
          let s = raw.trim();
          if (s.startsWith('```json')) {
            s = s.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
          } else if (s.startsWith('```')) {
            s = s.replace(/```\s*/g, '').replace(/```\s*$/g, '').trim();
          }
          const start = s.indexOf('{');
          const end = s.lastIndexOf('}');
          if (start !== -1 && end !== -1) {
            s = s.slice(start, end + 1);
          }
          s = s.replace(/\r/g, '');
          // Remove trailing commas before object/array end
          s = s.replace(/,(\s*[}\]])/g, '$1');
          // Escape invalid backslashes not forming a valid JSON escape sequence
          s = s.replace(/\\(?![\\\/"bfnrtu]|u[0-9a-fA-F]{4})/g, '\\\\');
          // Remove unprintable control characters
          s = s.replace(/[\u0000-\u0019]/g, '');
          return s;
        };

        const cleaned = sanitizeToJson(content);
        try {
          return JSON.parse(cleaned);
        } catch (e) {
          console.error('JSON parse failed. Raw content (truncated):', content.slice(0, 600));
          console.error('Cleaned content (truncated):', cleaned.slice(0, 600));
          throw e;
        }
      } catch (error) {
        console.error(`${agentName} failed:`, error);
        throw error;
      }
    };

    const [claudeResult, geminiResult, codexResult] = await Promise.all([
      callAIAgent("Claude"),
      callAIAgent("Gemini"),
      callAIAgent("Codex"),
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

    const tokensUsed = 150;

    // Aggregate business models from all AIs
    const aggregatedModels = {
      swot: results[0].swot,
      portersFiveForces: results[0].portersFiveForces,
      blueOcean: results[0].blueOcean,
      leanCanvas: results[0].leanCanvas,
      riskAssessment: results[0].riskAssessment,
    };

    const { error: updateError } = await serviceClient
      .from("ideas")
      .update({
        status: "validated",
        consensus_score: avgScore,
        validation_summary: {
          consensus: consensusReached,
          avgScore,
          validations: results,
        },
        business_models: aggregatedModels,
        tokens_spent: tokensUsed,
      })
      .eq("id", ideaId);

    if (updateError) {
      console.error("Error updating idea:", updateError);
      return createErrorResponse('Failed to save validation results', 500, corsHeaders, errorId);
    }

    const { data: profile } = await serviceClient
      .from("profiles")
      .select("total_tokens, tokens_used")
      .eq("id", user.id)
      .single();

    if (profile) {
      const newTokensUsed = (profile.tokens_used || 0) + tokensUsed;
      await serviceClient
        .from("profiles")
        .update({ tokens_used: newTokensUsed })
        .eq("id", user.id);

      await serviceClient.from("token_transactions").insert({
        user_id: user.id,
        transaction_type: "usage",
        amount: -tokensUsed,
        balance_after: profile.total_tokens - newTokensUsed,
        description: `Idea validation: ${idea.title}`,
      });
    }

    console.log("✅ Consensus reached! Final average score:", avgScore);

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
    console.error("Error in validate-idea function:", error);
    return createErrorResponse(error, 500, corsHeaders, errorId);
  }
});
