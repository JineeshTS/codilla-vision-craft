export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          context_id: string | null
          context_type: string | null
          created_at: string
          id: string
          messages: Json | null
          phase_number: number | null
          total_tokens_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          id?: string
          messages?: Json | null
          phase_number?: number | null
          total_tokens_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          id?: string
          messages?: Json | null
          phase_number?: number | null
          total_tokens_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_requests: {
        Row: {
          ai_agent: string
          created_at: string | null
          error_message: string | null
          execution_time: number | null
          id: string
          idea_id: string | null
          phase_id: string | null
          prompt: string
          request_type: string
          response: string | null
          success: boolean | null
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          ai_agent: string
          created_at?: string | null
          error_message?: string | null
          execution_time?: number | null
          id?: string
          idea_id?: string | null
          phase_id?: string | null
          prompt: string
          request_type: string
          response?: string | null
          success?: boolean | null
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          ai_agent?: string
          created_at?: string | null
          error_message?: string | null
          execution_time?: number | null
          id?: string
          idea_id?: string | null
          phase_id?: string | null
          prompt?: string
          request_type?: string
          response?: string | null
          success?: boolean | null
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_requests_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_requests_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phase_progress"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_validations: {
        Row: {
          agent: Database["public"]["Enums"]["ai_agent"]
          created_at: string
          feedback: string | null
          id: string
          phase_id: string
          score: number | null
          tokens_consumed: number
          validation_data: Json
        }
        Insert: {
          agent: Database["public"]["Enums"]["ai_agent"]
          created_at?: string
          feedback?: string | null
          id?: string
          phase_id: string
          score?: number | null
          tokens_consumed: number
          validation_data: Json
        }
        Update: {
          agent?: Database["public"]["Enums"]["ai_agent"]
          created_at?: string
          feedback?: string | null
          id?: string
          phase_id?: string
          score?: number | null
          tokens_consumed?: number
          validation_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ai_validations_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
        ]
      }
      artifact_versions: {
        Row: {
          artifact_data: Json
          artifact_id: string
          change_summary: string | null
          created_at: string
          created_by: string
          id: string
          is_auto_save: boolean | null
          project_id: string
          version_number: number
        }
        Insert: {
          artifact_data?: Json
          artifact_id: string
          change_summary?: string | null
          created_at?: string
          created_by: string
          id?: string
          is_auto_save?: boolean | null
          project_id: string
          version_number: number
        }
        Update: {
          artifact_data?: Json
          artifact_id?: string
          change_summary?: string | null
          created_at?: string
          created_by?: string
          id?: string
          is_auto_save?: boolean | null
          project_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "artifact_versions_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "phase_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artifact_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      change_requests: {
        Row: {
          affected_components: string[] | null
          approved_at: string | null
          created_at: string
          description: string
          id: string
          impact_analysis: string | null
          implemented_at: string | null
          priority: string
          project_id: string
          status: string
          title: string
          updated_at: string
          user_approved: boolean | null
          user_id: string
        }
        Insert: {
          affected_components?: string[] | null
          approved_at?: string | null
          created_at?: string
          description: string
          id?: string
          impact_analysis?: string | null
          implemented_at?: string | null
          priority?: string
          project_id: string
          status?: string
          title: string
          updated_at?: string
          user_approved?: boolean | null
          user_id: string
        }
        Update: {
          affected_components?: string[] | null
          approved_at?: string | null
          created_at?: string
          description?: string
          id?: string
          impact_analysis?: string | null
          implemented_at?: string | null
          priority?: string
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
          user_approved?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      code_commits: {
        Row: {
          ai_model_used: string | null
          code_content: string | null
          commit_message: string | null
          commit_sha: string
          commit_url: string
          created_at: string | null
          file_path: string
          github_repo: string
          id: string
          optimized_for_lovable: boolean | null
          phase_number: number | null
          project_id: string | null
          task_id: string | null
          user_id: string | null
        }
        Insert: {
          ai_model_used?: string | null
          code_content?: string | null
          commit_message?: string | null
          commit_sha: string
          commit_url: string
          created_at?: string | null
          file_path: string
          github_repo: string
          id?: string
          optimized_for_lovable?: boolean | null
          phase_number?: number | null
          project_id?: string | null
          task_id?: string | null
          user_id?: string | null
        }
        Update: {
          ai_model_used?: string | null
          code_content?: string | null
          commit_message?: string | null
          commit_sha?: string
          commit_url?: string
          created_at?: string | null
          file_path?: string
          github_repo?: string
          id?: string
          optimized_for_lovable?: boolean | null
          phase_number?: number | null
          project_id?: string | null
          task_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "code_commits_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      development_prompts: {
        Row: {
          category: string
          created_at: string
          dependencies: string[] | null
          description: string
          estimated_tokens: number
          executed_at: string | null
          execution_result: string | null
          id: string
          project_id: string
          prompt_text: string
          sequence_number: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          dependencies?: string[] | null
          description: string
          estimated_tokens?: number
          executed_at?: string | null
          execution_result?: string | null
          id?: string
          project_id: string
          prompt_text: string
          sequence_number: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          dependencies?: string[] | null
          description?: string
          estimated_tokens?: number
          executed_at?: string | null
          execution_result?: string | null
          id?: string
          project_id?: string
          prompt_text?: string
          sequence_number?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "development_prompts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ideas: {
        Row: {
          audience_size: string | null
          business_model: string | null
          business_models: Json | null
          business_research_data: Json | null
          business_validation_score: number | null
          category: string | null
          competitive_landscape: string | null
          consensus_score: number | null
          created_at: string
          current_phase: number | null
          current_solutions: Json | null
          decision_status: string | null
          demographics: Json | null
          description: string
          domain_knowledge_score: number | null
          estimated_market_size: string | null
          expected_outcomes: Json | null
          id: string
          inspiration_source: string | null
          key_differentiator: string | null
          passion_score: number | null
          phase_2_completed_at: string | null
          phase_2_data: Json | null
          phase_2_decision: string | null
          problem_statement: string | null
          psychographics: string | null
          screening_score: number | null
          status: Database["public"]["Enums"]["idea_status"]
          target_audience: string | null
          target_geography: string | null
          title: string
          tokens_spent: number
          unique_value_proposition: string | null
          updated_at: string
          user_id: string
          validation_summary: Json | null
        }
        Insert: {
          audience_size?: string | null
          business_model?: string | null
          business_models?: Json | null
          business_research_data?: Json | null
          business_validation_score?: number | null
          category?: string | null
          competitive_landscape?: string | null
          consensus_score?: number | null
          created_at?: string
          current_phase?: number | null
          current_solutions?: Json | null
          decision_status?: string | null
          demographics?: Json | null
          description: string
          domain_knowledge_score?: number | null
          estimated_market_size?: string | null
          expected_outcomes?: Json | null
          id?: string
          inspiration_source?: string | null
          key_differentiator?: string | null
          passion_score?: number | null
          phase_2_completed_at?: string | null
          phase_2_data?: Json | null
          phase_2_decision?: string | null
          problem_statement?: string | null
          psychographics?: string | null
          screening_score?: number | null
          status?: Database["public"]["Enums"]["idea_status"]
          target_audience?: string | null
          target_geography?: string | null
          title: string
          tokens_spent?: number
          unique_value_proposition?: string | null
          updated_at?: string
          user_id: string
          validation_summary?: Json | null
        }
        Update: {
          audience_size?: string | null
          business_model?: string | null
          business_models?: Json | null
          business_research_data?: Json | null
          business_validation_score?: number | null
          category?: string | null
          competitive_landscape?: string | null
          consensus_score?: number | null
          created_at?: string
          current_phase?: number | null
          current_solutions?: Json | null
          decision_status?: string | null
          demographics?: Json | null
          description?: string
          domain_knowledge_score?: number | null
          estimated_market_size?: string | null
          expected_outcomes?: Json | null
          id?: string
          inspiration_source?: string | null
          key_differentiator?: string | null
          passion_score?: number | null
          phase_2_completed_at?: string | null
          phase_2_data?: Json | null
          phase_2_decision?: string | null
          problem_statement?: string | null
          psychographics?: string | null
          screening_score?: number | null
          status?: Database["public"]["Enums"]["idea_status"]
          target_audience?: string | null
          target_geography?: string | null
          title?: string
          tokens_spent?: number
          unique_value_proposition?: string | null
          updated_at?: string
          user_id?: string
          validation_summary?: Json | null
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          razorpay_order_id: string
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          status: string
          tokens_purchased: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          razorpay_order_id: string
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          tokens_purchased: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          razorpay_order_id?: string
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          tokens_purchased?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      phase_artifacts: {
        Row: {
          artifact_data: Json
          artifact_type: string
          created_at: string | null
          file_url: string | null
          id: string
          phase_number: number
          project_id: string
          task_id: string
          updated_at: string | null
        }
        Insert: {
          artifact_data?: Json
          artifact_type: string
          created_at?: string | null
          file_url?: string | null
          id?: string
          phase_number: number
          project_id: string
          task_id: string
          updated_at?: string | null
        }
        Update: {
          artifact_data?: Json
          artifact_type?: string
          created_at?: string | null
          file_url?: string | null
          id?: string
          phase_number?: number
          project_id?: string
          task_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phase_artifacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_progress: {
        Row: {
          ai_decision: string | null
          ai_feedback: Json | null
          completed_at: string | null
          completed_tasks: Json | null
          created_at: string | null
          id: string
          phase_name: string
          phase_number: number
          progress: number | null
          project_id: string | null
          stages: Json | null
          started_at: string | null
          status: string | null
          task_outputs: Json | null
          tokens_used: number | null
          updated_at: string | null
        }
        Insert: {
          ai_decision?: string | null
          ai_feedback?: Json | null
          completed_at?: string | null
          completed_tasks?: Json | null
          created_at?: string | null
          id?: string
          phase_name: string
          phase_number: number
          progress?: number | null
          project_id?: string | null
          stages?: Json | null
          started_at?: string | null
          status?: string | null
          task_outputs?: Json | null
          tokens_used?: number | null
          updated_at?: string | null
        }
        Update: {
          ai_decision?: string | null
          ai_feedback?: Json | null
          completed_at?: string | null
          completed_tasks?: Json | null
          created_at?: string | null
          id?: string
          phase_name?: string
          phase_number?: number
          progress?: number | null
          project_id?: string | null
          stages?: Json | null
          started_at?: string | null
          status?: string | null
          task_outputs?: Json | null
          tokens_used?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phase_progress_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      phases: {
        Row: {
          claude_validation: Json | null
          codex_validation: Json | null
          completed_at: string | null
          consensus_reached: boolean | null
          created_at: string
          gemini_validation: Json | null
          id: string
          phase_name: string
          phase_number: number
          project_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["phase_status"]
          tokens_spent: number
          updated_at: string
        }
        Insert: {
          claude_validation?: Json | null
          codex_validation?: Json | null
          completed_at?: string | null
          consensus_reached?: boolean | null
          created_at?: string
          gemini_validation?: Json | null
          id?: string
          phase_name: string
          phase_number: number
          project_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["phase_status"]
          tokens_spent?: number
          updated_at?: string
        }
        Update: {
          claude_validation?: Json | null
          codex_validation?: Json | null
          completed_at?: string | null
          consensus_reached?: boolean | null
          created_at?: string
          gemini_validation?: Json | null
          id?: string
          phase_name?: string
          phase_number?: number
          project_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["phase_status"]
          tokens_spent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          github_avatar_url: string | null
          github_token: string | null
          github_username: string | null
          id: string
          last_active_at: string | null
          selected_github_repo: string | null
          token_balance: number
          tokens_used: number
          total_tokens: number
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          github_avatar_url?: string | null
          github_token?: string | null
          github_username?: string | null
          id: string
          last_active_at?: string | null
          selected_github_repo?: string | null
          token_balance?: number
          tokens_used?: number
          total_tokens?: number
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          github_avatar_url?: string | null
          github_token?: string | null
          github_username?: string | null
          id?: string
          last_active_at?: string | null
          selected_github_repo?: string | null
          token_balance?: number
          tokens_used?: number
          total_tokens?: number
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          current_phase: number
          deployment_url: string | null
          id: string
          idea_id: string
          mvp_features: Json | null
          name: string
          phase_3_completed_at: string | null
          phase_5_completed_at: string | null
          prd_data: Json | null
          progress_percentage: number
          repository_url: string | null
          selected_template_id: string | null
          updated_at: string
          user_id: string
          user_personas: Json | null
          user_stories: Json | null
        }
        Insert: {
          created_at?: string
          current_phase?: number
          deployment_url?: string | null
          id?: string
          idea_id: string
          mvp_features?: Json | null
          name: string
          phase_3_completed_at?: string | null
          phase_5_completed_at?: string | null
          prd_data?: Json | null
          progress_percentage?: number
          repository_url?: string | null
          selected_template_id?: string | null
          updated_at?: string
          user_id: string
          user_personas?: Json | null
          user_stories?: Json | null
        }
        Update: {
          created_at?: string
          current_phase?: number
          deployment_url?: string | null
          id?: string
          idea_id?: string
          mvp_features?: Json | null
          name?: string
          phase_3_completed_at?: string | null
          phase_5_completed_at?: string | null
          prd_data?: Json | null
          progress_percentage?: number
          repository_url?: string | null
          selected_template_id?: string | null
          updated_at?: string
          user_id?: string
          user_personas?: Json | null
          user_stories?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_selected_template_id_fkey"
            columns: ["selected_template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_executions: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          execution_order: number
          execution_time_ms: number | null
          generated_code: string | null
          id: string
          preview_url: string | null
          project_id: string
          prompt_id: string
          started_at: string
          tokens_used: number | null
          user_approved: boolean | null
          user_feedback: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          execution_order: number
          execution_time_ms?: number | null
          generated_code?: string | null
          id?: string
          preview_url?: string | null
          project_id: string
          prompt_id: string
          started_at?: string
          tokens_used?: number | null
          user_approved?: boolean | null
          user_feedback?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          execution_order?: number
          execution_time_ms?: number | null
          generated_code?: string | null
          id?: string
          preview_url?: string | null
          project_id?: string
          prompt_id?: string
          started_at?: string
          tokens_used?: number | null
          user_approved?: boolean | null
          user_feedback?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_executions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_executions_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "development_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      reusable_templates: {
        Row: {
          category: string
          code: string
          created_at: string | null
          dependencies: Json | null
          description: string
          id: string
          name: string
          tokens_saved: number | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category: string
          code: string
          created_at?: string | null
          dependencies?: Json | null
          description: string
          id?: string
          name: string
          tokens_saved?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string
          code?: string
          created_at?: string | null
          dependencies?: Json | null
          description?: string
          id?: string
          name?: string
          tokens_saved?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      templates: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          template_data: Json
          updated_at: string
          usage_count: number
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          template_data: Json
          updated_at?: string
          usage_count?: number
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          template_data?: Json
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      token_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          transaction_type: Database["public"]["Enums"]["token_transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          transaction_type: Database["public"]["Enums"]["token_transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          transaction_type?: Database["public"]["Enums"]["token_transaction_type"]
          user_id?: string
        }
        Relationships: []
      }
      ui_templates: {
        Row: {
          category: string
          component_code: string | null
          created_at: string | null
          created_by: string | null
          customizable_fields: Json | null
          dependencies: Json | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          preview_image_url: string | null
          tailwind_config: Json | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category: string
          component_code?: string | null
          created_at?: string | null
          created_by?: string | null
          customizable_fields?: Json | null
          dependencies?: Json | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          preview_image_url?: string | null
          tailwind_config?: Json | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string
          component_code?: string | null
          created_at?: string | null
          created_by?: string | null
          customizable_fields?: Json | null
          dependencies?: Json | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          preview_image_url?: string | null
          tailwind_config?: Json | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_next_version_number: {
        Args: { p_artifact_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      ai_agent: "claude" | "gemini" | "codex"
      app_role: "admin" | "user"
      idea_status:
        | "draft"
        | "validating"
        | "validated"
        | "in_development"
        | "completed"
        | "archived"
      phase_status: "pending" | "in_progress" | "completed" | "failed"
      token_transaction_type: "purchase" | "consumption" | "refund" | "bonus"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ai_agent: ["claude", "gemini", "codex"],
      app_role: ["admin", "user"],
      idea_status: [
        "draft",
        "validating",
        "validated",
        "in_development",
        "completed",
        "archived",
      ],
      phase_status: ["pending", "in_progress", "completed", "failed"],
      token_transaction_type: ["purchase", "consumption", "refund", "bonus"],
    },
  },
} as const
