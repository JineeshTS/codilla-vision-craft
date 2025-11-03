import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId } = await req.json();
    console.log("Generating PRD for project:", projectId);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch project with related idea data
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(`
        *,
        ideas (
          title,
          description,
          problem_statement,
          target_audience,
          unique_value_proposition,
          phase_2_data
        )
      `)
      .eq("id", projectId)
      .single();

    if (projectError) throw projectError;
    if (!project) throw new Error("Project not found");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Check token balance
    const { data: profile } = await supabase
      .from("profiles")
      .select("total_tokens, tokens_used")
      .eq("id", user.id)
      .single();

    const availableTokens = (profile?.total_tokens || 0) - (profile?.tokens_used || 0);
    const requiredTokens = 20000;

    if (availableTokens < requiredTokens) {
      throw new Error(`Insufficient tokens. Required: ${requiredTokens}, Available: ${availableTokens}`);
    }

    const ideaData = project.ideas;
    const businessData = ideaData.phase_2_data || {};

    // Three AI agents generate PRD components
    const prompts = {
      features: `Based on this business idea, generate a comprehensive list of features prioritized using MoSCoW method (Must-Have, Should-Have, Could-Have, Won't-Have).

Idea: ${ideaData.title}
Problem: ${ideaData.problem_statement}
Value Proposition: ${ideaData.unique_value_proposition}
Target Audience: ${ideaData.target_audience}

Business Model: ${JSON.stringify(businessData.bmc || {})}
Lean Canvas: ${JSON.stringify(businessData.lean || {})}

Return a JSON object with this structure:
{
  "mustHave": ["feature 1", "feature 2"],
  "shouldHave": ["feature 3"],
  "couldHave": ["feature 4"],
  "wontHave": ["feature 5"]
}`,

      personas: `Create detailed user personas for this product.

Idea: ${ideaData.title}
Target Audience: ${ideaData.target_audience}
Value Proposition: ${ideaData.unique_value_proposition}

Create 2-3 detailed personas with:
- Name and photo description
- Demographics
- Goals and motivations
- Pain points
- User journey stages
- Preferred channels

Return JSON array of personas.`,

      userStories: `Generate user stories with acceptance criteria for the MVP features.

Idea: ${ideaData.title}
Problem: ${ideaData.problem_statement}

For each core feature, create user stories in this format:
{
  "stories": [
    {
      "title": "User story title",
      "story": "As a [user type], I want to [action] so that [benefit]",
      "acceptanceCriteria": ["Given..., When..., Then..."],
      "priority": "high/medium/low",
      "estimatedEffort": "small/medium/large"
    }
  ]
}`,
    };

    // Call AI for each component
    const aiResults = await Promise.all([
      callAI("Feature Prioritization", prompts.features, lovableApiKey),
      callAI("User Personas", prompts.personas, lovableApiKey),
      callAI("User Stories", prompts.userStories, lovableApiKey),
    ]);

    const [featuresData, personasData, storiesData] = aiResults;

    // Parse AI responses
    const features = parseJSON(featuresData, { mustHave: [], shouldHave: [], couldHave: [], wontHave: [] });
    const personas = parseJSON(personasData, []);
    const userStories = parseJSON(storiesData, { stories: [] });

    // Update project with PRD data
    const { error: updateError } = await supabase
      .from("projects")
      .update({
        prd_data: {
          features,
          successMetrics: {
            userAcquisition: "Target metric TBD",
            engagement: "Target metric TBD",
            retention: "Target metric TBD",
            revenue: "Target metric TBD",
          },
          mvpScope: features.mustHave,
        },
        user_personas: personas,
        user_stories: userStories.stories || [],
        mvp_features: features.mustHave,
        phase_3_completed_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    if (updateError) throw updateError;

    // Update token usage
    const { error: tokenError } = await supabase
      .from("profiles")
      .update({ tokens_used: (profile?.tokens_used || 0) + requiredTokens })
      .eq("id", user.id);

    if (tokenError) console.error("Error updating tokens:", tokenError);

    // Log transaction
    await supabase.from("token_transactions").insert({
      user_id: user.id,
      transaction_type: "usage",
      amount: -requiredTokens,
      balance_after: (profile?.total_tokens || 0) - (profile?.tokens_used || 0) - requiredTokens,
      description: `Phase 3 PRD Generation for project: ${project.name}`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        prdData: { features, successMetrics: {}, mvpScope: features.mustHave },
        personas,
        userStories: userStories.stories,
        tokensUsed: requiredTokens,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error generating PRD:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function callAI(agent: string, prompt: string, apiKey: string): Promise<string> {
  console.log(`${agent} analyzing...`);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  
  // Get AI provider config
  const { data: aiConfig } = await supabase
    .from('system_config')
    .select('config_value')
    .eq('config_key', 'ai_providers')
    .single();

  const aiProvider = (aiConfig?.config_value as any)?.primary || 'openai';
  const aiApiKey = Deno.env.get(aiProvider === 'openai' ? 'OPENAI_API_KEY' : aiProvider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'GOOGLE_API_KEY') || apiKey || '';
  
  if (!aiApiKey) {
    throw new Error('AI provider API key not configured');
  }

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${aiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: "system",
          content: "You are an expert product manager. Always return valid JSON responses.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`${agent} AI call failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function parseJSON(text: string, fallback: any): any {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0]);
    }
    return fallback;
  } catch {
    return fallback;
  }
}
