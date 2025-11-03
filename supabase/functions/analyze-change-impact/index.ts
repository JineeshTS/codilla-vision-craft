import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { projectId, changeDescription, currentState } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Service configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const serviceClient = createClient(supabaseUrl, SUPABASE_SERVICE_ROLE_KEY);

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

    // Analyze change impact using AI
    const systemPrompt = `You are a software architecture expert. Analyze the impact of a requested change on an existing application.

Current Application State:
${JSON.stringify(currentState, null, 2)}

Change Request:
${changeDescription}

Provide a comprehensive impact analysis in JSON format:
{
  "impactLevel": "low|medium|high|critical",
  "affectedComponents": ["component1", "component2"],
  "analysis": "Detailed explanation of what will be affected and why",
  "risks": ["Risk 1", "Risk 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "estimatedEffort": "Time estimate",
  "breakingChanges": true/false,
  "requiresTesting": ["area1", "area2"]
}`;

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
        { role: "user", content: "Analyze the impact of this change request." }
      ],
      false
    );

    if (!aiResponse.ok) {
      console.error("AI provider error:", aiResponse.status);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || 
                   aiData.candidates?.[0]?.content?.parts?.[0]?.text ||
                   aiData.content?.[0]?.text || "{}";
    const impactAnalysis = JSON.parse(content);

    return new Response(JSON.stringify({ 
      success: true, 
      analysis: impactAnalysis
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error in analyze-change-impact:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});