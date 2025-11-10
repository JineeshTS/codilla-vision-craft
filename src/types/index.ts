/**
 * Centralized type definitions for the entire application
 */

import { User as SupabaseUser, Session } from '@supabase/supabase-js';

// ============================================================================
// USER & AUTHENTICATION TYPES
// ============================================================================

export interface User extends SupabaseUser {
  email?: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthSession extends Session {
  user: User;
}

// ============================================================================
// IDEA TYPES
// ============================================================================

export interface Idea {
  id: string;
  user_id: string;
  title: string;
  description: string;
  problem_statement: string | null;
  target_audience: string | null;
  business_model: string | null;
  category: string | null;
  unique_value_proposition: string | null;
  consensus_score: number | null;
  screening_score: number | null;
  domain_knowledge_score: number | null;
  passion_score: number | null;
  business_validation_score: number | null;
  tokens_spent: number;
  status: 'draft' | 'validating' | 'validated' | 'in_development' | 'launched' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
  validation_summary: any;
  business_research_data: any;
}

export interface IdeaFormData {
  title: string;
  description: string;
  problem_statement?: string;
  target_audience?: string;
  unique_value?: string;
}

export interface IdeaWithDetails extends Idea {
  projects?: Project[];
}

// ============================================================================
// PROJECT TYPES
// ============================================================================

export interface Project {
  id: string;
  user_id: string;
  idea_id: string;
  name: string;
  current_phase: number;
  progress_percentage: number;
  repository_url: string | null;
  deployment_url: string | null;
  created_at: string;
  updated_at: string;
  prd_data: any;
  user_personas: any;
  user_stories: any;
  mvp_features: any;
}

export interface ProjectWithIdea extends Project {
  ideas?: Idea;
}

export interface PhaseProgress {
  phase: number;
  completed: boolean;
  tasks_completed: number;
  total_tasks: number;
}

// ============================================================================
// TOKEN & TRANSACTION TYPES
// ============================================================================

export interface TokenBalance {
  user_id: string;
  balance: number;
  last_updated: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'purchase' | 'usage' | 'refund' | 'bonus';
  description: string | null;
  created_at: string;
}

export interface TokenPackage {
  id: string;
  name: string;
  tokens: number;
  price: number;
  description: string | null;
  popular: boolean;
}

// ============================================================================
// AI & CONVERSATION TYPES
// ============================================================================

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface AIConversation {
  id: string;
  user_id: string;
  project_id: string | null;
  phase_id: string | null;
  task_id: string | null;
  messages: AIMessage[];
  created_at: string;
  updated_at: string;
}

export interface AIRequest {
  prompt: string;
  context?: Record<string, unknown>;
  model?: string;
  temperature?: number;
}

export interface AIResponse {
  content: string;
  tokens_used: number;
  model: string;
  timestamp: string;
}

// ============================================================================
// PHASE & TASK TYPES
// ============================================================================

export interface PhaseTask {
  id: string;
  title: string;
  description: string;
  type: 'research' | 'design' | 'development' | 'testing' | 'deployment';
  estimatedTime: string;
  dependencies?: string[];
  component?: string;
  aiEnabled: boolean;
  requiresIntegration?: boolean;
}

export interface Phase {
  id: number;
  name: string;
  description: string;
  icon: string;
  tasks: PhaseTask[];
  estimatedDuration: string;
  deliverables: string[];
}

export interface TaskArtifact {
  task_id: string;
  data: Record<string, unknown>;
  completed: boolean;
  updated_at: string;
}

export interface PhaseArtifacts {
  id: string;
  project_id: string;
  phase_number: number;
  artifacts: Record<string, TaskArtifact>;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

export interface BaseTaskProps {
  projectId: string;
  phaseNumber: number;
  taskId: string;
}

export interface LoadingStateProps {
  variant?: 'page' | 'inline' | 'skeleton';
  message?: string;
}

export interface ErrorStateProps {
  error: Error | string;
  onRetry?: () => void;
  variant?: 'page' | 'inline';
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'email' | 'password' | 'number' | 'select';
  placeholder?: string;
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    message?: string;
  };
}

export interface FormErrors {
  [key: string]: string | undefined;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;
