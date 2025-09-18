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
      vehicles: {
        Row: {
          ano: string
          cor: string
          created_at: string
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
          cor: string
          created_at?: string
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
          cor?: string
          created_at?: string
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
      [_ in never]: never
    }
    Enums: {
      inspection_status: "ok" | "needs_replacement" | "observation"
      user_role: "admin" | "operator"
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
      user_role: ["admin", "operator"],
      vehicle_type: ["car", "moto"],
    },
  },
} as const
