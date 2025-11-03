import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { createErrorResponse } from "../_shared/error-handler.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const errorId = crypto.randomUUID();
  
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Authorization header required', 401, corsHeaders, errorId);
    }

    const { ideaId, messages } = await req.json();
    
    if (!ideaId || !messages || !Array.isArray(messages)) {
      return createErrorResponse('Missing required fields', 400, corsHeaders, errorId);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const token = authHeader.replace('Bearer ', '');
    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: userError } = await userClient.auth.getUser(token);
    if (userError || !user) {
      console.error('Auth failed:', userError);
      return createErrorResponse('Authentication required', 401, corsHeaders, errorId);
    }

    console.log(`✅ User authenticated: ${user.id}`);
    
    // Check rate limit (30 messages per hour)
    const rateLimitResult = checkRateLimit(user.id, {
      limit: 30,
      windowMs: 60 * 60 * 1000
    });

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Fetch idea details
    const { data: idea, error: ideaError } = await supabase
      .from('ideas')
      .select('*')
      .eq('id', ideaId)
      .eq('user_id', user.id)
      .single();

    if (ideaError || !idea) {
      return createErrorResponse('Idea not found', 404, corsHeaders, errorId);
    }

    console.log(`📝 Processing idea: ${idea.title}`);

    // Get AI provider config
    const { data: aiConfig } = await supabase
      .from('system_config')
      .select('config_value')
      .eq('config_key', 'ai_providers')
      .single();

    const aiProvider = (aiConfig?.config_value as any)?.primary || 'openai';
    const aiApiKey = Deno.env.get(aiProvider === 'openai' ? 'OPENAI_API_KEY' : aiProvider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'GOOGLE_API_KEY') || Deno.env.get("LOVABLE_API_KEY") || '';
    
    if (!aiApiKey) {
      throw new Error('AI provider API key not configured');
    }

    const systemPrompt = `You are an expert requirements analyst helping entrepreneurs refine their ideas through the Codilla Framework Phase 1: Requirements Analysis.

Your goal is to deeply understand the user's idea through thoughtful questions and discussion. Focus on:

1. **Problem Clarity**: What exact problem are they solving? Who has this problem? How painful is it?
2. **Target Audience**: Who are the users? What are their demographics, behaviors, pain points?
3. **Current Solutions**: What alternatives exist? Why are they inadequate?
4. **Unique Value**: What makes this solution different and better?
5. **Business Model**: How will this make money? What's the revenue model?
6. **Market Size**: How large is the addressable market?
7. **Personal Fit**: Why is the founder passionate? Do they have domain expertise?
8. **Expected Outcomes**: What metrics define success in 6 months?

Current Idea Context:
- Title: ${idea.title}
- Description: ${idea.description}
${idea.problem_statement ? `- Problem: ${idea.problem_statement}` : ''}
${idea.target_audience ? `- Audience: ${idea.target_audience}` : ''}
${idea.unique_value_proposition ? `- UVP: ${idea.unique_value_proposition}` : ''}

Ask ONE thoughtful, specific question at a time. Build on their previous answers. Be conversational, encouraging, and help them think deeper about their idea. When you identify gaps or concerns, ask clarifying questions rather than making assumptions.`;

    const { callAI } = await import("../_shared/ai-provider.ts");
    
    const aiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages
    ];
    
    const response = await callAI(
      {
        provider: aiProvider as "openai" | "anthropic" | "google",
        apiKey: aiApiKey,
        model: aiProvider === 'openai' ? 'gpt-4o-mini' : 'google/gemini-2.5-flash',
        temperature: 0.8,
        maxTokens: 500,
      },
      aiMessages,
      true
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI provider error:', response.status, errorText);
      return createErrorResponse('AI service unavailable', 500, corsHeaders, errorId);
    }

    // Stream the response back
    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' }
    });

  } catch (error) {
    console.error('Requirements chat error:', error);
    return createErrorResponse(error, 500, corsHeaders, errorId);
  }
});
