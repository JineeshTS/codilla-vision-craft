import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { createErrorResponse } from "../_shared/error-handler.ts";
import { callAI, type AIModel, type AIMessage } from "../_shared/multi-ai-provider.ts";

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

    const { ideaId, messages, model = 'gemini' } = await req.json();
    
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

    const systemPrompt = `You are an expert idea screening consultant helping entrepreneurs validate their ideas through Phase 1: Idea Capture & Screening.

Your goal is to help them quickly determine if their idea is worth pursuing through thoughtful questions and discussion. Focus on:

1. **Problem Validation**: Is this a real, painful problem? Who experiences it? How often?
2. **Personal Fit**: Why do THEY care? Do they have passion + domain knowledge to pursue this?
3. **Market Potential**: Is there a large enough audience willing to pay for a solution?
4. **Competitive Landscape**: What alternatives exist? Why will this be 10x better?
5. **Initial Viability**: Can this be built and validated quickly? What's the MVP?
6. **Founder-Market Fit**: Does their background give them an unfair advantage?
7. **Resource Requirements**: What's needed to get started? Is it realistic?
8. **Quick Win Potential**: What can be validated in 30-60 days?

Current Idea Context:
- Title: ${idea.title}
- Description: ${idea.description}
${idea.problem_statement ? `- Problem: ${idea.problem_statement}` : ''}
${idea.target_audience ? `- Audience: ${idea.target_audience}` : ''}
${idea.unique_value_proposition ? `- UVP: ${idea.unique_value_proposition}` : ''}

Ask ONE thoughtful, specific question at a time to screen the idea quickly. Be direct but encouraging. Help them see if this idea passes the initial "smell test" - is it worth 2-4 weeks of validation research? When concerns arise, probe deeper rather than dismiss.`;

    const aiMessages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))
    ];

    const aiResponse = await callAI({
      model: model as AIModel,
      messages: aiMessages,
      stream: true,
      temperature: 0.8,
      maxTokens: 500,
    });

    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' }
    });

  } catch (error) {
    console.error('Requirements chat error:', error);
    return createErrorResponse(error, 500, corsHeaders, errorId);
  }
});
