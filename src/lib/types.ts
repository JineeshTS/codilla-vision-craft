/**
 * Shared TypeScript types and interfaces for the application
 */

import { User as SupabaseUser } from "@supabase/supabase-js";

/**
 * Extended user type with profile information
 */
export interface User extends SupabaseUser {
  full_name?: string;
  avatar_url?: string;
  total_tokens?: number;
  tokens_used?: number;
}

/**
 * Idea status types
 */
export type IdeaStatus =
  | "draft"
  | "validating"
  | "validated"
  | "in_development"
  | "completed"
  | "archived";

/**
 * Phase status types
 */
export type PhaseStatus = "pending" | "in_progress" | "completed" | "failed";

/**
 * AI agent types
 */
export type AIAgent = "claude" | "gemini" | "codex";

/**
 * Token transaction types
 */
export type TokenTransactionType = "purchase" | "consumption" | "refund" | "bonus";

/**
 * Phase information
 */
export interface Phase {
  id: string;
  project_id: string;
  phase_number: number;
  phase_name: string;
  status: PhaseStatus;
  claude_validation?: ValidationResult;
  gemini_validation?: ValidationResult;
  codex_validation?: ValidationResult;
  consensus_reached: boolean;
  tokens_spent: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * AI validation result
 */
export interface ValidationResult {
  score: number;
  feedback: string;
  approved: boolean;
  strengths?: string[];
  concerns?: string[];
  recommendations?: string[];
}

/**
 * Status color configuration
 */
export interface StatusConfig {
  color: string;
  bgColor: string;
  textColor: string;
  label: string;
}

/**
 * Agent configuration
 */
export interface AgentConfig {
  name: string;
  color: string;
  icon: string;
  description: string;
}
