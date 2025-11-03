import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { sanitizeError, createErrorResponse } from "../_shared/error-handler.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const requestSchema = z.object({
  prompt: z.string().min(1).max(5000, { message: "Prompt must be between 1 and 5000 characters" }),
  context: z.string().max(2000, { message: "Context must be less than 2000 characters" }).optional(),
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

    const { prompt, context } = validation.data;

    // Verify user is authenticated
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return createErrorResponse('Authentication required', 401, corsHeaders, errorId);
    }

    console.log("Authenticated user:", user.id);

    // Check rate limit (30 code generations per hour)
    const rateLimit = checkRateLimit(user.id, {
      limit: 30,
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
            "X-RateLimit-Limit": "30",
            "X-RateLimit-Remaining": String(rateLimit.remaining),
            "X-RateLimit-Reset": new Date(rateLimit.resetAt).toISOString(),
          },
        }
      );
    }

    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return createErrorResponse('Service configuration error', 500, corsHeaders, errorId);
    }

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get AI provider config
    const { data: aiConfig } = await serviceClient
      .from('system_config')
      .select('config_value')
      .eq('config_key', 'ai_providers')
      .single();

    const aiProvider = (aiConfig?.config_value as any)?.primary || 'openai';
    const aiApiKey = Deno.env.get(aiProvider === 'openai' ? 'OPENAI_API_KEY' : aiProvider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'GOOGLE_API_KEY') || Deno.env.get("LOVABLE_API_KEY") || '';
    
    if (!aiApiKey) {
      throw new Error('AI provider API key not configured');
    }

    const systemPrompt = context 
      ? `You are a code generation assistant. Use this context: ${context}\n\nGenerate clean, production-ready code.`
      : "You are a code generation assistant. Generate clean, production-ready code.";

    const { callAI } = await import("../_shared/ai-provider.ts");
    
    const aiResponse = await callAI(
      {
        provider: aiProvider as "openai" | "anthropic" | "google",
        apiKey: aiApiKey,
        model: aiProvider === 'openai' ? 'gpt-4o-mini' : 'google/gemini-2.5-flash',
        temperature: 0.7,
      },
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      true
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI provider error:", aiResponse.status, errorText);
      return createErrorResponse("AI service unavailable", 503, corsHeaders, errorId);
    }

    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in generate-code function:", error);
    return createErrorResponse(error, 500, corsHeaders, errorId);
  }
});
