import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { createErrorResponse } from "../_shared/error-handler.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const errorId = crypto.randomUUID();
  
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('Authorization header required', 401, corsHeaders, errorId);
    }

    const { phase, ideaId, userInput, context } = await req.json();
    
    if (!phase || !ideaId || !userInput) {
      return createErrorResponse('Missing required fields', 400, corsHeaders, errorId);
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Authenticate user
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
    
    // Check rate limit (10 consensus requests per hour)
    const rateLimitResult = checkRateLimit(user.id, {
      limit: 10,
      windowMs: 60 * 60 * 1000 // 1 hour
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

    // Define AI models
    const aiModels = [
      { name: 'Claude', model: 'google/gemini-2.5-pro', specialty: 'Analysis & Strategy' },
      { name: 'Gemini', model: 'google/gemini-2.5-flash', specialty: 'Review & Validation' },
      { name: 'Codex', model: 'google/gemini-2.5-flash-lite', specialty: 'Technical Assessment' }
    ];

    // Create system prompt based on phase
    const systemPrompts: Record<string, string> = {
      '1': 'You are an expert business analyst evaluating idea viability. Score 1-10 and provide brief feedback.',
      '2': 'You are a market research expert. Validate problem-market fit. Score 1-10.',
      '3': 'You are a product strategist. Evaluate product definition clarity. Score 1-10.',
      '4': 'You are a technical architect. Assess technical feasibility. Score 1-10.',
      '5': 'You are a UX designer. Review design and prototype quality. Score 1-10.',
      '6': 'You are a dev team lead. Verify development readiness. Score 1-10.',
      '7': 'You are a senior developer. Review code quality and architecture. Score 1-10.',
      '8': 'You are a launch specialist. Check launch readiness. Score 1-10.',
      '9': 'You are a DevOps engineer. Verify deployment readiness. Score 1-10.',
      '10': 'You are a growth strategist. Evaluate post-launch metrics. Score 1-10.'
    };

    const systemPrompt = systemPrompts[phase] || systemPrompts['1'];

    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    
    if (!googleApiKey) {
      throw new Error('Google API key not configured');
    }

    // Call all three AIs in parallel via Lovable AI Gateway
    console.log('🤖 Calling three AIs for consensus...');
    
    const aiPromises = aiModels.map(async (ai) => {
      const startTime = Date.now();
      
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${googleApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                role: 'user',
                parts: [{ text: `Idea: ${idea.title}\nDescription: ${idea.description}\nContext: ${context || ''}\nUser Input: ${userInput}\n\nProvide: 1) Score (1-10), 2) Strengths (bullet points), 3) Concerns (bullet points), 4) Recommendations (bullet points)` }]
              }],
              systemInstruction: {
                parts: [{ text: systemPrompt }]
              },
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1000
              },
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`${ai.name} API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const executionTime = Date.now() - startTime;

        // Extract score from response
        const scoreMatch = content.match(/(?:score|rating)[:\s]*(\d+)/i);
        const score = scoreMatch ? parseInt(scoreMatch[1]) : 5;

        // Log AI request
        await supabase.from('ai_requests').insert({
          user_id: user.id,
          idea_id: ideaId,
          ai_agent: ai.name.toUpperCase(),
          request_type: 'CONSENSUS',
          prompt: userInput,
          response: content,
          tokens_used: data.usage?.total_tokens || 0,
          execution_time: executionTime,
          success: true
        });

        return {
          agent: ai.name,
          specialty: ai.specialty,
          score,
          feedback: content,
          executionTime
        };
      } catch (error) {
        console.error(`${ai.name} failed:`, error);
        
        // Log failed request
        await supabase.from('ai_requests').insert({
          user_id: user.id,
          idea_id: ideaId,
          ai_agent: ai.name.toUpperCase(),
          request_type: 'CONSENSUS',
          prompt: userInput,
          response: '',
          tokens_used: 0,
          execution_time: Date.now() - startTime,
          success: false,
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });

        return {
          agent: ai.name,
          specialty: ai.specialty,
          score: 0,
          feedback: 'Analysis failed',
          executionTime: Date.now() - startTime,
          error: true
        };
      }
    });

    const results = await Promise.all(aiPromises);
    
    // Calculate consensus
    const validScores = results.filter(r => !r.error && r.score > 0);
    const avgScore = validScores.length > 0
      ? Math.round(validScores.reduce((sum, r) => sum + r.score, 0) / validScores.length)
      : 0;
    
    const hasConsensus = validScores.length >= 2;
    const consensusLevel = validScores.every(r => Math.abs(r.score - avgScore) <= 2) ? 'high' : 'moderate';

    console.log(`✅ Consensus reached! Average score: ${avgScore}`);

    return new Response(
      JSON.stringify({
        success: true,
        consensus: hasConsensus,
        consensusLevel,
        avgScore,
        validations: results,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Consensus error:', error);
    return createErrorResponse(error, 500, corsHeaders, errorId);
  }
});
