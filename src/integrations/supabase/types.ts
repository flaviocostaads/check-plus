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
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      checklist_templates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          requires_photo: boolean
          updated_at: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          requires_photo?: boolean
          updated_at?: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          requires_photo?: boolean
          updated_at?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          company_address: string | null
          company_email: string | null
          company_logo_url: string | null
          company_name: string
          company_phone: string | null
          created_at: string
          id: string
          primary_color: string | null
          secondary_color: string | null
          updated_at: string
        }
        Insert: {
          company_address?: string | null
          company_email?: string | null
          company_logo_url?: string | null
          company_name: string
          company_phone?: string | null
          created_at?: string
          id?: string
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Update: {
          company_address?: string | null
          company_email?: string | null
          company_logo_url?: string | null
          company_name?: string
          company_phone?: string | null
          created_at?: string
          id?: string
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      damage_marker_photos: {
        Row: {
          created_at: string
          damage_marker_id: string
          id: string
          photo_url: string
        }
        Insert: {
          created_at?: string
          damage_marker_id: string
          id?: string
          photo_url: string
        }
        Update: {
          created_at?: string
          damage_marker_id?: string
          id?: string
          photo_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "damage_marker_photos_damage_marker_id_fkey"
            columns: ["damage_marker_id"]
            isOneToOne: false
            referencedRelation: "damage_markers"
            referencedColumns: ["id"]
          },
        ]
      }
      damage_markers: {
        Row: {
          created_at: string
          description: string
          id: string
          inspection_id: string
          x_position: number
          y_position: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          inspection_id: string
          x_position: number
          y_position: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          inspection_id?: string
          x_position?: number
          y_position?: number
        }
        Relationships: [
          {
            foreignKeyName: "damage_markers_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          avatar_url: string | null
          cnh_numero: string
          cnh_validade: string
          cpf: string
          created_at: string
          email: string | null
          endereco: string | null
          id: string
          is_active: boolean
          nome_completo: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          cnh_numero: string
          cnh_validade: string
          cpf: string
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          is_active?: boolean
          nome_completo: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          cnh_numero?: string
          cnh_validade?: string
          cpf?: string
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          is_active?: boolean
          nome_completo?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inspection_items: {
        Row: {
          checklist_template_id: string
          created_at: string
          id: string
          inspection_id: string
          observations: string | null
          status: Database["public"]["Enums"]["inspection_status"]
          updated_at: string
        }
        Insert: {
          checklist_template_id: string
          created_at?: string
          id?: string
          inspection_id: string
          observations?: string | null
          status: Database["public"]["Enums"]["inspection_status"]
          updated_at?: string
        }
        Update: {
          checklist_template_id?: string
          created_at?: string
          id?: string
          inspection_id?: string
          observations?: string | null
          status?: Database["public"]["Enums"]["inspection_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_items_checklist_template_id_fkey"
            columns: ["checklist_template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_items_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_photos: {
        Row: {
          created_at: string
          id: string
          inspection_item_id: string
          photo_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          inspection_item_id: string
          photo_url: string
        }
        Update: {
          created_at?: string
          id?: string
          inspection_item_id?: string
          photo_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_photos_inspection_item_id_fkey"
            columns: ["inspection_item_id"]
            isOneToOne: false
            referencedRelation: "inspection_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          created_at: string
          driver_cnh: string
          driver_cnh_validade: string
          driver_cpf: string
          driver_id: string | null
          driver_name: string
          id: string
          inspector_id: string
          latitude: number | null
          longitude: number | null
          odometer_photo_url: string | null
          signature_data: string | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          driver_cnh: string
          driver_cnh_validade: string
          driver_cpf: string
          driver_id?: string | null
          driver_name: string
          id?: string
          inspector_id: string
          latitude?: number | null
          longitude?: number | null
          odometer_photo_url?: string | null
          signature_data?: string | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          driver_cnh?: string
          driver_cnh_validade?: string
          driver_cpf?: string
          driver_id?: string | null
          driver_name?: string
          id?: string
          inspector_id?: string
          latitude?: number | null
          longitude?: number | null
          odometer_photo_url?: string | null
          signature_data?: string | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_active: boolean
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      password_history: {
        Row: {
          created_at: string | null
          id: string
          password_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          password_hash: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          password_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_role_permissions: {
        Row: {
          can_access_reports: boolean | null
          can_create_users: boolean | null
          can_delete_users: boolean | null
          can_edit_all_inspections: boolean | null
          can_manage_drivers: boolean | null
          can_manage_settings: boolean | null
          can_manage_vehicles: boolean | null
          can_view_all_inspections: boolean | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          can_access_reports?: boolean | null
          can_create_users?: boolean | null
          can_delete_users?: boolean | null
          can_edit_all_inspections?: boolean | null
          can_manage_drivers?: boolean | null
          can_manage_settings?: boolean | null
          can_manage_vehicles?: boolean | null
          can_view_all_inspections?: boolean | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          can_access_reports?: boolean | null
          can_create_users?: boolean | null
          can_delete_users?: boolean | null
          can_edit_all_inspections?: boolean | null
          can_manage_drivers?: boolean | null
          can_manage_settings?: boolean | null
          can_manage_vehicles?: boolean | null
          can_view_all_inspections?: boolean | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          id: string
          ip_address: unknown | null
          last_activity: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          last_activity?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          last_activity?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          ano: string
          cidade: string | null
          cor: string
          created_at: string
          estado: string | null
          id: string
          km_atual: string | null
          marca_modelo: string
          photo_url: string | null
          placa: string
          renavam: string
          updated_at: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Insert: {
          ano: string
          cidade?: string | null
          cor: string
          created_at?: string
          estado?: string | null
          id?: string
          km_atual?: string | null
          marca_modelo: string
          photo_url?: string | null
          placa: string
          renavam: string
          updated_at?: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Update: {
          ano?: string
          cidade?: string | null
          cor?: string
          created_at?: string
          estado?: string | null
          id?: string
          km_atual?: string | null
          marca_modelo?: string
          photo_url?: string | null
          placa?: string
          renavam?: string
          updated_at?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      comprehensive_security_check: {
        Args: Record<PropertyKey, never>
        Returns: {
          category: string
          check_name: string
          details: string
          severity: string
          status: string
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_driver_full_data: {
        Args: { driver_id: string }
        Returns: {
          avatar_url: string
          cnh_numero: string
          cnh_validade: string
          cpf: string
          created_at: string
          email: string
          endereco: string
          id: string
          is_active: boolean
          nome_completo: string
          telefone: string
          updated_at: string
        }[]
      }
      get_drivers_basic_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string
          created_at: string
          id: string
          is_active: boolean
          nome_completo: string
        }[]
      }
      get_drivers_operator_view: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string
          cnh_numero_masked: string
          cnh_validade: string
          cpf_masked: string
          created_at: string
          id: string
          is_active: boolean
          nome_completo: string
          telefone_masked: string
          updated_at: string
        }[]
      }
      get_drivers_secure_view: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string
          cnh_numero: string
          cnh_validade: string
          cpf: string
          created_at: string
          email: string
          endereco: string
          id: string
          is_active: boolean
          nome_completo: string
          telefone: string
          updated_at: string
        }[]
      }
      get_user_permissions: {
        Args: { user_role: Database["public"]["Enums"]["user_role"] }
        Returns: {
          can_access_reports: boolean
          can_create_users: boolean
          can_delete_users: boolean
          can_edit_all_inspections: boolean
          can_manage_drivers: boolean
          can_manage_settings: boolean
          can_manage_vehicles: boolean
          can_view_all_inspections: boolean
        }[]
      }
      log_data_access: {
        Args: { operation: string; record_id: string; table_name: string }
        Returns: undefined
      }
      log_driver_access: {
        Args: { driver_id: string }
        Returns: undefined
      }
      log_sensitive_access: {
        Args: { access_type: string; record_id: string; table_name: string }
        Returns: undefined
      }
      search_drivers_for_assignment: {
        Args: { search_term?: string }
        Returns: {
          avatar_url: string
          id: string
          nome_completo: string
        }[]
      }
      validate_cnh: {
        Args: { cnh: string }
        Returns: boolean
      }
      validate_cpf: {
        Args: { cpf: string }
        Returns: boolean
      }
      validate_driver_access_permission: {
        Args: { operation_type: string }
        Returns: boolean
      }
      validate_password_strength: {
        Args: { password: string }
        Returns: boolean
      }
      validate_security_setup: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_name: string
          details: string
          status: string
        }[]
      }
    }
    Enums: {
      inspection_status: "ok" | "needs_replacement" | "observation"
      user_role: "admin" | "operator" | "supervisor" | "inspector"
      vehicle_type: "car" | "moto"
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
      inspection_status: ["ok", "needs_replacement", "observation"],
      user_role: ["admin", "operator", "supervisor", "inspector"],
      vehicle_type: ["car", "moto"],
    },
  },
} as const
