import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ideaId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch the idea
    const { data: idea, error: ideaError } = await supabase
      .from("ideas")
      .select("*")
      .eq("id", ideaId)
      .single();

    if (ideaError) throw ideaError;
    if (!idea) throw new Error("Idea not found");

    // Prepare validation prompt
    const validationPrompt = `Analyze this startup idea and provide a validation score (0-100) with detailed feedback.

Idea: ${idea.title}
Description: ${idea.description}
${idea.problem_statement ? `Problem Statement: ${idea.problem_statement}` : ""}
${idea.target_audience ? `Target Audience: ${idea.target_audience}` : ""}
${idea.unique_value_proposition ? `Unique Value Proposition: ${idea.unique_value_proposition}` : ""}

Evaluate based on:
1. Market Viability (0-25 points)
2. Technical Feasibility (0-25 points)
3. Innovation & Uniqueness (0-25 points)
4. Problem-Solution Fit (0-25 points)

Provide:
- Overall score (0-100)
- Top 3 strengths
- Top 3 concerns or risks
- Top 3 recommendations for improvement`;

    // Call three different AI agents to simulate multi-agent consensus
    const agents = [
      { name: "claude", model: "google/gemini-2.5-pro" },
      { name: "gemini", model: "google/gemini-2.5-flash" },
      { name: "codex", model: "google/gemini-2.5-flash-lite" },
    ];

    const validations = await Promise.all(
      agents.map(async (agent) => {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: agent.model,
            messages: [
              {
                role: "system",
                content: `You are ${agent.name.toUpperCase()}, an expert AI agent specializing in startup validation. Be thorough but concise. Respond with structured analysis.`,
              },
              { role: "user", content: validationPrompt },
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "validate_idea",
                  description: "Provide structured validation feedback for a startup idea",
                  parameters: {
                    type: "object",
                    properties: {
                      score: {
                        type: "number",
                        description: "Overall validation score from 0-100",
                      },
                      strengths: {
                        type: "array",
                        items: { type: "string" },
                        description: "Top 3 strengths of the idea",
                      },
                      concerns: {
                        type: "array",
                        items: { type: "string" },
                        description: "Top 3 concerns or risks",
                      },
                      recommendations: {
                        type: "array",
                        items: { type: "string" },
                        description: "Top 3 recommendations",
                      },
                    },
                    required: ["score", "strengths", "concerns", "recommendations"],
                    additionalProperties: false,
                  },
                },
              },
            ],
            tool_choice: { type: "function", function: { name: "validate_idea" } },
          }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error("Rate limit exceeded. Please try again later.");
          }
          if (response.status === 402) {
            throw new Error("Payment required. Please add credits to your Lovable AI workspace.");
          }
          const errorText = await response.text();
          throw new Error(`AI Gateway error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        const toolCall = result.choices[0]?.message?.tool_calls?.[0];
        if (!toolCall) throw new Error(`${agent.name} did not return structured output`);

        const validation = JSON.parse(toolCall.function.arguments);
        return { agent: agent.name, ...validation };
      })
    );

    // Calculate consensus score
    const avgScore = Math.round(
      validations.reduce((sum, v) => sum + v.score, 0) / validations.length
    );

    // Aggregate feedback
    const allStrengths = validations.flatMap((v) => v.strengths);
    const allConcerns = validations.flatMap((v) => v.concerns);
    const allRecommendations = validations.flatMap((v) => v.recommendations);

    // Create validation summary
    const validationSummary = {
      claude_score: validations.find((v) => v.agent === "claude")?.score || 0,
      gemini_score: validations.find((v) => v.agent === "gemini")?.score || 0,
      codex_score: validations.find((v) => v.agent === "codex")?.score || 0,
      strengths: [...new Set(allStrengths)].slice(0, 5),
      concerns: [...new Set(allConcerns)].slice(0, 5),
      recommendations: [...new Set(allRecommendations)].slice(0, 5),
    };

    // Update idea with validation results
    const tokensSpent = 150; // Approximate token cost
    const { error: updateError } = await supabase
      .from("ideas")
      .update({
        status: "validated",
        consensus_score: avgScore,
        validation_summary: validationSummary,
        tokens_spent: idea.tokens_spent + tokensSpent,
      })
      .eq("id", ideaId);

    if (updateError) throw updateError;

    // Update user's token balance
    const { error: tokenError } = await supabase
      .from("profiles")
      .update({ tokens_used: supabase.rpc("increment", { x: tokensSpent }) })
      .eq("id", idea.user_id);

    if (tokenError) console.error("Token update error:", tokenError);

    // Record transaction
    const { data: profile } = await supabase
      .from("profiles")
      .select("total_tokens, tokens_used")
      .eq("id", idea.user_id)
      .single();

    if (profile) {
      await supabase.from("token_transactions").insert({
        user_id: idea.user_id,
        transaction_type: "consumption",
        amount: -tokensSpent,
        balance_after: profile.total_tokens - profile.tokens_used - tokensSpent,
        description: `Idea validation: ${idea.title}`,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        consensus_score: avgScore,
        validation_summary: validationSummary,
        tokens_spent: tokensSpent,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Validation error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});