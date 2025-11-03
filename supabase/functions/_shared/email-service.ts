import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

interface EmailConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
}

interface EmailTemplate {
  subject: string;
  html_body: string;
  text_body: string;
}

export async function sendEmail({
  to,
  templateKey,
  templateData,
  supabaseUrl,
  supabaseKey,
}: {
  to: string;
  templateKey: string;
  templateData: Record<string, any>;
  supabaseUrl: string;
  supabaseKey: string;
}): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get SMTP config
  const { data: emailConfig } = await supabase
    .from('system_config')
    .select('config_value')
    .eq('config_key', 'email_smtp')
    .single();

  if (!emailConfig) {
    throw new Error('Email configuration not found');
  }

  const config = emailConfig.config_value as EmailConfig;

  // Validate SMTP configuration
  if (!config.host || !config.username || !config.password) {
    console.error('Incomplete SMTP configuration');
    throw new Error('Email service not configured');
  }

  // Get template
  const { data: template } = await supabase
    .from('email_templates')
    .select('*')
    .eq('template_key', templateKey)
    .single();

  if (!template) {
    throw new Error(`Email template '${templateKey}' not found`);
  }

  // Render template with data
  const subject = renderTemplate(template.subject, templateData);
  const htmlBody = renderTemplate(template.html_body, templateData);
  const textBody = renderTemplate(template.text_body || '', templateData);

  // Add to email queue
  const { error: queueError } = await supabase
    .from('email_queue')
    .insert({
      to_email: to,
      template_key: templateKey,
      template_data: templateData,
      status: 'pending',
    });

  if (queueError) {
    console.error('Failed to queue email:', queueError);
    throw new Error('Failed to queue email');
  }

  // In a production environment, you would process the queue
  // with a separate worker or cron job that actually sends emails
  // via SMTP using a library like nodemailer for Deno
  console.log(`Email queued for ${to} with template ${templateKey}`);
}

function renderTemplate(template: string, data: Record<string, any>): string {
  let rendered = template;
  
  // Replace {{variable}} with actual data
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(regex, String(data[key] || ''));
  });
  
  return rendered;
}

export async function queueEmail({
  to,
  templateKey,
  templateData,
  supabaseUrl,
  supabaseKey,
}: {
  to: string;
  templateKey: string;
  templateData: Record<string, any>;
  supabaseUrl: string;
  supabaseKey: string;
}): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { error } = await supabase
    .from('email_queue')
    .insert({
      to_email: to,
      template_key: templateKey,
      template_data: templateData,
      status: 'pending',
    });

  if (error) {
    console.error('Failed to queue email:', error);
    throw new Error('Failed to queue email');
  }
}
