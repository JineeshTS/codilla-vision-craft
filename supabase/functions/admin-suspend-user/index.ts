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

    const { targetUserId, status, reason } = await req.json();

    if (!targetUserId || !status) {
      return new Response(JSON.stringify({ error: 'targetUserId and status are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const validStatuses = ['active', 'suspended', 'banned'];
    if (!validStatuses.includes(status)) {
      return new Response(JSON.stringify({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prevent self-suspension
    if (targetUserId === user.id) {
      return new Response(JSON.stringify({ error: 'Cannot modify your own status' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get current user data
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('status, email')
      .eq('id', targetUserId)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const oldStatus = profile.status;

    // Update user status
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ status })
      .eq('id', targetUserId);

    if (updateError) {
      console.error('Failed to update user status:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update user status' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log audit
    await supabaseAdmin.from('audit_logs').insert({
      admin_id: user.id,
      action: `user_status_${status}`,
      entity_type: 'profile',
      entity_id: targetUserId,
      old_values: { status: oldStatus },
      new_values: { status, reason },
    });

    // Create notification for the user
    const statusMessages: Record<string, string> = {
      suspended: 'Your account has been temporarily suspended. Please contact support for more information.',
      banned: 'Your account has been permanently banned due to policy violations.',
      active: 'Your account has been reactivated. Welcome back!',
    };

    await supabaseAdmin.from('notifications').insert({
      user_id: targetUserId,
      title: status === 'active' ? 'Account Reactivated' : 'Account Status Update',
      message: statusMessages[status],
      type: status === 'active' ? 'success' : 'warning',
    });

    console.log(`Admin ${user.email} changed status of ${profile.email} from ${oldStatus} to ${status}`);

    return new Response(JSON.stringify({ 
      success: true,
      oldStatus,
      newStatus: status,
      message: `User status updated to ${status}` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in admin-suspend-user:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
