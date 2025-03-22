import { supabase } from '../utils/supabase';
import { Session, User } from '@supabase/supabase-js';

export type UserProfile = {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
  display_name?: string;
  bio?: string;
  preferences?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
};

// Get the user profile
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

// Create a new user profile after signup
export const createUserProfile = async (user: User): Promise<UserProfile | null> => {
  try {
    // Check if profile already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();
    
    if (existingUser) {
      return getUserProfile(user.id);
    }

    // Create new profile
    const newUser: UserProfile = {
      id: user.id,
      email: user.email || '',
      username: user.email?.split('@')[0] || '',
      display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
      avatar_url: user.user_metadata?.avatar_url || '',
    };
    
    const { data, error } = await supabase
      .from('users')
      .insert(newUser)
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating user profile:', error);
    return null;
  }
};

// Update a user profile
export const updateUserProfile = async (
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
};

// Update user preferences
export const updateUserPreferences = async (
  userId: string,
  preferences: Record<string, any>
): Promise<boolean> => {
  try {
    const { data: userData } = await supabase
      .from('users')
      .select('preferences')
      .eq('id', userId)
      .single();
    
    const currentPreferences = userData?.preferences || {};
    const updatedPreferences = { ...currentPreferences, ...preferences };
    
    const { error } = await supabase
      .from('users')
      .update({
        preferences: updatedPreferences,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return false;
  }
}; 