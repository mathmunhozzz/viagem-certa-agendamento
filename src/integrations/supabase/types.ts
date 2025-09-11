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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      cities: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          contact: string | null
          created_at: string
          id: string
          municipality: string | null
          name: string
          updated_at: string
        }
        Insert: {
          contact?: string | null
          created_at?: string
          id?: string
          municipality?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          contact?: string | null
          created_at?: string
          id?: string
          municipality?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      credit_cards: {
        Row: {
          brand: string
          created_at: string
          id: string
          last_four_digits: string
          name: string
          updated_at: string
        }
        Insert: {
          brand: string
          created_at?: string
          id?: string
          last_four_digits: string
          name: string
          updated_at?: string
        }
        Update: {
          brand?: string
          created_at?: string
          id?: string
          last_four_digits?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_absences: {
        Row: {
          admin_observation: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          employee_id: string
          end_date: string | null
          id: string
          reason: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_observation?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id: string
          end_date?: string | null
          id?: string
          reason: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_observation?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id?: string
          end_date?: string | null
          id?: string
          reason?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_sectors: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          sector_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          sector_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          sector_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_sectors_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_sectors_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          auth_user_id: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          position: string | null
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          position?: string | null
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          position?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      funcionarios_clientes: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          auth_user_id: string | null
          city: string | null
          client_id: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          position: string | null
          sector_id: string | null
          updated_at: string
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          auth_user_id?: string | null
          city?: string | null
          client_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          sector_id?: string | null
          updated_at?: string
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          auth_user_id?: string | null
          city?: string | null
          client_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          sector_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_clientes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funcionarios_clientes_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          error_message: string | null
          id: string
          notification_type: string
          recipient_email: string
          sent_at: string
          status: string | null
          trip_id: string
        }
        Insert: {
          error_message?: string | null
          id?: string
          notification_type: string
          recipient_email: string
          sent_at?: string
          status?: string | null
          trip_id: string
        }
        Update: {
          error_message?: string | null
          id?: string
          notification_type?: string
          recipient_email?: string
          sent_at?: string
          status?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          created_at: string
          email_reminders: boolean | null
          id: string
          reminder_hours: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_reminders?: boolean | null
          id?: string
          reminder_hours?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_reminders?: boolean | null
          id?: string
          reminder_hours?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string | null
          created_at: string
          id: string
          name: string
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_status?: string | null
          created_at?: string
          id?: string
          name: string
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_status?: string | null
          created_at?: string
          id?: string
          name?: string
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sectors: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      ticket_action_logs: {
        Row: {
          action_type: string
          details: Json | null
          id: string
          new_value: string | null
          old_value: string | null
          performed_at: string
          performed_by: string
          ticket_id: string
        }
        Insert: {
          action_type: string
          details?: Json | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          performed_at?: string
          performed_by: string
          ticket_id: string
        }
        Update: {
          action_type?: string
          details?: Json | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          performed_at?: string
          performed_by?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_action_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_comments: {
        Row: {
          author_user_id: string
          created_at: string
          id: string
          message: string
          ticket_id: string
        }
        Insert: {
          author_user_id: string
          created_at?: string
          id?: string
          message: string
          ticket_id: string
        }
        Update: {
          author_user_id?: string
          created_at?: string
          id?: string
          message?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_to: string | null
          client_contact_id: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          sector_id: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          client_contact_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          sector_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          client_contact_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          sector_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_client_contact_id_fkey"
            columns: ["client_contact_id"]
            isOneToOne: false
            referencedRelation: "funcionarios_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_attachments: {
        Row: {
          created_at: string
          description: string | null
          employee_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          trip_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          employee_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          trip_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          description?: string | null
          employee_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          trip_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_attachments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_attachments_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_reports: {
        Row: {
          content: string
          created_at: string
          employee_id: string
          id: string
          trip_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          employee_id: string
          id?: string
          trip_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          employee_id?: string
          id?: string
          trip_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string
          credit_card_id: string | null
          departure_time: string | null
          description: string | null
          employee_ids: string[] | null
          id: string
          observations: string | null
          sector: string
          sector_id: string | null
          status: string | null
          title: string
          travelers: string[]
          trip_date: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by: string
          credit_card_id?: string | null
          departure_time?: string | null
          description?: string | null
          employee_ids?: string[] | null
          id?: string
          observations?: string | null
          sector: string
          sector_id?: string | null
          status?: string | null
          title: string
          travelers?: string[]
          trip_date: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string
          credit_card_id?: string | null
          departure_time?: string | null
          description?: string | null
          employee_ids?: string[] | null
          id?: string
          observations?: string | null
          sector?: string
          sector_id?: string | null
          status?: string | null
          title?: string
          travelers?: string[]
          trip_date?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          brand: string
          capacity: number
          created_at: string
          id: string
          model: string
          plate: string
          status: string | null
          updated_at: string
          year: number
        }
        Insert: {
          brand: string
          capacity?: number
          created_at?: string
          id?: string
          model: string
          plate: string
          status?: string | null
          updated_at?: string
          year: number
        }
        Update: {
          brand?: string
          capacity?: number
          created_at?: string
          id?: string
          model?: string
          plate?: string
          status?: string | null
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      sector_statistics: {
        Row: {
          avg_travelers: number | null
          employee_count: number | null
          sector_name: string | null
          trip_count: number | null
        }
        Relationships: []
      }
      trip_statistics: {
        Row: {
          cancelled_trips: number | null
          completed_trips: number | null
          month: string | null
          sectors: string[] | null
          total_trips: number | null
          vehicles_used: string[] | null
        }
        Relationships: []
      }
      vehicle_statistics: {
        Row: {
          capacity: number | null
          plate: string | null
          trip_count: number | null
          usage_percentage: number | null
          vehicle_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_view_ticket: {
        Args: { check_user_id?: string; ticket_uuid: string }
        Returns: boolean
      }
      get_client_municipalities: {
        Args: Record<PropertyKey, never>
        Returns: {
          municipality: string
        }[]
      }
      get_clients_public: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          municipality: string
          name: string
        }[]
      }
      get_ticket_creator_names: {
        Args: { check_user_id?: string; ticket_ids: string[] }
        Returns: {
          creator_name: string
          ticket_id: string
        }[]
      }
      get_user_role: {
        Args: { check_user_id?: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          check_user_id?: string
          required_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "user"
      ticket_status: "pendente" | "em_analise" | "corrigido" | "negado"
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
      app_role: ["admin", "manager", "user"],
      ticket_status: ["pendente", "em_analise", "corrigido", "negado"],
    },
  },
} as const
