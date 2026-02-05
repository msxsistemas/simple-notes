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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      api_credentials: {
        Row: {
          created_at: string
          id: string
          status: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      checkout_configs: {
        Row: {
          background_color: string | null
          created_at: string
          custom_description: string | null
          custom_title: string | null
          id: string
          logo_url: string | null
          primary_color: string | null
          require_cpf: boolean | null
          require_email: boolean | null
          require_name: boolean | null
          require_phone: boolean | null
          show_cpf: boolean | null
          show_email: boolean | null
          show_name: boolean | null
          show_phone: boolean | null
          show_product_name: boolean | null
          success_message: string | null
          text_color: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          background_color?: string | null
          created_at?: string
          custom_description?: string | null
          custom_title?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          require_cpf?: boolean | null
          require_email?: boolean | null
          require_name?: boolean | null
          require_phone?: boolean | null
          show_cpf?: boolean | null
          show_email?: boolean | null
          show_name?: boolean | null
          show_phone?: boolean | null
          show_product_name?: boolean | null
          success_message?: string | null
          text_color?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          background_color?: string | null
          created_at?: string
          custom_description?: string | null
          custom_title?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          require_cpf?: boolean | null
          require_email?: boolean | null
          require_name?: boolean | null
          require_phone?: boolean | null
          show_cpf?: boolean | null
          show_email?: boolean | null
          show_name?: boolean | null
          show_phone?: boolean | null
          show_product_name?: boolean | null
          success_message?: string | null
          text_color?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fee_configs: {
        Row: {
          id: string
          max_pix_transaction: number
          pix_in_fixed: number
          pix_in_percentage: number
          pix_out_fixed: number
          reserve_percentage: number
          split_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          max_pix_transaction?: number
          pix_in_fixed?: number
          pix_in_percentage?: number
          pix_out_fixed?: number
          reserve_percentage?: number
          split_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          max_pix_transaction?: number
          pix_in_fixed?: number
          pix_in_percentage?: number
          pix_out_fixed?: number
          reserve_percentage?: number
          split_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      order_bumps: {
        Row: {
          created_at: string
          id: string
          name: string
          product_id: string
          status: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          product_id: string
          status?: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          product_id?: string
          status?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_bumps_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      pix_charges: {
        Row: {
          amount: number
          created_at: string
          expires_at: string | null
          id: string
          paid_at: string | null
          pix_code: string | null
          qr_code_base64: string | null
          status: string
          transaction_id: string | null
          updated_at: string
          user_id: string
          woovi_charge_id: string | null
          woovi_correlation_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          expires_at?: string | null
          id?: string
          paid_at?: string | null
          pix_code?: string | null
          qr_code_base64?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
          woovi_charge_id?: string | null
          woovi_correlation_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          paid_at?: string | null
          pix_code?: string | null
          qr_code_base64?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
          woovi_charge_id?: string | null
          woovi_correlation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pix_charges_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          checkout_url: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          price: number
          sold_count: number
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          checkout_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price: number
          sold_count?: number
          status?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          checkout_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
          sold_count?: number
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          document: string
          full_name: string
          id: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document: string
          full_name: string
          id: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document?: string
          full_name?: string
          id?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      split_partners: {
        Row: {
          created_at: string
          document: string | null
          email: string | null
          id: string
          name: string
          pix_key: string
          split_type: string
          split_value: number
          status: string
          updated_at: string
          user_id: string
          woovi_subaccount_id: string | null
        }
        Insert: {
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name: string
          pix_key: string
          split_type?: string
          split_value: number
          status?: string
          updated_at?: string
          user_id: string
          woovi_subaccount_id?: string | null
        }
        Update: {
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          pix_key?: string
          split_type?: string
          split_value?: number
          status?: string
          updated_at?: string
          user_id?: string
          woovi_subaccount_id?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          fee: number
          id: string
          net_amount: number
          order_id: string
          payment_method: string
          pix_code: string | null
          pix_qr_code: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          fee?: number
          id?: string
          net_amount: number
          order_id: string
          payment_method?: string
          pix_code?: string | null
          pix_qr_code?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          fee?: number
          id?: string
          net_amount?: number
          order_id?: string
          payment_method?: string
          pix_code?: string | null
          pix_qr_code?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      webhooks: {
        Row: {
          created_at: string
          events: string[]
          id: string
          status: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          events?: string[]
          id?: string
          status?: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          events?: string[]
          id?: string
          status?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount: number
          created_at: string
          document: string
          fee: number
          id: string
          pix_key: string
          recipient_name: string
          status: string
          total: number
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          document: string
          fee?: number
          id?: string
          pix_key: string
          recipient_name: string
          status?: string
          total: number
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          document?: string
          fee?: number
          id?: string
          pix_key?: string
          recipient_name?: string
          status?: string
          total?: number
          user_id?: string
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
  public: {
    Enums: {},
  },
} as const
