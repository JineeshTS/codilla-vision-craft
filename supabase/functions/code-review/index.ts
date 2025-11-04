import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { callAI } from "../_shared/multi-ai-provider.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, language, context, model = 'gemini' } = await req.json();

    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Code is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are an expert code reviewer. Analyze the provided code and provide:
1. Code quality assessment (score out of 10)
2. Security issues and vulnerabilities
3. Performance optimization suggestions
4. Best practices violations
5. Specific improvement recommendations

Format your response as JSON with these fields:
- score: number (0-10)
- security_issues: array of {severity: "low"|"medium"|"high", issue: string, fix: string}
- performance_tips: array of strings
- best_practices: array of strings
- improvements: array of strings`;

    const userPrompt = `Review this ${language || 'code'}:

\`\`\`${language || 'javascript'}
${code}
\`\`\`

${context ? `Context: ${context}` : ''}`;

    const response = await callAI({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      stream: false
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error('AI service error');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Try to parse as JSON, fall back to plain text
    let reviewData;
    try {
      reviewData = JSON.parse(content);
    } catch {
      reviewData = {
        score: 7,
        raw_review: content,
        security_issues: [],
        performance_tips: [],
        best_practices: [],
        improvements: []
      };
    }

    return new Response(
      JSON.stringify(reviewData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Code review error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});