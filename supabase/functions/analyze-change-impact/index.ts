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

    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    
    if (!googleApiKey) {
      throw new Error('Google API key not configured');
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

    // Call Google Gemini API
    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${googleApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: "Analyze the impact of this change request." }]
          }],
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            temperature: 0.7,
            responseMimeType: 'application/json'
          },
        }),
      }
    );

    if (!aiResponse.ok) {
      console.error("AI provider error:", aiResponse.status);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
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