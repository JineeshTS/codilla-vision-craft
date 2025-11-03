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

    const { projectId, phaseNumber, taskId, messages } = await req.json();
    
    if (!projectId || !phaseNumber || !taskId || !messages || !Array.isArray(messages)) {
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
    
    // Check rate limit (50 messages per hour per phase task)
    const rateLimitResult = checkRateLimit(`${user.id}-${projectId}-${phaseNumber}-${taskId}`, {
      limit: 50,
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

    // Fetch project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*, ideas(*)')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return createErrorResponse('Project not found', 404, corsHeaders, errorId);
    }

    console.log(`📝 Processing phase ${phaseNumber}, task ${taskId} for project: ${project.name}`);

    // Get Google API Key
    const googleApiKey = Deno.env.get("GOOGLE_API_KEY");
    
    if (!googleApiKey) {
      throw new Error('Google API key not configured');
    }

    // Construct system prompt based on phase and task
    const systemPrompt = `You are an expert startup advisor guiding an entrepreneur through Phase ${phaseNumber} of their product development journey.

Project Context:
- Project Name: ${project.name}
- Idea: ${project.ideas?.title || 'N/A'}
- Description: ${project.ideas?.description || 'N/A'}

Current Task: ${taskId}

Your role is to:
1. Ask insightful, specific questions that help the founder think deeply
2. Provide expert guidance based on startup best practices
3. Help them make concrete progress on this specific task
4. Keep the conversation focused and actionable
5. Validate their thinking while challenging assumptions
6. Suggest frameworks and tools when appropriate

Be conversational but professional. Ask ONE question at a time. When they've made good progress, acknowledge it and help them move to the next aspect of the task.`;

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];
    
    // Call Google Gemini API with streaming
    const contents = aiMessages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

    const systemInstruction = aiMessages.find(m => m.role === 'system');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:streamGenerateContent?key=${googleApiKey}&alt=sse`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction.content }] } : undefined,
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 1000,
          },
        }),
      }
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
    console.error('Phase task chat error:', error);
    return createErrorResponse(error, 500, corsHeaders, errorId);
  }
});
