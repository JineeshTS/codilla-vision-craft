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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'Service configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
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

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate the complete development prompt sequence." }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI gateway error:", aiResponse.status);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const aiData = await aiResponse.json();
    const promptsData = JSON.parse(aiData.choices[0].message.content);
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