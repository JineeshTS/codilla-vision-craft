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

interface EmailTemplate {
  subject: string;
  html_body: string;
  text_body: string | null;
}

interface QueuedEmail {
  id: string;
  to_email: string;
  template_key: string;
  template_data: Record<string, unknown>;
}

// Render template with data
function renderTemplate(template: string, data: Record<string, unknown>): string {
  let rendered = template;
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(regex, String(data[key] || ''));
  });
  return rendered;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log("Starting email queue processor...");

    // Get SMTP configuration
    const { data: configData, error: configError } = await supabase
      .from("system_config")
      .select("config_value")
      .eq("config_key", "email_smtp")
      .single();

    if (configError || !configData) {
      console.log("No SMTP configuration found, skipping email processing");
      return new Response(
        JSON.stringify({ message: "No SMTP configuration", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const smtpConfig = configData.config_value as SmtpConfig;

    if (!smtpConfig.host || !smtpConfig.username || !smtpConfig.password) {
      console.log("Incomplete SMTP configuration");
      return new Response(
        JSON.stringify({ message: "Incomplete SMTP configuration", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get pending emails (limit to 10 per run to avoid timeouts)
    const { data: pendingEmails, error: queueError } = await supabase
      .from("email_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(10);

    if (queueError) {
      throw new Error(`Failed to fetch email queue: ${queueError.message}`);
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      console.log("No pending emails in queue");
      return new Response(
        JSON.stringify({ message: "No pending emails", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${pendingEmails.length} pending emails`);

    // Get all unique template keys
    const templateKeys = [...new Set(pendingEmails.map(e => e.template_key))];
    
    // Fetch templates
    const { data: templates, error: templateError } = await supabase
      .from("email_templates")
      .select("template_key, subject, html_body, text_body")
      .in("template_key", templateKeys);

    if (templateError) {
      throw new Error(`Failed to fetch templates: ${templateError.message}`);
    }

    const templateMap = new Map<string, EmailTemplate>();
    templates?.forEach(t => templateMap.set(t.template_key, t));

    // Create SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: smtpConfig.host,
        port: smtpConfig.port,
        tls: smtpConfig.secure ?? smtpConfig.port === 465,
        auth: {
          username: smtpConfig.username,
          password: smtpConfig.password,
        },
      },
    });

    let successCount = 0;
    let failCount = 0;

    for (const email of pendingEmails as QueuedEmail[]) {
      try {
        const template = templateMap.get(email.template_key);
        
        if (!template) {
          console.error(`Template not found: ${email.template_key}`);
          await supabase
            .from("email_queue")
            .update({
              status: "failed",
              error_message: `Template not found: ${email.template_key}`,
            })
            .eq("id", email.id);
          failCount++;
          continue;
        }

        // Render template with data
        const subject = renderTemplate(template.subject, email.template_data);
        const htmlBody = renderTemplate(template.html_body, email.template_data);

        // Send email
        await client.send({
          from: `${smtpConfig.fromName} <${smtpConfig.fromEmail || smtpConfig.username}>`,
          to: email.to_email,
          subject: subject,
          content: "auto",
          html: htmlBody,
        });

        // Update queue status
        await supabase
          .from("email_queue")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
          })
          .eq("id", email.id);

        console.log(`Email sent successfully to ${email.to_email}`);
        successCount++;
      } catch (emailError) {
        console.error(`Failed to send email to ${email.to_email}:`, emailError);
        
        await supabase
          .from("email_queue")
          .update({
            status: "failed",
            error_message: emailError instanceof Error ? emailError.message : "Unknown error",
          })
          .eq("id", email.id);
        
        failCount++;
      }
    }

    await client.close();

    console.log(`Email processing complete. Success: ${successCount}, Failed: ${failCount}`);

    return new Response(
      JSON.stringify({
        message: "Email queue processed",
        processed: pendingEmails.length,
        success: successCount,
        failed: failCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Email queue processor error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
