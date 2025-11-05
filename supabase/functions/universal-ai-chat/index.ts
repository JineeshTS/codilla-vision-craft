import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from "../_shared/cors.ts";
import { callAI, type AIModel, type AIMessage as ProviderMessage } from "../_shared/multi-ai-provider.ts";

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// More accurate token estimation
function estimateTokens(text: string): number {
  // Average of 4 characters per token, but add buffer for safety
  return Math.ceil(text.length / 3.5);
}

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '').trim();
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { conversationId, message, context, systemPrompt, model = 'gemini' } = await req.json();

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate message length (prevent abuse)
    if (message.length > 10000) {
      return new Response(JSON.stringify({ error: 'Message too long (max 10,000 characters)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get or create conversation
    let conversation: any = null;
    if (conversationId) {
      const { data: existingConv } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();
      conversation = existingConv;
    }

    if (!conversation) {
      const { data: newConv, error: convError } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: user.id,
          context_type: context?.type || 'general',
          context_id: context?.id || null,
          phase_number: context?.phase || null,
          messages: [],
          total_tokens_used: 0,
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        return new Response(JSON.stringify({ error: 'Failed to create conversation' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      conversation = newConv;
    }

    // Limit conversation history to last 10 messages for performance
    const recentMessages = (conversation.messages || []).slice(-10);

    // Build messages array
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: systemPrompt || 'You are an AI Startup Mentor for Codilla.ai. Help users build and validate their startup ideas with actionable advice, market insights, and technical guidance. Be concise, practical, and encouraging.'
      },
      ...recentMessages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    // Estimate tokens (input + expected output)
    const inputTokens = messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
    const estimatedOutputTokens = Math.min(1000, inputTokens * 2); // Estimate response size
    const totalEstimatedTokens = inputTokens + estimatedOutputTokens;

    // Check user token balance (FIXED: use total_tokens and tokens_used)
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_tokens, tokens_used')
      .eq('id', user.id)
      .single();

    const availableTokens = (profile?.total_tokens || 0) - (profile?.tokens_used || 0);

    if (!profile || availableTokens < totalEstimatedTokens) {
      return new Response(JSON.stringify({
        error: 'Insufficient tokens',
        required: totalEstimatedTokens,
        balance: availableTokens
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Call AI with streaming
    const aiResponse = await callAI({
      model: model as AIModel,
      messages: messages as any,
      stream: true,
      temperature: 0.7,
      maxTokens: 2048, // Reduced for faster responses
    });

    // Update conversation with user message (async - don't wait)
    const updatedMessages = [
      ...recentMessages,
      {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        tokens: estimateTokens(message)
      }
    ];

    // Update in parallel (don't await)
    supabase
      .from('ai_conversations')
      .update({
        messages: updatedMessages,
        total_tokens_used: (conversation.total_tokens_used || 0) + totalEstimatedTokens
      })
      .eq('id', conversation.id)
      .then(({ error }) => {
        if (error) console.error('Error updating conversation:', error);
      });

    // Update tokens_used (FIXED: increment tokens_used, not token_balance)
    const newTokensUsed = (profile.tokens_used || 0) + totalEstimatedTokens;

    supabase
      .from('profiles')
      .update({ tokens_used: newTokensUsed })
      .eq('id', user.id)
      .then(({ error }) => {
        if (error) console.error('Error updating tokens:', error);
      });

    // Log transaction (FIXED: use correct schema)
    supabase
      .from('token_transactions')
      .insert({
        user_id: user.id,
        transaction_type: 'consumption',
        amount: totalEstimatedTokens,
        balance_after: profile.total_tokens - newTokensUsed,
        description: `AI Chat - ${context?.type || 'general'} conversation`,
        metadata: {
          conversation_id: conversation.id,
          model: model,
          message_length: message.length,
          estimated_tokens: totalEstimatedTokens
        }
      })
      .then(({ error }) => {
        if (error) console.error('Error logging transaction:', error);
      });

    // Return streaming response
    return new Response(aiResponse.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Conversation-Id': conversation.id,
        'X-Tokens-Used': String(totalEstimatedTokens),
      }
    });

  } catch (error) {
    console.error('Error in universal-ai-chat:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
