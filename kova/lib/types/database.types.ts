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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      expenses: {
        Row: {
          added_by_user_id: string | null
          amount: number
          category: string
          created_at: string | null
          description: string
          expense_date: string
          id: string
          project_id: string
          updated_at: string | null
          vendor_name: string | null
        }
        Insert: {
          added_by_user_id?: string | null
          amount: number
          category: string
          created_at?: string | null
          description: string
          expense_date?: string
          id?: string
          project_id: string
          updated_at?: string | null
          vendor_name?: string | null
        }
        Update: {
          added_by_user_id?: string | null
          amount?: number
          category?: string
          created_at?: string | null
          description?: string
          expense_date?: string
          id?: string
          project_id?: string
          updated_at?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_added_by_user_id_fkey"
            columns: ["added_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      firms: {
        Row: {
          created_at: string | null
          id: string
          max_projects: number | null
          max_users: number | null
          name: string
          plan_type: string | null
          subscription_ends_at: string | null
          subscription_status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          max_projects?: number | null
          max_users?: number | null
          name: string
          plan_type?: string | null
          subscription_ends_at?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          max_projects?: number | null
          max_users?: number | null
          name?: string
          plan_type?: string | null
          subscription_ends_at?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      milestone_payments: {
        Row: {
          amount: number
          created_at: string | null
          created_by_user_id: string | null
          expired_at: string | null
          id: string
          milestone_id: string
          paid_at: string | null
          payment_link_url: string | null
          reference: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by_user_id?: string | null
          expired_at?: string | null
          id?: string
          milestone_id: string
          paid_at?: string | null
          payment_link_url?: string | null
          reference?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by_user_id?: string | null
          expired_at?: string | null
          id?: string
          milestone_id?: string
          paid_at?: string | null
          payment_link_url?: string | null
          reference?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "milestone_payments_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_payments_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_template_items: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          order_index: number
          percentage: number
          template_id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          order_index: number
          percentage: number
          template_id: string
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number
          percentage?: number
          template_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestone_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "milestone_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_templates: {
        Row: {
          created_at: string | null
          created_by_user_id: string | null
          description: string | null
          firm_id: string | null
          id: string
          is_default: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          created_by_user_id?: string | null
          description?: string | null
          firm_id?: string | null
          id?: string
          is_default?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          created_by_user_id?: string | null
          description?: string | null
          firm_id?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestone_templates_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_templates_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firm_dashboard"
            referencedColumns: ["firm_id"]
          },
          {
            foreignKeyName: "milestone_templates_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          amount: number
          amount_paid: number | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          order_index: number
          percentage: number | null
          project_id: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          amount_paid?: number | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          order_index: number
          percentage?: number | null
          project_id: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          amount_paid?: number | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          order_index?: number
          percentage?: number | null
          project_id?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          assigned_to_user_id: string | null
          client_contact: string | null
          client_name: string
          completed_at: string | null
          created_at: string | null
          created_by_user_id: string
          expected_completion: string | null
          firm_id: string
          id: string
          project_name: string
          share_enabled: boolean | null
          share_uuid: string | null
          started_at: string | null
          status: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          assigned_to_user_id?: string | null
          client_contact?: string | null
          client_name: string
          completed_at?: string | null
          created_at?: string | null
          created_by_user_id: string
          expected_completion?: string | null
          firm_id: string
          id?: string
          project_name: string
          share_enabled?: boolean | null
          share_uuid?: string | null
          started_at?: string | null
          status?: string | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          assigned_to_user_id?: string | null
          client_contact?: string | null
          client_name?: string
          completed_at?: string | null
          created_at?: string | null
          created_by_user_id?: string
          expected_completion?: string | null
          firm_id?: string
          id?: string
          project_name?: string
          share_enabled?: boolean | null
          share_uuid?: string | null
          started_at?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firm_dashboard"
            referencedColumns: ["firm_id"]
          },
          {
            foreignKeyName: "projects_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          account_number: string | null
          account_type: string | null
          bank_account_holder_name: string | null
          bank_name: string | null
          created_at: string | null
          email: string
          firm_id: string
          full_name: string | null
          id: string
          ifsc_code: string | null
          is_active: boolean | null
          last_login_at: string | null
          payment_methods_updated_at: string | null
          phone: string | null
          role: string | null
          updated_at: string | null
          upi_id: string | null
        }
        Insert: {
          account_number?: string | null
          account_type?: string | null
          bank_account_holder_name?: string | null
          bank_name?: string | null
          created_at?: string | null
          email: string
          firm_id: string
          full_name?: string | null
          id?: string
          ifsc_code?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          payment_methods_updated_at?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
          upi_id?: string | null
        }
        Update: {
          account_number?: string | null
          account_type?: string | null
          bank_account_holder_name?: string | null
          bank_name?: string | null
          created_at?: string | null
          email?: string
          firm_id?: string
          full_name?: string | null
          id?: string
          ifsc_code?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          payment_methods_updated_at?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
          upi_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firm_dashboard"
            referencedColumns: ["firm_id"]
          },
          {
            foreignKeyName: "users_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      expense_summary_by_category: {
        Row: {
          category: string | null
          category_total: number | null
          expense_count: number | null
          project_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      firm_dashboard: {
        Row: {
          active_projects: number | null
          created_at: string | null
          firm_id: string | null
          firm_name: string | null
          owners: number | null
          subscription_status: string | null
          total_collected: number | null
          total_project_value: number | null
          total_projects: number | null
          total_users: number | null
        }
        Relationships: []
      }
      project_summary: {
        Row: {
          amount_pending: number | null
          amount_received: number | null
          assigned_to_user_id: string | null
          balance: number | null
          client_name: string | null
          created_at: string | null
          created_by_user_id: string | null
          firm_id: string | null
          id: string | null
          milestones_paid: number | null
          milestones_pending: number | null
          project_name: string | null
          status: string | null
          total_amount: number | null
          total_expenses: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firm_dashboard"
            referencedColumns: ["firm_id"]
          },
          {
            foreignKeyName: "projects_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_firm_and_owner: {
        Args: {
          auth_user_id: string
          firm_name?: string
          user_email: string
          user_name: string
        }
        Returns: {
          firm_id: string
          user_id: string
        }[]
      }
      force_get_firm_id: {
        Args: { target_user_id: string }
        Returns: {
          firm_id: string
        }[]
      }
      get_my_firm_id: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
