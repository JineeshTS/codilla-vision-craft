-- Insert email templates for idea moderation notifications
INSERT INTO public.email_templates (template_key, name, subject, html_body, text_body)
VALUES 
  (
    'idea_approved',
    'Idea Approved Notification',
    'Your idea "{{idea_title}}" has been approved!',
    '<h1>Great news!</h1><p>Your idea <strong>"{{idea_title}}"</strong> has been approved and is now ready for the next steps.</p><p>You can now proceed with validating and developing your idea.</p><p><a href="{{app_url}}/ideas/{{idea_id}}">View your idea</a></p><p>Best regards,<br>The Team</p>',
    'Great news! Your idea "{{idea_title}}" has been approved and is now ready for the next steps. You can now proceed with validating and developing your idea. View your idea at: {{app_url}}/ideas/{{idea_id}}'
  ),
  (
    'idea_rejected',
    'Idea Rejected Notification',
    'Update on your idea "{{idea_title}}"',
    '<h1>Update on your idea</h1><p>Unfortunately, your idea <strong>"{{idea_title}}"</strong> was not approved at this time.</p>{{#if rejection_reason}}<p><strong>Reason:</strong> {{rejection_reason}}</p>{{/if}}<p>You can submit a new idea or revise and resubmit.</p><p><a href="{{app_url}}/ideas">View your ideas</a></p><p>Best regards,<br>The Team</p>',
    'Update on your idea: Unfortunately, your idea "{{idea_title}}" was not approved at this time. {{#if rejection_reason}}Reason: {{rejection_reason}}{{/if}} You can submit a new idea or revise and resubmit.'
  )
ON CONFLICT (template_key) DO NOTHING;