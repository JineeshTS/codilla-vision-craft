import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

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

  try {
    // Get authorization token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No authorization token provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    // Create client with user's token for authorization check
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create service role client for operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch phase and project details
    const { data: phase, error: phaseError } = await supabase
      .from("phases")
      .select("*, projects(*)")
      .eq("id", phaseId)
      .single();

    if (phaseError || !phase) {
      console.error('Phase fetch error:', phaseError);
      return new Response(
        JSON.stringify({ error: 'Phase not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify ownership
    if (phase.projects?.user_id !== user.id) {
      console.error('Ownership verification failed:', { projectUserId: phase.projects?.user_id, requestUserId: user.id });
      return new Response(
        JSON.stringify({ error: 'Forbidden - You do not own this project' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const phaseDescriptions: Record<number, string> = {
      1: "Requirements Analysis - Define core features, user stories, and acceptance criteria",
      2: "Architecture Design - Design system architecture, technology stack, and infrastructure",
      3: "Database Schema - Design database structure, relationships, and data models",
      4: "API Design - Define API endpoints, data contracts, and integration points",
      5: "UI/UX Design - Create wireframes, mockups, and user experience flows",
      6: "Frontend Development - Implement user interface and client-side logic",
      7: "Backend Development - Build server-side logic, APIs, and data processing",
      8: "Integration & Testing - Integrate components and conduct comprehensive testing",
      9: "Deployment Setup - Configure production environment and deployment pipeline",
      10: "Final Review & Launch - Conduct final QA, documentation, and launch preparation",
    };

    const phasePrompt = `Phase ${phase.phase_number}: ${phaseDescriptions[phase.phase_number]}
    
Project: ${phase.projects.name}
User Input/Requirements: ${userInput}

Validate this phase deliverable and provide:
1. Quality score (0-100)
2. Completeness assessment
3. Specific issues or gaps found
4. Recommendations for improvement
5. Whether this phase meets the requirements to proceed`;

    // Validate with three AI agents
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
                content: `You are ${agent.name.toUpperCase()}, an expert software development validator. Assess quality and completeness rigorously.`,
              },
              { role: "user", content: phasePrompt },
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "validate_phase",
                  description: "Validate a development phase deliverable",
                  parameters: {
                    type: "object",
                    properties: {
                      score: {
                        type: "number",
                        description: "Quality score from 0-100",
                      },
                      approved: {
                        type: "boolean",
                        description: "Whether to approve proceeding to next phase",
                      },
                      issues: {
                        type: "array",
                        items: { type: "string" },
                        description: "Key issues or gaps identified",
                      },
                      recommendations: {
                        type: "array",
                        items: { type: "string" },
                        description: "Recommendations for improvement",
                      },
                    },
                    required: ["score", "approved", "issues", "recommendations"],
                    additionalProperties: false,
                  },
                },
              },
            ],
            tool_choice: { type: "function", function: { name: "validate_phase" } },
          }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error("Rate limit exceeded. Please try again later.");
          }
          if (response.status === 402) {
            throw new Error("Payment required. Please add credits to your workspace.");
          }
          throw new Error(`AI Gateway error: ${response.status}`);
        }

        const result = await response.json();
        const toolCall = result.choices[0]?.message?.tool_calls?.[0];
        if (!toolCall) throw new Error(`${agent.name} validation failed`);

        const validation = JSON.parse(toolCall.function.arguments);
        return { agent: agent.name, ...validation };
      })
    );

    // Calculate consensus
    const avgScore = Math.round(
      validations.reduce((sum, v) => sum + v.score, 0) / validations.length
    );
    const consensusReached = validations.filter((v) => v.approved).length >= 2;

    const validationData = {
      claude_validation: validations.find((v) => v.agent === "claude"),
      gemini_validation: validations.find((v) => v.agent === "gemini"),
      codex_validation: validations.find((v) => v.agent === "codex"),
    };

    const tokensSpent = 100;

    // Update phase
    const { error: updateError } = await supabase
      .from("phases")
      .update({
        ...validationData,
        consensus_reached: consensusReached,
        tokens_spent: tokensSpent,
        status: consensusReached ? "completed" : "failed",
        completed_at: consensusReached ? new Date().toISOString() : null,
      })
      .eq("id", phaseId);

    if (updateError) throw updateError;

    // Update project progress if consensus reached
    if (consensusReached && phase.projects) {
      const newProgress = Math.round((phase.phase_number / 10) * 100);
      await supabase
        .from("projects")
        .update({
          current_phase: phase.phase_number + 1,
          progress_percentage: newProgress,
        })
        .eq("id", phase.project_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        consensus_reached: consensusReached,
        average_score: avgScore,
        validations,
        tokens_spent: tokensSpent,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Phase validation error:", error);
    
    // Map internal errors to user-friendly messages
    let userMessage = 'An unexpected error occurred while validating the phase';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        userMessage = 'Unable to connect to validation service';
      } else if (error.message.includes('not found')) {
        userMessage = 'Phase not found';
        statusCode = 404;
      } else if (error.message.includes('configured')) {
        userMessage = 'Service temporarily unavailable';
        statusCode = 503;
      } else if (error.message.includes('Rate limit') || error.message.includes('Payment required')) {
        userMessage = error.message;
        statusCode = error.message.includes('Rate limit') ? 429 : 402;
      }
    }
    
    return new Response(
      JSON.stringify({ error: userMessage }),
      {
        status: statusCode,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
