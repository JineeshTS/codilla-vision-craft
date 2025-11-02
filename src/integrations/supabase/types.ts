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
      ideas: {
        Row: {
          consensus_score: number | null
          created_at: string
          description: string
          id: string
          problem_statement: string | null
          status: Database["public"]["Enums"]["idea_status"]
          target_audience: string | null
          title: string
          tokens_spent: number
          unique_value_proposition: string | null
          updated_at: string
          user_id: string
          validation_summary: Json | null
        }
        Insert: {
          consensus_score?: number | null
          created_at?: string
          description: string
          id?: string
          problem_statement?: string | null
          status?: Database["public"]["Enums"]["idea_status"]
          target_audience?: string | null
          title: string
          tokens_spent?: number
          unique_value_proposition?: string | null
          updated_at?: string
          user_id: string
          validation_summary?: Json | null
        }
        Update: {
          consensus_score?: number | null
          created_at?: string
          description?: string
          id?: string
          problem_statement?: string | null
          status?: Database["public"]["Enums"]["idea_status"]
          target_audience?: string | null
          title?: string
          tokens_spent?: number
          unique_value_proposition?: string | null
          updated_at?: string
          user_id?: string
          validation_summary?: Json | null
        }
        Relationships: []
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
          id: string
          tokens_used: number
          total_tokens: number
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          tokens_used?: number
          total_tokens?: number
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
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
          name: string
          progress_percentage: number
          repository_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_phase?: number
          deployment_url?: string | null
          id?: string
          idea_id: string
          name: string
          progress_percentage?: number
          repository_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_phase?: number
          deployment_url?: string | null
          id?: string
          idea_id?: string
          name?: string
          progress_percentage?: number
          repository_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
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
