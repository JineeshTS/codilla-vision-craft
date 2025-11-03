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

    const { projectId, templateData, prdData, features } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user owns this project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
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

    // Generate comprehensive prompts using AI
    const systemPrompt = `You are an expert software development planner. Generate a complete, sequenced list of development prompts for building an application.

Context:
- Template: ${JSON.stringify(templateData)}
- PRD: ${JSON.stringify(prdData)}
- Features: ${JSON.stringify(features)}

Generate 15-30 detailed prompts covering:
1. Setup & Configuration (database, auth, environment)
2. Core Features (from PRD)
3. UI Components (based on template)
4. Integrations (APIs, third-party services)
5. Testing & Quality Assurance
6. Deployment & Launch

Return JSON array with this structure:
[{
  "sequence_number": 1,
  "title": "Setup Database Schema",
  "description": "Detailed description of what this step accomplishes",
  "prompt_text": "Exact prompt to give to AI code generator",
  "category": "setup|feature|integration|testing|deployment",
  "dependencies": [], // Array of sequence numbers that must complete first
  "estimated_tokens": 5000
}]

Make prompts specific, actionable, and properly sequenced with dependencies.`;

    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${googleApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: "Generate the complete development prompt sequence." }]
          }],
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            temperature: 0.7,
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
    const promptsData = JSON.parse(content);
    const prompts = promptsData.prompts || promptsData;

    // Insert prompts into database
    const promptRecords = prompts.map((p: any) => ({
      project_id: projectId,
      sequence_number: p.sequence_number,
      title: p.title,
      description: p.description,
      prompt_text: p.prompt_text,
      category: p.category,
      dependencies: p.dependencies || [],
      estimated_tokens: p.estimated_tokens || 5000,
      status: 'pending'
    }));

    const { data: insertedPrompts, error: insertError } = await supabase
      .from('development_prompts')
      .insert(promptRecords)
      .select();

    if (insertError) {
      console.error("Error inserting prompts:", insertError);
      return new Response(JSON.stringify({ error: 'Failed to save prompts' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      prompts: insertedPrompts,
      totalPrompts: insertedPrompts.length,
      totalTokens: insertedPrompts.reduce((sum: number, p: any) => sum + p.estimated_tokens, 0)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error in generate-development-prompts:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});