import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
  templateType?: "welcome" | "password_reset" | "idea_validated" | "project_created";
  templateData?: Record<string, any>;
}

/**
 * Email templates
 */
const getEmailTemplate = (type: string, data: Record<string, any>): { subject: string; html: string; text: string } => {
  switch (type) {
    case "welcome":
      return {
        subject: "Welcome to Codilla.ai - Get Started!",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>✨ Welcome to Codilla.ai!</h1>
                </div>
                <div class="content">
                  <p>Hi ${data.name || "there"},</p>
                  <p>Thank you for joining Codilla.ai! We're excited to help you transform your ideas into reality with AI-powered validation.</p>
                  <p><strong>You've received 100 free tokens</strong> to get started! Use them to:</p>
                  <ul>
                    <li>Validate your ideas with 3 AI agents</li>
                    <li>Track your projects through 10 development phases</li>
                    <li>Generate code with AI assistance</li>
                  </ul>
                  <p style="text-align: center;">
                    <a href="${data.dashboardUrl || "https://codilla.ai/dashboard"}" class="button">Go to Dashboard</a>
                  </p>
                  <p>If you have any questions, feel free to reach out to our support team.</p>
                  <p>Happy building!<br>The Codilla.ai Team</p>
                </div>
                <div class="footer">
                  <p>&copy; 2025 Codilla.ai. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `,
        text: `Welcome to Codilla.ai!\n\nHi ${data.name || "there"},\n\nThank you for joining! You've received 100 free tokens to get started.\n\nVisit your dashboard: ${data.dashboardUrl || "https://codilla.ai/dashboard"}\n\nBest regards,\nThe Codilla.ai Team`,
      };

    case "password_reset":
      return {
        subject: "Reset Your Codilla.ai Password",
        html: `
          <!DOCTYPE html>
          <html>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🔒 Password Reset Request</h1>
                </div>
                <div class="content">
                  <p>Hi ${data.name || "there"},</p>
                  <p>We received a request to reset your password. Click the button below to reset it:</p>
                  <p style="text-align: center;">
                    <a href="${data.resetUrl}" class="button">Reset Password</a>
                  </p>
                  <p>This link will expire in 24 hours.</p>
                  <p>If you didn't request this, you can safely ignore this email.</p>
                  <p>Best regards,<br>The Codilla.ai Team</p>
                </div>
              </div>
            </body>
          </html>
        `,
        text: `Password Reset Request\n\nHi ${data.name || "there"},\n\nClick here to reset your password: ${data.resetUrl}\n\nThis link expires in 24 hours.\n\nBest regards,\nThe Codilla.ai Team`,
      };

    case "idea_validated":
      return {
        subject: `Your Idea "${data.ideaTitle}" Has Been Validated!`,
        html: `
          <!DOCTYPE html>
          <html>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 Idea Validated!</h1>
                </div>
                <div class="content">
                  <p>Hi ${data.name || "there"},</p>
                  <p>Great news! Your idea "<strong>${data.ideaTitle}</strong>" has been validated by our AI agents.</p>
                  <p><strong>Consensus Score: ${data.consensusScore}/100</strong></p>
                  <p>You can now create a project and start the development process!</p>
                  <p style="text-align: center;">
                    <a href="${data.ideaUrl}" class="button">View Idea</a>
                  </p>
                  <p>Happy building!<br>The Codilla.ai Team</p>
                </div>
              </div>
            </body>
          </html>
        `,
        text: `Idea Validated!\n\nHi ${data.name},\n\nYour idea "${data.ideaTitle}" has been validated!\nConsensus Score: ${data.consensusScore}/100\n\nView your idea: ${data.ideaUrl}\n\nBest regards,\nThe Codilla.ai Team`,
      };

    default:
      throw new Error(`Unknown template type: ${type}`);
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth user (admin only for direct email sending)
    const authHeader = req.headers.get("Authorization")!;
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Get request body
    const emailRequest: EmailRequest = await req.json();

    // Validate input
    if (!emailRequest.to) {
      throw new Error("Recipient email is required");
    }

    // Get email credentials from environment
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const smtpFrom = Deno.env.get("SMTP_FROM") || smtpUser;

    if (!smtpHost || !smtpUser || !smtpPassword) {
      throw new Error("SMTP credentials not configured");
    }

    // Prepare email content
    let subject = emailRequest.subject;
    let html = emailRequest.html;
    let text = emailRequest.text || "";

    // Use template if specified
    if (emailRequest.templateType && emailRequest.templateData) {
      const template = getEmailTemplate(emailRequest.templateType, emailRequest.templateData);
      subject = template.subject;
      html = template.html;
      text = template.text;
    }

    // Initialize SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: true,
        auth: {
          username: smtpUser,
          password: smtpPassword,
        },
      },
    });

    // Send email
    await client.send({
      from: smtpFrom,
      to: emailRequest.to,
      subject,
      content: text,
      html,
    });

    await client.close();

    console.log("Email sent successfully to:", emailRequest.to);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
