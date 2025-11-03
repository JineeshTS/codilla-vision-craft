-- Insert standard app templates with authentication and admin features

-- Authentication Starter Template
INSERT INTO public.templates (name, description, category, template_data, usage_count, is_public)
VALUES (
  'Authentication Starter',
  'Complete authentication system with sign-up, login, password reset, and user profiles. Includes email verification and session management.',
  'Authentication',
  '{
    "problem": "Building secure authentication from scratch is time-consuming and error-prone",
    "target_audience": "Developers building any web application that requires user accounts",
    "unique_value_proposition": "Production-ready authentication with security best practices built-in",
    "features": [
      "Email/password authentication",
      "User profile management",
      "Password reset flow",
      "Email verification",
      "Session management",
      "Protected routes",
      "Remember me functionality"
    ],
    "database_schema": {
      "tables": ["profiles"],
      "rls_enabled": true,
      "triggers": ["on_auth_user_created"]
    },
    "components": [
      "SignUp page with validation",
      "SignIn page",
      "ForgotPassword page",
      "Profile page",
      "AuthGuard hook",
      "Protected route wrapper"
    ]
  }'::jsonb,
  0,
  true
);

-- Admin Dashboard Template
INSERT INTO public.templates (name, description, category, template_data, usage_count, is_public)
VALUES (
  'Admin Dashboard with Roles',
  'Role-based admin system with user management, activity logs, and access control. Includes admin, moderator, and user roles with proper security.',
  'Admin',
  '{
    "problem": "Building secure role-based access control and admin interfaces requires deep security knowledge",
    "target_audience": "Applications requiring administrative oversight and user management",
    "unique_value_proposition": "Secure role-based system following Supabase security best practices with no privilege escalation vulnerabilities",
    "features": [
      "Role-based access control (Admin, Moderator, User)",
      "User management interface",
      "Activity logs and audit trail",
      "Bulk user operations",
      "Role assignment interface",
      "Analytics dashboard",
      "Settings management"
    ],
    "database_schema": {
      "tables": ["user_roles", "activity_logs"],
      "enums": ["app_role"],
      "rls_enabled": true,
      "functions": ["has_role", "log_activity"],
      "policies": ["admin_only", "moderator_read"]
    },
    "components": [
      "Admin dashboard layout",
      "User management table",
      "Role assignment dialog",
      "Activity log viewer",
      "Admin route guards",
      "Role check hooks"
    ],
    "security_features": [
      "Server-side role validation",
      "Security definer functions",
      "Audit logging",
      "No client-side role storage"
    ]
  }'::jsonb,
  0,
  true
);

-- Full App Starter Template
INSERT INTO public.templates (name, description, category, template_data, usage_count, is_public)
VALUES (
  'Full App Starter (Auth + Admin)',
  'Complete application foundation with authentication, user profiles, role-based admin panel, and user management. Everything you need to start building.',
  'Full Stack',
  '{
    "problem": "Starting a new application requires building the same authentication and admin features repeatedly",
    "target_audience": "Developers and startups building full-featured web applications",
    "unique_value_proposition": "Production-ready foundation with authentication, roles, and admin features - start building your unique features immediately",
    "features": [
      "Complete authentication system",
      "User profiles with avatars",
      "Role-based access (Admin/User)",
      "Admin dashboard",
      "User management",
      "Activity logging",
      "Email notifications",
      "Settings management",
      "Analytics dashboard",
      "Dark mode support"
    ],
    "database_schema": {
      "tables": ["profiles", "user_roles", "activity_logs", "notifications"],
      "enums": ["app_role", "notification_type"],
      "rls_enabled": true,
      "triggers": ["on_auth_user_created", "log_user_actions"],
      "functions": ["has_role", "log_activity", "send_notification"],
      "policies": ["user_own_data", "admin_all_access"]
    },
    "components": [
      "Auth pages (SignUp, SignIn, ForgotPassword)",
      "User dashboard",
      "Profile management",
      "Admin dashboard",
      "User management panel",
      "Activity logs viewer",
      "Notifications center",
      "Settings page",
      "Protected route system"
    ],
    "edge_functions": [
      "send-welcome-email",
      "handle-role-change",
      "generate-activity-report"
    ],
    "security_features": [
      "Server-side authentication",
      "Secure role management",
      "Input validation with Zod",
      "XSS protection",
      "CSRF protection",
      "Rate limiting on auth endpoints"
    ]
  }'::jsonb,
  0,
  true
);

-- User Management Template
INSERT INTO public.templates (name, description, category, template_data, usage_count, is_public)
VALUES (
  'User Management System',
  'Comprehensive user management with profiles, roles, permissions, and team features. Perfect for B2B SaaS applications.',
  'User Management',
  '{
    "problem": "Managing users, teams, and permissions in multi-tenant applications is complex",
    "target_audience": "B2B SaaS platforms and team collaboration tools",
    "unique_value_proposition": "Multi-tenant user management with team hierarchies and granular permissions",
    "features": [
      "User profiles and settings",
      "Team/organization management",
      "Role-based permissions",
      "Team member invitations",
      "User directory and search",
      "Bulk user import/export",
      "User activity tracking",
      "Session management"
    ],
    "database_schema": {
      "tables": ["profiles", "teams", "team_members", "user_roles", "invitations"],
      "enums": ["app_role", "team_role", "invitation_status"],
      "rls_enabled": true,
      "functions": ["has_role", "is_team_member", "can_manage_team"],
      "policies": ["team_member_access", "admin_global_access"]
    },
    "components": [
      "User profile editor",
      "Team management dashboard",
      "Member invitation flow",
      "Role assignment interface",
      "User directory",
      "Team switcher",
      "Permission gates"
    ]
  }'::jsonb,
  0,
  true
);

-- Multi-tenant SaaS Template
INSERT INTO public.templates (name, description, category, template_data, usage_count, is_public)
VALUES (
  'Multi-tenant SaaS Starter',
  'Enterprise-ready SaaS template with organization management, team workspaces, billing integration, and subscription management.',
  'SaaS',
  '{
    "problem": "Building multi-tenant SaaS infrastructure with billing and team management is extremely complex",
    "target_audience": "SaaS founders and teams building B2B products",
    "unique_value_proposition": "Complete multi-tenant architecture with billing, teams, and enterprise features out of the box",
    "features": [
      "Organization/workspace management",
      "Team member management",
      "Subscription billing (Stripe/Razorpay)",
      "Usage-based pricing",
      "Feature flags per plan",
      "Admin panel for each org",
      "Audit logs",
      "API key management",
      "Webhook management"
    ],
    "database_schema": {
      "tables": ["organizations", "org_members", "subscriptions", "usage_records", "api_keys", "webhooks"],
      "enums": ["org_role", "subscription_status", "plan_type"],
      "rls_enabled": true,
      "functions": ["is_org_admin", "check_feature_access", "track_usage"],
      "policies": ["org_isolation", "admin_org_access", "billing_readonly"]
    },
    "components": [
      "Organization settings",
      "Team management",
      "Billing dashboard",
      "Usage analytics",
      "API keys manager",
      "Webhook configuration",
      "Plan selection",
      "Invoice history"
    ],
    "edge_functions": [
      "create-subscription",
      "handle-webhook",
      "track-usage",
      "send-invoice",
      "check-limits"
    ]
  }'::jsonb,
  0,
  true
);