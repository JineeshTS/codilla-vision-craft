import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from "../_shared/cors.ts";

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { conversationId, message, context, systemPrompt } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get AI provider configuration
    const { data: aiConfigData } = await supabase
      .from('system_config')
      .select('config_value')
      .eq('config_key', 'ai_providers')
      .single();

    const aiProvider = (aiConfigData?.config_value as any)?.primary || 'openai';
    const aiApiKey = Deno.env.get(aiProvider === 'openai' ? 'OPENAI_API_KEY' : aiProvider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'GOOGLE_API_KEY') || Deno.env.get("LOVABLE_API_KEY") || '';
    
    if (!aiApiKey) {
      return new Response(JSON.stringify({ error: 'AI provider API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get or create conversation
    let conversation;
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

    // Build messages array
    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt || 'You are a helpful AI assistant for Codilla.ai, helping users build their startup ideas.' },
      ...(conversation.messages || []).map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    // Estimate tokens
    const estimatedTokens = messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);

    // Check user token balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('token_balance')
      .eq('id', user.id)
      .single();

    if (!profile || profile.token_balance < estimatedTokens) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient tokens',
        required: estimatedTokens,
        balance: profile?.token_balance || 0
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Call Lovable AI Gateway
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${aiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    // Update conversation with user message
    const updatedMessages = [
      ...(conversation.messages || []),
      { role: 'user', content: message, timestamp: new Date().toISOString(), tokens: estimateTokens(message) }
    ];

    await supabase
      .from('ai_conversations')
      .update({ messages: updatedMessages })
      .eq('id', conversation.id);

    // Deduct estimated tokens (will adjust later based on actual usage)
    await supabase
      .from('profiles')
      .update({ token_balance: profile.token_balance - estimatedTokens })
      .eq('id', user.id);

    // Log transaction
    await supabase
      .from('token_transactions')
      .insert({
        user_id: user.id,
        amount: -estimatedTokens,
        transaction_type: 'usage',
        description: 'AI Chat',
        operation_type: 'ai_chat_message',
        tokens_estimate: estimatedTokens,
      });

    // Return streaming response
    return new Response(aiResponse.body, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'X-Conversation-Id': conversation.id,
        'X-Tokens-Used': String(estimatedTokens),
      }
    });

  } catch (error) {
    console.error('Error in universal-ai-chat:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
