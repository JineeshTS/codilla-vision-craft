import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create client with user's token to verify admin role
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify admin role using service role client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      console.log(`User ${user.id} attempted admin action without admin role`);
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { targetUserId, amount, reason } = await req.json();

    if (!targetUserId || typeof amount !== 'number') {
      return new Response(JSON.stringify({ error: 'targetUserId and amount are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get current balance
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('token_balance, email')
      .eq('id', targetUserId)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const newBalance = profile.token_balance + amount;
    if (newBalance < 0) {
      return new Response(JSON.stringify({ error: 'Resulting balance cannot be negative' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update token balance
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        token_balance: newBalance,
        total_tokens: amount > 0 ? profile.token_balance + amount : profile.token_balance,
      })
      .eq('id', targetUserId);

    if (updateError) {
      console.error('Failed to update tokens:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update tokens' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log the transaction
    await supabaseAdmin.from('token_transactions').insert({
      user_id: targetUserId,
      amount: amount,
      balance_after: newBalance,
      transaction_type: amount > 0 ? 'bonus' : 'consumption',
      description: reason || `Admin adjustment by ${user.email}`,
      metadata: { adjusted_by: user.id, admin_email: user.email },
    });

    // Log audit
    await supabaseAdmin.from('audit_logs').insert({
      admin_id: user.id,
      action: 'adjust_tokens',
      entity_type: 'profile',
      entity_id: targetUserId,
      old_values: { token_balance: profile.token_balance },
      new_values: { token_balance: newBalance, adjustment: amount },
    });

    console.log(`Admin ${user.email} adjusted tokens for ${profile.email}: ${amount > 0 ? '+' : ''}${amount}`);

    return new Response(JSON.stringify({ 
      success: true, 
      newBalance,
      message: `Token balance updated to ${newBalance}` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in admin-adjust-tokens:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
