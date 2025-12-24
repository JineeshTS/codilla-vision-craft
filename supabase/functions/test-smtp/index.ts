import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
  secure?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = roles?.some((r) => r.role === "admin");
    if (!isAdmin) {
      throw new Error("Admin access required");
    }

    const { config, testEmail } = await req.json() as { config: SmtpConfig; testEmail: string };

    if (!config.host || !config.username || !config.password || !testEmail) {
      throw new Error("Missing required SMTP configuration or test email");
    }

    console.log(`Testing SMTP connection to ${config.host}:${config.port}`);

    // Create SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: config.host,
        port: config.port,
        tls: config.secure ?? config.port === 465,
        auth: {
          username: config.username,
          password: config.password,
        },
      },
    });

    // Send test email
    await client.send({
      from: `${config.fromName} <${config.fromEmail || config.username}>`,
      to: testEmail,
      subject: "SMTP Test - Codilla.ai",
      content: "auto",
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #6366f1;">SMTP Configuration Test</h2>
            <p>This is a test email from your Codilla.ai admin panel.</p>
            <p>If you're receiving this email, your SMTP configuration is working correctly!</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="color: #6b7280; font-size: 12px;">
              <strong>Configuration Details:</strong><br />
              Host: ${config.host}<br />
              Port: ${config.port}<br />
              From: ${config.fromEmail || config.username}
            </p>
          </body>
        </html>
      `,
    });

    await client.close();

    console.log(`Test email sent successfully to ${testEmail}`);

    // Log audit
    await supabase.from("audit_logs").insert({
      admin_id: user.id,
      action: "test_smtp",
      entity_type: "system_config",
      entity_id: "email_smtp",
      new_values: { test_email: testEmail, host: config.host },
    });

    return new Response(
      JSON.stringify({ success: true, message: "Test email sent successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("SMTP test error:", error);
    
    let errorMessage = "Failed to send test email";
    if (error instanceof Error) {
      if (error.message.includes("authentication")) {
        errorMessage = "SMTP authentication failed. Check your username and password.";
      } else if (error.message.includes("connect")) {
        errorMessage = "Could not connect to SMTP server. Check host and port.";
      } else if (error.message.includes("timeout")) {
        errorMessage = "Connection timed out. Check your firewall settings.";
      } else {
        errorMessage = error.message;
      }
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
