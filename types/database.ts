import { SupabaseClient } from '@supabase/supabase-js';

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface PersonalityData {
  traits: string[];
  background: string;
  speaking_style: string;
  interests: string[];
  [key: string]: any; // Allow for additional personality fields
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username?: string;
          avatar_url?: string;
          display_name?: string;
          bio?: string;
          preferences?: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          character_id: string;
          title: string;
          is_favorite: boolean;
          character_data: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['conversations']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_type: 'user' | 'character';
          role: 'user' | 'character'; // Added to maintain compatibility
          content: string;
          metadata?: Json;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
      user_characters: {
        Row: {
          id: string;
          user_id: string;
          character_id: string;
          is_favorite: boolean;
          last_interaction: string | null;
          interaction_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_characters']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_characters']['Insert']>;
      };
      characters: {
        Row: {
          id: string;
          name: string;
          type: CharacterType;
          description: string;
          avatar_url: string;
          personality: PersonalityData;
          metadata?: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['characters']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['characters']['Insert']>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      delete_conversation_transaction: {
        Args: { p_conversation_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      character_type: CharacterType;
    };
  };
}

// Character types
export type CharacterType = 'historical' | 'fictional' | 'celebrity' | 'anime' | 'fantasy' | 'professional' | 'scientist';

// Table names type
export type TableNames = keyof Database['public']['Tables'];

// Export specific types for use in services
export type UserProfile = Database['public']['Tables']['users']['Row'];
export type Profile = UserProfile; // Alias for compatibility
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type UserCharacter = Database['public']['Tables']['user_characters']['Row'];
export type Character = Database['public']['Tables']['characters']['Row'];

// Error types
export interface DatabaseError {
  code: string;
  message: string;
  details?: unknown;
  hint?: string;
}

export interface QueryResult<T> {
  data: T | null;
  error: DatabaseError | null;
}

// Helper type for paginated results
export interface PaginatedResult<T> {
  data: T[];
  count: number;
  hasMore: boolean;
}

// Helper types for filters and ordering
export type OrderDirection = 'asc' | 'desc';

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: {
    column: string;
    direction: OrderDirection;
  };
  filters?: {
    column: string;
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'like' | 'ilike' | 'in';
    value: any;
  }[];
}