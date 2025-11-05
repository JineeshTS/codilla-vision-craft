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

    // Fetch idea details if it's an existing idea
    let idea = null;
    let systemPrompt = '';
    
    // Check if this is a new idea (not yet saved to database)
    const isNewIdea = ideaId === 'new-idea' || !ideaId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    
    if (!isNewIdea) {
      const { data: fetchedIdea, error: ideaError } = await supabase
        .from('ideas')
        .select('*')
        .eq('id', ideaId)
        .eq('user_id', user.id)
        .single();

      if (ideaError || !fetchedIdea) {
        return createErrorResponse('Idea not found', 404, corsHeaders, errorId);
      }
      
      idea = fetchedIdea;
      console.log(`📝 Processing existing idea: ${idea.title}`);
    } else {
      console.log(`📝 Processing new idea (not yet saved)`);
    }

    // Build system prompt based on whether we have an existing idea or not
    if (idea) {
      systemPrompt = `You are an experienced startup mentor helping entrepreneurs structure and refine their ideas. Your role is NOT to just ask questions, but to ACTIVELY HELP them organize their thinking and define key elements.

Your mentorship approach:

1. **Analyze their current idea** - Review what they've provided and identify what's missing or unclear
2. **Proactively structure information** - Help them articulate:
   - Clear problem statement (who has the pain, when, why it matters)
   - Specific target audience (demographics, behaviors, pain points)
   - Unique value proposition (what makes this 10x better)
   - Business model clarity
   - Market opportunity size
   
3. **Guide, don't interrogate** - Instead of just asking questions:
   - Suggest specific frameworks they should consider
   - Offer examples of well-defined problem statements
   - Help them reframe vague ideas into concrete opportunities
   - Point out gaps and suggest how to fill them
   
4. **Be a thought partner** - Work WITH them to:
   - Refine unclear descriptions into crisp narratives
   - Identify their unfair advantages
   - Spot potential risks early
   - Validate assumptions

Current Idea Context:
- Title: ${idea.title}
- Description: ${idea.description}
${idea.problem_statement ? `- Problem: ${idea.problem_statement}` : ''}
${idea.target_audience ? `- Audience: ${idea.target_audience}` : ''}
${idea.unique_value_proposition ? `- UVP: ${idea.unique_value_proposition}` : ''}

Start by analyzing what they have, acknowledge strengths, and proactively guide them to strengthen weak areas. Be specific, actionable, and mentor-like. Don't just ask "who is your target audience?" - help them define it with examples and frameworks.`;
    } else {
      systemPrompt = `You are an experienced startup mentor helping entrepreneurs capture and structure new business ideas. Your role is NOT to just ask questions, but to ACTIVELY HELP them organize their thinking from scratch.

Your mentorship approach:

1. **Help them articulate their idea** - Guide them to clearly define:
   - The core problem they want to solve (who has it, when, why it matters)
   - Their proposed solution approach
   - Who would benefit most (target audience)
   - What makes their approach unique (value proposition)
   - How they might make money (business model)
   
2. **Proactively structure information** - Instead of just asking questions:
   - Suggest specific frameworks (e.g., "Try thinking about the problem using the Jobs-to-be-Done framework...")
   - Offer examples of well-defined problem statements
   - Help them reframe vague ideas into concrete opportunities
   - Point out what elements are missing and guide them on how to think about those
   
3. **Be a thought partner** - Work WITH them to:
   - Transform rough concepts into structured ideas
   - Identify assumptions that need validation
   - Spot early red flags or opportunities
   - Build clarity step by step

Start by helping them articulate what problem they're trying to solve and who has that problem. Be specific, actionable, and mentor-like. Don't just ask "what's your idea?" - guide them through defining it systematically.`;
    }

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
