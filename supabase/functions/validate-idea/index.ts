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

// Build the validation prompt
function buildValidationPrompt(idea: any): string {
  return `
You are a startup idea validator and business analyst. Conduct DEEP research and analysis on this startup idea.

Idea Title: ${idea.title}
Description: ${idea.description}
${idea.problem_statement ? `Problem: ${idea.problem_statement}` : ''}
${idea.target_audience ? `Target Audience: ${idea.target_audience}` : ''}
${idea.unique_value_proposition ? `Value Proposition: ${idea.unique_value_proposition}` : ''}
${idea.target_geography ? `Target Geography: ${idea.target_geography}` : ''}
${idea.estimated_market_size ? `Estimated Market Size: ${idea.estimated_market_size}` : ''}
${idea.demographics ? `Demographics: Age ${idea.demographics.age_range}, Gender: ${idea.demographics.gender}, Income: ${idea.demographics.income_level}` : ''}
${idea.psychographics ? `Psychographics: ${idea.psychographics}` : ''}
${idea.competitive_landscape ? `Competitive Landscape: ${idea.competitive_landscape}` : ''}

Conduct thorough McKinsey-level research and provide comprehensive analysis. Your research should be:
1. Data-driven with specific market insights
2. Competitive analysis with concrete comparisons
3. Risk assessment with mitigation strategies
4. Financial projections and unit economics
5. Strategic recommendations backed by evidence

Respond with ONLY a valid JSON object (no markdown, no code blocks) in this exact format:
{
  "score": <number between 0-100>,
  "approved": <boolean>,
  "feedback": "<detailed feedback string>",
  "strengths": ["<string>", ...],
  "concerns": ["<string>", ...],
  "recommendations": ["<string>", ...],
  "researchProcess": "<Detailed explanation of your research methodology>",
  "marketAnalysis": "<Deep market analysis with TAM/SAM/SOM breakdown>",
  "competitorInsights": "<Comprehensive analysis of top 5 competitors>",
  "swot": {
    "strengths": ["<specific strength>", ...],
    "weaknesses": ["<specific weakness>", ...],
    "opportunities": ["<market opportunity>", ...],
    "threats": ["<threat with impact>", ...]
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
    "problem": ["<problem>", ...],
    "solution": ["<solution>", ...],
    "keyMetrics": ["<metric>", ...],
    "uniqueValueProposition": "<statement>",
    "unfairAdvantage": "<advantage>",
    "channels": ["<channel>", ...],
    "customerSegments": ["<segment>", ...],
    "costStructure": ["<cost>", ...],
    "revenueStreams": ["<revenue>", ...]
  },
  "riskAssessment": {
    "high": ["<risk>", ...],
    "medium": ["<risk>", ...],
    "low": ["<risk>", ...]
  }
}`;
}

// Helper to sanitize and extract JSON robustly
function sanitizeToJson(raw: string): string {
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
  s = s.replace(/,(\s*[}\]])/g, '$1');
  s = s.replace(/\\(?![\\\/"bfnrtu]|u[0-9a-fA-F]{4})/g, '\\\\');
  s = s.replace(/[\u0000-\u0019]/g, '');
  return s;
}

// Call Claude (Anthropic API) - REAL IMPLEMENTATION
async function callClaude(prompt: string): Promise<any> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  console.log("🔵 Calling Claude (Anthropic)...");
  
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Claude API error:", response.status, errorText);
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text || "{}";
  const cleaned = sanitizeToJson(content);
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Claude JSON parse failed:", content.slice(0, 500));
    throw e;
  }
}

// Call Gemini (Google API) - REAL IMPLEMENTATION
async function callGemini(prompt: string): Promise<any> {
  const apiKey = Deno.env.get("GOOGLE_API_KEY");
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY not configured");
  }

  console.log("🟢 Calling Gemini (Google)...");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error:", response.status, errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  const cleaned = sanitizeToJson(content);

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Gemini JSON parse failed:", content.slice(0, 500));
    throw e;
  }
}

