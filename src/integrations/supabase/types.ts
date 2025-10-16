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
        Relationships: []
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
        Relationships: []
      }
      coding_conversations: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      coding_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "coding_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "coding_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      coding_task_logs: {
        Row: {
          completed_at: string | null
          conversation_id: string
          created_at: string | null
          error_message: string | null
          id: string
          input_data: Json | null
          output_data: Json | null
          status: string
          task_type: string
        }
        Insert: {
          completed_at?: string | null
          conversation_id: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          status: string
          task_type: string
        }
        Update: {
          completed_at?: string | null
          conversation_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          status?: string
          task_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "coding_task_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "coding_conversations"
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
          actual_date_time: string | null
          ai_compatibility_score: number | null
          ai_generated_message: string | null
          ai_reasoning: string | null
          created_at: string
          date_status: string | null
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
          actual_date_time?: string | null
          ai_compatibility_score?: number | null
          ai_generated_message?: string | null
          ai_reasoning?: string | null
          created_at?: string
          date_status?: string | null
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
          actual_date_time?: string | null
          ai_compatibility_score?: number | null
          ai_generated_message?: string | null
          ai_reasoning?: string | null
          created_at?: string
          date_status?: string | null
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
        ]
      }
      date_planning_sessions: {
        Row: {
          ai_compatibility_score: number | null
          both_preferences_complete: boolean | null
          created_at: string
          expires_at: string
          id: string
          initiator_id: string
          initiator_preferences: Json | null
          initiator_preferences_complete: boolean | null
          mutual_venue_selection: boolean | null
          participant_ids: Json | null
          partner_id: string
          partner_preferences: Json | null
          partner_preferences_complete: boolean | null
          planning_mode: string
          preferences_data: Json | null
          selected_venue_id: string | null
          session_status: string
          updated_at: string
        }
        Insert: {
          ai_compatibility_score?: number | null
          both_preferences_complete?: boolean | null
          created_at?: string
          expires_at?: string
          id?: string
          initiator_id: string
          initiator_preferences?: Json | null
          initiator_preferences_complete?: boolean | null
          mutual_venue_selection?: boolean | null
          participant_ids?: Json | null
          partner_id: string
          partner_preferences?: Json | null
          partner_preferences_complete?: boolean | null
          planning_mode?: string
          preferences_data?: Json | null
          selected_venue_id?: string | null
          session_status?: string
          updated_at?: string
        }
        Update: {
          ai_compatibility_score?: number | null
          both_preferences_complete?: boolean | null
          created_at?: string
          expires_at?: string
          id?: string
          initiator_id?: string
          initiator_preferences?: Json | null
          initiator_preferences_complete?: boolean | null
          mutual_venue_selection?: boolean | null
          participant_ids?: Json | null
          partner_id?: string
          partner_preferences?: Json | null
          partner_preferences_complete?: boolean | null
          planning_mode?: string
          preferences_data?: Json | null
          selected_venue_id?: string | null
          session_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      date_proposals: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          message: string | null
          planning_session_id: string | null
          proposed_date: string
          proposer_id: string
          recipient_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          message?: string | null
          planning_session_id?: string | null
          proposed_date: string
          proposer_id: string
          recipient_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          message?: string | null
          planning_session_id?: string | null
          proposed_date?: string
          proposer_id?: string
          recipient_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "date_proposals_planning_session_id_fkey"
            columns: ["planning_session_id"]
            isOneToOne: false
            referencedRelation: "date_planning_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_rewards: {
        Row: {
          badges_earned: Json
          both_rated_bonus: boolean | null
          completion_level: string
          created_at: string
          feedback_id: string
          id: string
          points_earned: number
          speed_bonus: boolean | null
          user_id: string
        }
        Insert: {
          badges_earned?: Json
          both_rated_bonus?: boolean | null
          completion_level: string
          created_at?: string
          feedback_id: string
          id?: string
          points_earned?: number
          speed_bonus?: boolean | null
          user_id: string
        }
        Update: {
          badges_earned?: Json
          both_rated_bonus?: boolean | null
          completion_level?: string
          created_at?: string
          feedback_id?: string
          id?: string
          points_earned?: number
          speed_bonus?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_feedback_rewards_feedback"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "date_feedback"
            referencedColumns: ["id"]
          },
        ]
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
      invitation_messages: {
        Row: {
          created_at: string | null
          id: string
          invitation_id: string
          message: string
          read_at: string | null
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invitation_id: string
          message: string
          read_at?: string | null
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invitation_id?: string
          message?: string
          read_at?: string | null
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitation_messages_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "date_invitations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitation_messages_sender_id_fkey"
            columns: ["sender_id"]
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
      user_points: {
        Row: {
          badges: Json
          created_at: string
          id: string
          last_review_date: string | null
          level: number
          streak_count: number
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          badges?: Json
          created_at?: string
          id?: string
          last_review_date?: string | null
          level?: number
          streak_count?: number
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          badges?: Json
          created_at?: string
          id?: string
          last_review_date?: string | null
          level?: number
          streak_count?: number
          total_points?: number
          updated_at?: string
          user_id?: string
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
        Relationships: []
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
          photos: Json | null
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
          photos?: Json | null
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
          photos?: Json | null
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
      count_perfect_pairs: {
        Args: { target_user_id: string }
        Returns: number
      }
      create_test_venues: {
        Args: { venues_data: Json }
        Returns: boolean
      }
      reset_user_preferences_to_default: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      setup_test_user_preferences: {
        Args: {
          cuisines?: string[]
          dietary?: string[]
          max_dist?: number
          price_range?: string[]
          target_user_id: string
          times?: string[]
          vibes?: string[]
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
