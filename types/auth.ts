import { User as SupabaseUser } from '@supabase/supabase-js';

export interface User extends SupabaseUser {
  avatar_url?: string;
  username?: string;
  full_name?: string;
  preferences?: {
    theme?: 'light' | 'dark';
    notifications?: boolean;
    language?: string;
  };
}

export type AuthUser = User | null;