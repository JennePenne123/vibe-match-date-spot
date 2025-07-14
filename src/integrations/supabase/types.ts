export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_compatibility_scores: {
        Row: {
          activity_score: number
          compatibility_factors: Json | null
          created_at: string
          cuisine_score: number
          id: string
          overall_score: number
          price_score: number
          timing_score: number
          updated_at: string
          user1_id: string
          user2_id: string
          vibe_score: number
        }
        Insert: {
          activity_score?: number
          compatibility_factors?: Json | null
          created_at?: string
          cuisine_score?: number
          id?: string
          overall_score?: number
          price_score?: number
          timing_score?: number
          updated_at?: string
          user1_id: string
          user2_id: string
          vibe_score?: number
        }
        Update: {
          activity_score?: number
          compatibility_factors?: Json | null
          created_at?: string
          cuisine_score?: number
          id?: string
          overall_score?: number
          price_score?: number
          timing_score?: number
          updated_at?: string
          user1_id?: string
          user2_id?: string
          vibe_score?: number
        }
        Relationships: []
      }
      ai_date_recommendations: {
        Row: {
          ai_reasoning: string | null
          backup_venues: string[] | null
          confidence_level: number
          created_at: string
          id: string
          optimal_time: string | null
          overall_match_score: number
          recommendation_factors: Json | null
          status: string
          updated_at: string
          user1_id: string
          user2_id: string
          venue_id: string
        }
        Insert: {
          ai_reasoning?: string | null
          backup_venues?: string[] | null
          confidence_level?: number
          created_at?: string
          id?: string
          optimal_time?: string | null
          overall_match_score?: number
          recommendation_factors?: Json | null
          status?: string
          updated_at?: string
          user1_id: string
          user2_id: string
          venue_id: string
        }
        Update: {
          ai_reasoning?: string | null
          backup_venues?: string[] | null
          confidence_level?: number
          created_at?: string
          id?: string
          optimal_time?: string | null
          overall_match_score?: number
          recommendation_factors?: Json | null
          status?: string
          updated_at?: string
          user1_id?: string
          user2_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_date_recommendations_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_venue_scores: {
        Row: {
          ai_score: number
          contextual_score: number
          created_at: string
          crowd_factor: number | null
          event_factor: number | null
          id: string
          match_factors: Json | null
          time_factor: number | null
          updated_at: string
          user_id: string
          venue_id: string
          weather_factor: number | null
        }
        Insert: {
          ai_score?: number
          contextual_score?: number
          created_at?: string
          crowd_factor?: number | null
          event_factor?: number | null
          id?: string
          match_factors?: Json | null
          time_factor?: number | null
          updated_at?: string
          user_id: string
          venue_id: string
          weather_factor?: number | null
        }
        Update: {
          ai_score?: number
          contextual_score?: number
          created_at?: string
          crowd_factor?: number | null
          event_factor?: number | null
          id?: string
          match_factors?: Json | null
          time_factor?: number | null
          updated_at?: string
          user_id?: string
          venue_id?: string
          weather_factor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_venue_scores_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      date_feedback: {
        Row: {
          ai_accuracy_rating: number | null
          created_at: string
          feedback_text: string | null
          id: string
          invitation_id: string
          rating: number | null
          user_id: string
          venue_rating: number | null
          would_recommend_venue: boolean | null
          would_use_ai_again: boolean | null
        }
        Insert: {
          ai_accuracy_rating?: number | null
          created_at?: string
          feedback_text?: string | null
          id?: string
          invitation_id: string
          rating?: number | null
          user_id: string
          venue_rating?: number | null
          would_recommend_venue?: boolean | null
          would_use_ai_again?: boolean | null
        }
        Update: {
          ai_accuracy_rating?: number | null
          created_at?: string
          feedback_text?: string | null
          id?: string
          invitation_id?: string
          rating?: number | null
          user_id?: string
          venue_rating?: number | null
          would_recommend_venue?: boolean | null
          would_use_ai_again?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "date_feedback_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "date_invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      date_invitations: {
        Row: {
          ai_compatibility_score: number | null
          ai_generated_message: string | null
          ai_reasoning: string | null
          created_at: string
          id: string
          message: string | null
          planning_session_id: string | null
          proposed_date: string | null
          recipient_id: string
          sender_id: string
          status: string
          title: string
          updated_at: string
          venue_id: string | null
          venue_match_factors: Json | null
        }
        Insert: {
          ai_compatibility_score?: number | null
          ai_generated_message?: string | null
          ai_reasoning?: string | null
          created_at?: string
          id?: string
          message?: string | null
          planning_session_id?: string | null
          proposed_date?: string | null
          recipient_id: string
          sender_id: string
          status?: string
          title: string
          updated_at?: string
          venue_id?: string | null
          venue_match_factors?: Json | null
        }
        Update: {
          ai_compatibility_score?: number | null
          ai_generated_message?: string | null
          ai_reasoning?: string | null
          created_at?: string
          id?: string
          message?: string | null
          planning_session_id?: string | null
          proposed_date?: string | null
          recipient_id?: string
          sender_id?: string
          status?: string
          title?: string
          updated_at?: string
          venue_id?: string | null
          venue_match_factors?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "date_invitations_planning_session_id_fkey"
            columns: ["planning_session_id"]
            isOneToOne: false
            referencedRelation: "date_planning_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "date_invitations_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "date_invitations_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "date_invitations_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      date_planning_sessions: {
        Row: {
          ai_compatibility_score: number | null
          created_at: string
          expires_at: string
          id: string
          initiator_id: string
          participant_ids: Json | null
          partner_id: string
          preferences_data: Json | null
          selected_venue_id: string | null
          session_status: string
          updated_at: string
        }
        Insert: {
          ai_compatibility_score?: number | null
          created_at?: string
          expires_at?: string
          id?: string
          initiator_id: string
          participant_ids?: Json | null
          partner_id: string
          preferences_data?: Json | null
          selected_venue_id?: string | null
          session_status?: string
          updated_at?: string
        }
        Update: {
          ai_compatibility_score?: number | null
          created_at?: string
          expires_at?: string
          id?: string
          initiator_id?: string
          participant_ids?: Json | null
          partner_id?: string
          preferences_data?: Json | null
          selected_venue_id?: string | null
          session_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_preference_vectors: {
        Row: {
          activity_vector: number[] | null
          cuisine_vector: number[] | null
          feature_weights: Json | null
          id: string
          last_updated: string
          learning_data: Json | null
          price_vector: number[] | null
          time_vector: number[] | null
          user_id: string
          vibe_vector: number[] | null
        }
        Insert: {
          activity_vector?: number[] | null
          cuisine_vector?: number[] | null
          feature_weights?: Json | null
          id?: string
          last_updated?: string
          learning_data?: Json | null
          price_vector?: number[] | null
          time_vector?: number[] | null
          user_id: string
          vibe_vector?: number[] | null
        }
        Update: {
          activity_vector?: number[] | null
          cuisine_vector?: number[] | null
          feature_weights?: Json | null
          id?: string
          last_updated?: string
          learning_data?: Json | null
          price_vector?: number[] | null
          time_vector?: number[] | null
          user_id?: string
          vibe_vector?: number[] | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          dietary_restrictions: string[] | null
          id: string
          max_distance: number | null
          preferred_cuisines: string[] | null
          preferred_price_range: string[] | null
          preferred_times: string[] | null
          preferred_vibes: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dietary_restrictions?: string[] | null
          id?: string
          max_distance?: number | null
          preferred_cuisines?: string[] | null
          preferred_price_range?: string[] | null
          preferred_times?: string[] | null
          preferred_vibes?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dietary_restrictions?: string[] | null
          id?: string
          max_distance?: number | null
          preferred_cuisines?: string[] | null
          preferred_price_range?: string[] | null
          preferred_times?: string[] | null
          preferred_vibes?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_venue_feedback: {
        Row: {
          context: Json | null
          created_at: string
          feedback_type: string
          id: string
          updated_at: string
          user_id: string
          venue_id: string
        }
        Insert: {
          context?: Json | null
          created_at?: string
          feedback_type: string
          id?: string
          updated_at?: string
          user_id: string
          venue_id: string
        }
        Update: {
          context?: Json | null
          created_at?: string
          feedback_type?: string
          id?: string
          updated_at?: string
          user_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_venue_feedback_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string
          created_at: string
          cuisine_type: string | null
          description: string | null
          google_place_id: string | null
          id: string
          image_url: string | null
          is_active: boolean
          latitude: number | null
          longitude: number | null
          name: string
          opening_hours: Json | null
          phone: string | null
          price_range: string | null
          rating: number | null
          tags: string[] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address: string
          created_at?: string
          cuisine_type?: string | null
          description?: string | null
          google_place_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          opening_hours?: Json | null
          phone?: string | null
          price_range?: string | null
          rating?: number | null
          tags?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string
          created_at?: string
          cuisine_type?: string | null
          description?: string | null
          google_place_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          opening_hours?: Json | null
          phone?: string | null
          price_range?: string | null
          rating?: number | null
          tags?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      reset_user_preferences_to_default: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      setup_test_user_preferences: {
        Args: {
          target_user_id: string
          cuisines?: string[]
          vibes?: string[]
          times?: string[]
          price_range?: string[]
          max_dist?: number
          dietary?: string[]
        }
        Returns: boolean
      }
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
