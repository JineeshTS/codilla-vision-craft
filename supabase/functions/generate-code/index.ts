import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { sanitizeError, createErrorResponse } from "../_shared/error-handler.ts";
import { callAI, type AIModel, type AIMessage } from "../_shared/multi-ai-provider.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const requestSchema = z.object({
  prompt: z.string().min(1).max(5000, { message: "Prompt must be between 1 and 5000 characters" }),
  context: z.string().max(2000, { message: "Context must be less than 2000 characters" }).optional(),
  model: z.enum(['claude', 'gemini', 'codex']).optional(),
  optimizeForLovable: z.boolean().optional(),
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

    const { prompt, context, model = 'gemini', optimizeForLovable = false } = validation.data;

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

    let systemPrompt = context 
      ? `You are a code generation assistant. Use this context: ${context}\n\nGenerate clean, production-ready code.`
      : "You are a code generation assistant. Generate clean, production-ready code.";

    if (optimizeForLovable) {
      systemPrompt = `You are a code generation assistant specialized in Lovable.dev projects.

Generate code optimized for Lovable.dev that follows these patterns:
- Use shadcn/ui components from @/components/ui
- Use Tailwind CSS utility classes with semantic tokens from index.css
- Use Supabase client from @/integrations/supabase/client
- Use React Router with useNavigate for navigation
- Use Sonner for toast notifications
- Follow component-based architecture with focused, reusable components
- Use TypeScript with proper type safety
${context ? `\nContext: ${context}` : ''}

Generate clean, production-ready code suitable for immediate use in Lovable.dev.`;
    }

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ];

    const aiResponse = await callAI({
      model: model as AIModel,
      messages,
      stream: true,
      temperature: 0.7,
    });

    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in generate-code function:", error);
    return createErrorResponse(error, 500, corsHeaders, errorId);
  }
});
