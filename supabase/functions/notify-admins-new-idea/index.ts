import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyRequest {
  ideaId: string;
  ideaTitle: string;
  submitterEmail: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { ideaId, ideaTitle, submitterEmail }: NotifyRequest = await req.json();

    console.log(`Notifying admins about new idea: ${ideaTitle} (${ideaId})`);

    // Get all admin users
    const { data: adminRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (rolesError) {
      console.error("Error fetching admin roles:", rolesError);
      throw new Error("Failed to fetch admin users");
    }

    if (!adminRoles || adminRoles.length === 0) {
      console.log("No admin users found to notify");
      return new Response(
        JSON.stringify({ success: true, message: "No admins to notify" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get admin emails from profiles
    const adminUserIds = adminRoles.map((r) => r.user_id);
    const { data: adminProfiles, error: profilesError } = await supabase
      .from("profiles")
      .select("email")
      .in("id", adminUserIds);

    if (profilesError) {
      console.error("Error fetching admin profiles:", profilesError);
      throw new Error("Failed to fetch admin emails");
    }

    // Queue emails for each admin
    const emailPromises = (adminProfiles || []).map(async (profile) => {
      const { error: queueError } = await supabase.from("email_queue").insert({
        to_email: profile.email,
        template_key: "new_idea_moderation",
        template_data: {
          idea_title: ideaTitle,
          idea_id: ideaId,
          submitter_email: submitterEmail,
          moderation_url: `${supabaseUrl.replace('.supabase.co', '')}/admin/moderation`,
        },
        status: "pending",
      });

      if (queueError) {
        console.error(`Failed to queue email for ${profile.email}:`, queueError);
      } else {
        console.log(`Email queued for admin: ${profile.email}`);
      }
    });

    await Promise.all(emailPromises);

    // Also create in-app notifications for admins
    const notificationPromises = adminUserIds.map(async (userId) => {
      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: userId,
        title: "New Idea Submitted",
        message: `A new idea "${ideaTitle}" has been submitted and needs moderation.`,
        type: "moderation",
        action_url: "/admin/moderation",
      });

      if (notifError) {
        console.error(`Failed to create notification for ${userId}:`, notifError);
      }
    });

    await Promise.all(notificationPromises);

    console.log(`Successfully notified ${adminProfiles?.length || 0} admins`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        adminsNotified: adminProfiles?.length || 0 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-admins-new-idea:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
