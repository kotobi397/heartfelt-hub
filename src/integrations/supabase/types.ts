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
      app_config: {
        Row: {
          id: string
          mistral_api_key: string | null
          mistral_api_keys: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          mistral_api_key?: string | null
          mistral_api_keys?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          mistral_api_key?: string | null
          mistral_api_keys?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          blocked_at: string
          facebook_user_id: string
          id: string
          is_active: boolean
          offending_message: string | null
          reason: string | null
          unblocked_at: string | null
        }
        Insert: {
          blocked_at?: string
          facebook_user_id: string
          id?: string
          is_active?: boolean
          offending_message?: string | null
          reason?: string | null
          unblocked_at?: string | null
        }
        Update: {
          blocked_at?: string
          facebook_user_id?: string
          id?: string
          is_active?: boolean
          offending_message?: string | null
          reason?: string | null
          unblocked_at?: string | null
        }
        Relationships: []
      }
      book_search_cache: {
        Row: {
          created_at: string
          facebook_user_id: string
          results: Json
        }
        Insert: {
          created_at?: string
          facebook_user_id: string
          results?: Json
        }
        Update: {
          created_at?: string
          facebook_user_id?: string
          results?: Json
        }
        Relationships: []
      }
      book_sessions: {
        Row: {
          created_at: string
          current_page: number
          facebook_user_id: string
          id: string
          identifier: string
          title: string | null
          total_pages: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_page?: number
          facebook_user_id: string
          id?: string
          identifier: string
          title?: string | null
          total_pages?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_page?: number
          facebook_user_id?: string
          id?: string
          identifier?: string
          title?: string | null
          total_pages?: number
          updated_at?: string
        }
        Relationships: []
      }
      bot_settings: {
        Row: {
          allow_customer_length_config: boolean
          answer_length: string
          created_at: string
          id: string
          is_active: boolean
          system_prompt: string
          tone: string
          updated_at: string
        }
        Insert: {
          allow_customer_length_config?: boolean
          answer_length?: string
          created_at?: string
          id?: string
          is_active?: boolean
          system_prompt?: string
          tone?: string
          updated_at?: string
        }
        Update: {
          allow_customer_length_config?: boolean
          answer_length?: string
          created_at?: string
          id?: string
          is_active?: boolean
          system_prompt?: string
          tone?: string
          updated_at?: string
        }
        Relationships: []
      }
      broadcast_recipients: {
        Row: {
          broadcast_id: string
          created_at: string
          error: string | null
          facebook_user_id: string
          id: string
          sent_at: string | null
          status: string
        }
        Insert: {
          broadcast_id: string
          created_at?: string
          error?: string | null
          facebook_user_id: string
          id?: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          broadcast_id?: string
          created_at?: string
          error?: string | null
          facebook_user_id?: string
          id?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_recipients_broadcast_id_fkey"
            columns: ["broadcast_id"]
            isOneToOne: false
            referencedRelation: "broadcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcasts: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          failed_count: number
          id: string
          message_text: string
          sent_count: number
          started_at: string | null
          status: string
          tag: string
          target_window_days: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          failed_count?: number
          id?: string
          message_text: string
          sent_count?: number
          started_at?: string | null
          status?: string
          tag?: string
          target_window_days?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          failed_count?: number
          id?: string
          message_text?: string
          sent_count?: number
          started_at?: string | null
          status?: string
          tag?: string
          target_window_days?: number
        }
        Relationships: []
      }
      drip_campaigns: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          steps: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          steps?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          steps?: Json
          updated_at?: string
        }
        Relationships: []
      }
      drip_enrollments: {
        Row: {
          campaign_id: string
          completed: boolean
          enrolled_at: string
          facebook_user_id: string
          id: string
          last_step_index: number
          last_step_sent_at: string | null
        }
        Insert: {
          campaign_id: string
          completed?: boolean
          enrolled_at?: string
          facebook_user_id: string
          id?: string
          last_step_index?: number
          last_step_sent_at?: string | null
        }
        Update: {
          campaign_id?: string
          completed?: boolean
          enrolled_at?: string
          facebook_user_id?: string
          id?: string
          last_step_index?: number
          last_step_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drip_enrollments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "drip_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      facebook_profiles: {
        Row: {
          created_at: string
          facebook_user_id: string
          first_name: string | null
          last_name: string | null
          name: string | null
          page_id: string | null
          profile_pic: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          facebook_user_id: string
          first_name?: string | null
          last_name?: string | null
          name?: string | null
          page_id?: string | null
          profile_pic?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          facebook_user_id?: string
          first_name?: string | null
          last_name?: string | null
          name?: string | null
          page_id?: string | null
          profile_pic?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      fb_send_rate: {
        Row: {
          id: number
          ts: string
        }
        Insert: {
          id?: number
          ts?: string
        }
        Update: {
          id?: number
          ts?: string
        }
        Relationships: []
      }
      image_search_sessions: {
        Row: {
          facebook_user_id: string
          offset_count: number
          query: string
          updated_at: string
        }
        Insert: {
          facebook_user_id: string
          offset_count?: number
          query: string
          updated_at?: string
        }
        Update: {
          facebook_user_id?: string
          offset_count?: number
          query?: string
          updated_at?: string
        }
        Relationships: []
      }
      latest_post_sends: {
        Row: {
          facebook_user_id: string
          last_post_id: string
          page_id: string
          sent_at: string
        }
        Insert: {
          facebook_user_id: string
          last_post_id: string
          page_id?: string
          sent_at?: string
        }
        Update: {
          facebook_user_id?: string
          last_post_id?: string
          page_id?: string
          sent_at?: string
        }
        Relationships: []
      }
      manga_search_cache: {
        Row: {
          created_at: string
          facebook_user_id: string
          results: Json
        }
        Insert: {
          created_at?: string
          facebook_user_id: string
          results: Json
        }
        Update: {
          created_at?: string
          facebook_user_id?: string
          results?: Json
        }
        Relationships: []
      }
      manga_sessions: {
        Row: {
          chapters: Json
          current_chapter_idx: number
          current_page: number
          facebook_user_id: string
          manga_id: string
          manga_title: string
          updated_at: string
        }
        Insert: {
          chapters?: Json
          current_chapter_idx?: number
          current_page?: number
          facebook_user_id: string
          manga_id: string
          manga_title: string
          updated_at?: string
        }
        Update: {
          chapters?: Json
          current_chapter_idx?: number
          current_page?: number
          facebook_user_id?: string
          manga_id?: string
          manga_title?: string
          updated_at?: string
        }
        Relationships: []
      }
      message_feedback: {
        Row: {
          created_at: string
          facebook_user_id: string
          id: string
          message_id: string
          rating: number
        }
        Insert: {
          created_at?: string
          facebook_user_id: string
          id?: string
          message_id: string
          rating: number
        }
        Update: {
          created_at?: string
          facebook_user_id?: string
          id?: string
          message_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "message_feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          created_at: string
          facebook_user_id: string
          id: string
          message_text: string
          mid: string | null
          page_id: string | null
          reply_to_mid: string | null
          response_time_ms: number | null
          sender_type: string
        }
        Insert: {
          created_at?: string
          facebook_user_id: string
          id?: string
          message_text: string
          mid?: string | null
          page_id?: string | null
          reply_to_mid?: string | null
          response_time_ms?: number | null
          sender_type: string
        }
        Update: {
          created_at?: string
          facebook_user_id?: string
          id?: string
          message_text?: string
          mid?: string | null
          page_id?: string | null
          reply_to_mid?: string | null
          response_time_ms?: number | null
          sender_type?: string
        }
        Relationships: []
      }
      novel_chapters: {
        Row: {
          chapter_number: number
          content: string
          created_at: string
          id: string
          session_id: string
          title: string | null
        }
        Insert: {
          chapter_number: number
          content: string
          created_at?: string
          id?: string
          session_id: string
          title?: string | null
        }
        Update: {
          chapter_number?: number
          content?: string
          created_at?: string
          id?: string
          session_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "novel_chapters_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "novel_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      novel_sessions: {
        Row: {
          created_at: string
          current_chapter: number
          facebook_user_id: string
          genre: string | null
          id: string
          premise: string | null
          protagonist: string | null
          status: string
          style: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_chapter?: number
          facebook_user_id: string
          genre?: string | null
          id?: string
          premise?: string | null
          protagonist?: string | null
          status?: string
          style?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_chapter?: number
          facebook_user_id?: string
          genre?: string | null
          id?: string
          premise?: string | null
          protagonist?: string | null
          status?: string
          style?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      personas: {
        Row: {
          active_from_hour: number | null
          active_to_hour: number | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          page_id: string | null
          priority: number
          system_prompt: string
          updated_at: string
        }
        Insert: {
          active_from_hour?: number | null
          active_to_hour?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          page_id?: string | null
          priority?: number
          system_prompt: string
          updated_at?: string
        }
        Update: {
          active_from_hour?: number | null
          active_to_hour?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          page_id?: string | null
          priority?: number
          system_prompt?: string
          updated_at?: string
        }
        Relationships: []
      }
      processed_messages: {
        Row: {
          mid: string
          processed_at: string
        }
        Insert: {
          mid: string
          processed_at?: string
        }
        Update: {
          mid?: string
          processed_at?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          created_at: string
          facebook_user_id: string
          id: string
          message: string
          remind_at: string
          sent: boolean
          sent_at: string | null
        }
        Insert: {
          created_at?: string
          facebook_user_id: string
          id?: string
          message: string
          remind_at: string
          sent?: boolean
          sent_at?: string | null
        }
        Update: {
          created_at?: string
          facebook_user_id?: string
          id?: string
          message?: string
          remind_at?: string
          sent?: boolean
          sent_at?: string | null
        }
        Relationships: []
      }
      user_memory: {
        Row: {
          created_at: string
          facebook_user_id: string
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          facebook_user_id: string
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          facebook_user_id?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string
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
      fb_rate_reserve: {
        Args: { _max: number; _window_ms?: number }
        Returns: boolean
      }
      get_bot_stats: { Args: { period_days?: number }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
