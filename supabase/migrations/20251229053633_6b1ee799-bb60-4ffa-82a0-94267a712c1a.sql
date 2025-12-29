-- Insert email template for new idea moderation notifications
INSERT INTO public.email_templates (template_key, name, subject, html_body, text_body)
VALUES (
  'new_idea_moderation',
  'New Idea Moderation Required',
  'New Idea Submitted: {{idea_title}}',
  '<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #6366f1;">New Idea Requires Moderation</h1>
    <p>A new idea has been submitted and requires your review:</p>
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h2 style="margin-top: 0; color: #1f2937;">{{idea_title}}</h2>
      <p><strong>Submitted by:</strong> {{submitter_email}}</p>
    </div>
    <p>Please review this idea and approve or reject it.</p>
    <a href="{{moderation_url}}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
      Review Idea
    </a>
    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
      This is an automated notification from the admin system.
    </p>
  </div>
</body>
</html>',
  'New Idea Requires Moderation

A new idea has been submitted and requires your review:

Title: {{idea_title}}
Submitted by: {{submitter_email}}

Please log in to the admin panel to review and moderate this idea.

Moderation URL: {{moderation_url}}

This is an automated notification from the admin system.'
)
ON CONFLICT (template_key) DO UPDATE SET
  name = EXCLUDED.name,
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  text_body = EXCLUDED.text_body,
  updated_at = now();