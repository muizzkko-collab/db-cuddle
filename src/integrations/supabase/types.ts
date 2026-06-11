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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      country_settings: {
        Row: {
          active: boolean | null
          country_code: string
          country_name: string
          currency: string
          currency_symbol: string
          ga4_id: string | null
          gtm_id: string | null
          id: string
          meta_pixel_id: string | null
          tiktok_pixel_id: string | null
        }
        Insert: {
          active?: boolean | null
          country_code: string
          country_name: string
          currency: string
          currency_symbol: string
          ga4_id?: string | null
          gtm_id?: string | null
          id?: string
          meta_pixel_id?: string | null
          tiktok_pixel_id?: string | null
        }
        Update: {
          active?: boolean | null
          country_code?: string
          country_name?: string
          currency?: string
          currency_symbol?: string
          ga4_id?: string | null
          gtm_id?: string | null
          id?: string
          meta_pixel_id?: string | null
          tiktok_pixel_id?: string | null
        }
        Relationships: []
      }
      discount_codes: {
        Row: {
          active: boolean | null
          code: string
          created_at: string | null
          discount_type: string | null
          discount_value: number
          expires_at: string | null
          id: string
          max_uses: number | null
          uses_count: number | null
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string | null
          discount_type?: string | null
          discount_value: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          uses_count?: number | null
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string | null
          discount_type?: string | null
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          uses_count?: number | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string | null
          product_id: string | null
          product_name: string | null
          quantity: number | null
          total_price: number | null
          unit_price: number | null
          variant_label: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string | null
          product_name?: string | null
          quantity?: number | null
          total_price?: number | null
          unit_price?: number | null
          variant_label?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string | null
          product_name?: string | null
          quantity?: number | null
          total_price?: number | null
          unit_price?: number | null
          variant_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          admin_notes: string | null
          bump_added: boolean | null
          bump_name: string | null
          bump_price: number | null
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string | null
          currency: string | null
          customer_name: string
          discount_amount: number | null
          discount_code: string | null
          email: string | null
          fulfillment_tracking: string | null
          id: string
          order_number: number
          order_status: string | null
          payment_method: string | null
          payment_status: string | null
          paypal_order_id: string | null
          phone: string | null
          postcode: string | null
          product_id: string | null
          product_name: string | null
          quantity: number | null
          source_domain: string | null
          stripe_session_id: string | null
          subtotal: number | null
          total: number | null
          updated_at: string | null
          upsell_accepted: boolean | null
          variant_label: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          admin_notes?: string | null
          bump_added?: boolean | null
          bump_name?: string | null
          bump_price?: number | null
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          currency?: string | null
          customer_name: string
          discount_amount?: number | null
          discount_code?: string | null
          email?: string | null
          fulfillment_tracking?: string | null
          id?: string
          order_number?: number
          order_status?: string | null
          payment_method?: string | null
          payment_status?: string | null
          paypal_order_id?: string | null
          phone?: string | null
          postcode?: string | null
          product_id?: string | null
          product_name?: string | null
          quantity?: number | null
          source_domain?: string | null
          stripe_session_id?: string | null
          subtotal?: number | null
          total?: number | null
          updated_at?: string | null
          upsell_accepted?: boolean | null
          variant_label?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          admin_notes?: string | null
          bump_added?: boolean | null
          bump_name?: string | null
          bump_price?: number | null
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          currency?: string | null
          customer_name?: string
          discount_amount?: number | null
          discount_code?: string | null
          email?: string | null
          fulfillment_tracking?: string | null
          id?: string
          order_number?: number
          order_status?: string | null
          payment_method?: string | null
          payment_status?: string | null
          paypal_order_id?: string | null
          phone?: string | null
          postcode?: string | null
          product_id?: string | null
          product_name?: string | null
          quantity?: number | null
          source_domain?: string | null
          stripe_session_id?: string | null
          subtotal?: number | null
          total?: number | null
          updated_at?: string | null
          upsell_accepted?: boolean | null
          variant_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_country_settings: {
        Row: {
          active: boolean | null
          bump_price: number | null
          country_code: string
          country_name: string
          created_at: string | null
          currency: string
          currency_symbol: string
          id: string
          price_1: number | null
          price_2: number | null
          price_3: number | null
          subdomain: string
          upsell_price: number | null
        }
        Insert: {
          active?: boolean | null
          bump_price?: number | null
          country_code: string
          country_name: string
          created_at?: string | null
          currency: string
          currency_symbol: string
          id?: string
          price_1?: number | null
          price_2?: number | null
          price_3?: number | null
          subdomain: string
          upsell_price?: number | null
        }
        Update: {
          active?: boolean | null
          bump_price?: number | null
          country_code?: string
          country_name?: string
          created_at?: string | null
          currency?: string
          currency_symbol?: string
          id?: string
          price_1?: number | null
          price_2?: number | null
          price_3?: number | null
          subdomain?: string
          upsell_price?: number | null
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean | null
          bump_enabled: boolean | null
          bump_price: number | null
          bump_text: string | null
          checkout_image_url: string | null
          colors: Json
          countdown_minutes: number | null
          created_at: string | null
          default_variant: number | null
          headline: string | null
          id: string
          image_url: string | null
          image_url_2: string | null
          images: Json
          label_1: string | null
          label_2: string | null
          label_3: string | null
          label_4: string | null
          price_1: number | null
          price_2: number | null
          price_3: number | null
          price_4: number
          product_name: string
          reviews: Json
          reviews_title: string | null
          stock_count: number | null
          subdomain: string
          subheadline: string | null
          upsell_enabled: boolean | null
          upsell_headline: string | null
          upsell_price: number | null
          why_choose_items: Json
          why_choose_title: string | null
        }
        Insert: {
          active?: boolean | null
          bump_enabled?: boolean | null
          bump_price?: number | null
          bump_text?: string | null
          checkout_image_url?: string | null
          colors?: Json
          countdown_minutes?: number | null
          created_at?: string | null
          default_variant?: number | null
          headline?: string | null
          id?: string
          image_url?: string | null
          image_url_2?: string | null
          images?: Json
          label_1?: string | null
          label_2?: string | null
          label_3?: string | null
          label_4?: string | null
          price_1?: number | null
          price_2?: number | null
          price_3?: number | null
          price_4?: number
          product_name: string
          reviews?: Json
          reviews_title?: string | null
          stock_count?: number | null
          subdomain: string
          subheadline?: string | null
          upsell_enabled?: boolean | null
          upsell_headline?: string | null
          upsell_price?: number | null
          why_choose_items?: Json
          why_choose_title?: string | null
        }
        Update: {
          active?: boolean | null
          bump_enabled?: boolean | null
          bump_price?: number | null
          bump_text?: string | null
          checkout_image_url?: string | null
          colors?: Json
          countdown_minutes?: number | null
          created_at?: string | null
          default_variant?: number | null
          headline?: string | null
          id?: string
          image_url?: string | null
          image_url_2?: string | null
          images?: Json
          label_1?: string | null
          label_2?: string | null
          label_3?: string | null
          label_4?: string | null
          price_1?: number | null
          price_2?: number | null
          price_3?: number | null
          price_4?: number
          product_name?: string
          reviews?: Json
          reviews_title?: string | null
          stock_count?: number | null
          subdomain?: string
          subheadline?: string | null
          upsell_enabled?: boolean | null
          upsell_headline?: string | null
          upsell_price?: number | null
          why_choose_items?: Json
          why_choose_title?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          background_color: string | null
          brand_color: string | null
          button_style: string | null
          button_text_color: string | null
          created_at: string | null
          custom_css: string | null
          favicon_url: string | null
          font_family: string | null
          ga4_id: string | null
          gtm_id: string | null
          headline_color: string | null
          id: string
          logo_url: string | null
          meta_pixel_id: string | null
          subdomain: string
          support_email: string | null
          template_id: number | null
          text_color: string | null
          thank_you_redirect_url: string | null
          tiktok_pixel_id: string | null
        }
        Insert: {
          background_color?: string | null
          brand_color?: string | null
          button_style?: string | null
          button_text_color?: string | null
          created_at?: string | null
          custom_css?: string | null
          favicon_url?: string | null
          font_family?: string | null
          ga4_id?: string | null
          gtm_id?: string | null
          headline_color?: string | null
          id?: string
          logo_url?: string | null
          meta_pixel_id?: string | null
          subdomain: string
          support_email?: string | null
          template_id?: number | null
          text_color?: string | null
          thank_you_redirect_url?: string | null
          tiktok_pixel_id?: string | null
        }
        Update: {
          background_color?: string | null
          brand_color?: string | null
          button_style?: string | null
          button_text_color?: string | null
          created_at?: string | null
          custom_css?: string | null
          favicon_url?: string | null
          font_family?: string | null
          ga4_id?: string | null
          gtm_id?: string | null
          headline_color?: string | null
          id?: string
          logo_url?: string | null
          meta_pixel_id?: string | null
          subdomain?: string
          support_email?: string | null
          template_id?: number | null
          text_color?: string | null
          thank_you_redirect_url?: string | null
          tiktok_pixel_id?: string | null
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
      create_order_with_items: {
        Args: { _items: Json; _order: Json }
        Returns: {
          id: string
          order_number: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      validate_discount_code: {
        Args: { _code: string }
        Returns: {
          code: string
          discount_type: string
          discount_value: number
        }[]
      }
    }
    Enums: {
      app_role: "admin"
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
      app_role: ["admin"],
    },
  },
} as const
