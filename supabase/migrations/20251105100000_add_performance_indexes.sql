-- Add performance indexes for frequently queried columns
-- This migration adds indexes to improve query performance

-- Indexes for ideas table
CREATE INDEX IF NOT EXISTS idx_ideas_user_id_status ON ideas(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ideas_created_at ON ideas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ideas_consensus_score ON ideas(consensus_score DESC) WHERE status = 'validated';
CREATE INDEX IF NOT EXISTS idx_ideas_category ON ideas(category) WHERE category IS NOT NULL;

-- Indexes for projects table
CREATE INDEX IF NOT EXISTS idx_projects_user_id_created_at ON projects(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_idea_id ON projects(idea_id);
CREATE INDEX IF NOT EXISTS idx_projects_current_phase ON projects(current_phase);

-- Indexes for phases table
CREATE INDEX IF NOT EXISTS idx_phases_project_id_phase_number ON phases(project_id, phase_number);
CREATE INDEX IF NOT EXISTS idx_phases_status ON phases(status);
CREATE INDEX IF NOT EXISTS idx_phases_started_at ON phases(started_at DESC) WHERE started_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_phases_completed_at ON phases(completed_at DESC) WHERE completed_at IS NOT NULL;

-- Indexes for ai_validations table
CREATE INDEX IF NOT EXISTS idx_ai_validations_phase_id ON ai_validations(phase_id);
CREATE INDEX IF NOT EXISTS idx_ai_validations_agent ON ai_validations(agent);
CREATE INDEX IF NOT EXISTS idx_ai_validations_created_at ON ai_validations(created_at DESC);

-- Indexes for token_transactions table
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id_created_at ON token_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_transactions_transaction_type ON token_transactions(transaction_type);

-- Indexes for templates table
CREATE INDEX IF NOT EXISTS idx_templates_is_public ON templates(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_usage_count ON templates(usage_count DESC);

-- Indexes for ai_conversations table (if exists)
CREATE INDEX IF NOT EXISTS idx_ai_conversations_context_id ON ai_conversations(context_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON ai_conversations(created_at DESC);

-- Indexes for ai_requests table (if exists)
CREATE INDEX IF NOT EXISTS idx_ai_requests_user_id_created_at ON ai_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_requests_model_provider ON ai_requests(model_provider);
CREATE INDEX IF NOT EXISTS idx_ai_requests_status ON ai_requests(status);

-- Indexes for payment_transactions table (if exists)
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_razorpay_order_id ON payment_transactions(razorpay_order_id);

-- Indexes for user_roles table
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Add GIN index for JSONB columns for better search performance
CREATE INDEX IF NOT EXISTS idx_ideas_validation_summary_gin ON ideas USING GIN (validation_summary) WHERE validation_summary IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_phases_claude_validation_gin ON phases USING GIN (claude_validation) WHERE claude_validation IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_phases_gemini_validation_gin ON phases USING GIN (gemini_validation) WHERE gemini_validation IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_phases_codex_validation_gin ON phases USING GIN (codex_validation) WHERE codex_validation IS NOT NULL;

-- Add comment explaining the indexes
COMMENT ON INDEX idx_ideas_user_id_status IS 'Composite index for filtering ideas by user and status';
COMMENT ON INDEX idx_projects_user_id_created_at IS 'Composite index for listing user projects sorted by date';
COMMENT ON INDEX idx_phases_project_id_phase_number IS 'Composite index for phase lookup by project';
COMMENT ON INDEX idx_ideas_validation_summary_gin IS 'GIN index for JSONB validation summary search';