// Call GPT-5 (OpenAI API) - REAL IMPLEMENTATION
async function callGPT(prompt: string): Promise<any> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  console.log("🟣 Calling GPT (OpenAI)...");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      temperature: 0.7,
      max_tokens: 4096,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a startup idea validator. Always respond with valid JSON." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI API error:", response.status, errorText);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "{}";
  const cleaned = sanitizeToJson(content);

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("GPT JSON parse failed:", content.slice(0, 500));
    throw e;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const errorId = crypto.randomUUID();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return createErrorResponse("Authentication required", 401, corsHeaders, errorId);
    }

    const requestBody = await req.json();
    const validation = requestSchema.safeParse(requestBody);
    if (!validation.success) {
      console.error("Input validation failed:", validation.error);
      return new Response(
        JSON.stringify({ error: "Invalid input format", details: validation.error.issues }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { ideaId } = validation.data;

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      return createErrorResponse("Service configuration error", 500, corsHeaders, errorId);
    }

    // Verify at least 2 AI providers are configured
    const hasAnthropic = !!Deno.env.get("ANTHROPIC_API_KEY");
    const hasGoogle = !!Deno.env.get("GOOGLE_API_KEY");
    const hasOpenAI = !!Deno.env.get("OPENAI_API_KEY");
    
    const configuredProviders = [hasAnthropic, hasGoogle, hasOpenAI].filter(Boolean).length;
    if (configuredProviders < 2) {
      return createErrorResponse("At least 2 AI providers must be configured", 500, corsHeaders, errorId);
    }

    // Authenticate user
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await userClient.auth.getUser(token);
    if (userError || !user) {
      console.error("Auth failed:", userError);
      return createErrorResponse("Authentication required", 401, corsHeaders, errorId);
    }

    console.log("✅ Authenticated user:", user.id);

    // Rate limiting
    const rateLimit = checkRateLimit(user.id, { limit: 10, windowMs: 60 * 60 * 1000 });
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded", retryAfter: rateLimit.retryAfter }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(rateLimit.retryAfter),
          },
        }
      );
    }

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch idea
    const { data: idea, error: ideaError } = await serviceClient
      .from("ideas")
      .select("*")
      .eq("id", ideaId)
      .eq("user_id", user.id)
      .single();

    if (ideaError || !idea) {
      console.error("Error fetching idea:", ideaError);
      return createErrorResponse("Resource not found", 404, corsHeaders, errorId);
    }

    // Validate idea fields
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

    const prompt = buildValidationPrompt(idea);

    console.log("🚀 Starting REAL Multi-AI Consensus with Claude, Gemini, and GPT...");

    // Call all three AI providers in parallel - REAL MULTI-AI
    const aiCalls: Promise<{ agent: string; result: any }>[] = [];

    if (hasAnthropic) {
      aiCalls.push(
        callClaude(prompt)
          .then((result) => ({ agent: "claude", result }))
          .catch((e) => {
            console.error("Claude failed:", e.message);
            return { agent: "claude", result: null };
          })
      );
    }

    if (hasGoogle) {
      aiCalls.push(
        callGemini(prompt)
          .then((result) => ({ agent: "gemini", result }))
          .catch((e) => {
            console.error("Gemini failed:", e.message);
            return { agent: "gemini", result: null };
          })
      );
    }

    if (hasOpenAI) {
      aiCalls.push(
        callGPT(prompt)
          .then((result) => ({ agent: "gpt", result }))
          .catch((e) => {
            console.error("GPT failed:", e.message);
            return { agent: "gpt", result: null };
          })
      );
    }

    const aiResults = await Promise.all(aiCalls);

    // Filter successful results
    const successfulResults = aiResults
      .filter((r) => r.result !== null)
      .map((r) => ({ agent: r.agent, ...r.result }));

    if (successfulResults.length < 2) {
      console.error("Not enough AI responses. Got:", successfulResults.length);
      return createErrorResponse("AI consensus failed - not enough valid responses", 500, corsHeaders, errorId);
    }

    console.log(`✅ Received ${successfulResults.length} AI responses`);

    // Calculate consensus
    const avgScore = Math.round(
      successfulResults.reduce((sum, r) => sum + (r.score || 0), 0) / successfulResults.length
    );
    const approvedCount = successfulResults.filter((r) => r.approved).length;
    const consensusReached = approvedCount >= Math.ceil(successfulResults.length / 2);

    const tokensUsed = 150 * successfulResults.length;

    // Aggregate business models from the first successful result
    const aggregatedModels = {
      swot: successfulResults[0]?.swot,
      portersFiveForces: successfulResults[0]?.portersFiveForces,
      blueOcean: successfulResults[0]?.blueOcean,
      leanCanvas: successfulResults[0]?.leanCanvas,
      riskAssessment: successfulResults[0]?.riskAssessment,
    };

    // Update idea with validation results
    const { error: updateError } = await serviceClient
      .from("ideas")
      .update({
        status: "validated",
        consensus_score: avgScore,
        validation_summary: {
          consensus: consensusReached,
          avgScore,
          validations: successfulResults,
          aiProviders: successfulResults.map((r) => r.agent),
        },
        business_models: aggregatedModels,
        tokens_spent: tokensUsed,
      })
      .eq("id", ideaId);

    if (updateError) {
      console.error("Error updating idea:", updateError);
      return createErrorResponse("Failed to save validation results", 500, corsHeaders, errorId);
    }

    // Update token usage
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
        transaction_type: "consumption",
        amount: -tokensUsed,
        balance_after: profile.total_tokens - newTokensUsed,
        description: `Idea validation: ${idea.title}`,
      });
    }

    console.log(`✅ Multi-AI Consensus complete! Score: ${avgScore}, Providers: ${successfulResults.map((r) => r.agent).join(", ")}`);

    return new Response(
      JSON.stringify({
        success: true,
        consensus: consensusReached,
        avgScore,
        validations: successfulResults,
        aiProviders: successfulResults.map((r) => r.agent),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in validate-idea function:", error);
    return createErrorResponse(error, 500, corsHeaders, errorId);
  }
});
