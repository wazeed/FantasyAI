import { supabase } from '../utils/supabase';

export type UserCharacter = {
  id: string;
  user_id: string;
  character_id: string;
  is_favorite: boolean;
  last_interaction: string | null;
  interaction_count: number;
  created_at: string;
  updated_at: string;
};

// Get all user-character relationships for a user
export const getUserCharacters = async (userId: string): Promise<UserCharacter[]> => {
  try {
    const { data, error } = await supabase
      .from('user_characters')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user characters:', error);
    return [];
  }
};

// Get favorite characters for a user
export const getFavoriteCharacters = async (userId: string): Promise<UserCharacter[]> => {
  try {
    const { data, error } = await supabase
      .from('user_characters')
      .select('*')
      .eq('user_id', userId)
      .eq('is_favorite', true)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching favorite characters:', error);
    return [];
  }
};

// Get recently interacted characters for a user
export const getRecentCharacters = async (userId: string, limit: number = 5): Promise<UserCharacter[]> => {
  try {
    const { data, error } = await supabase
      .from('user_characters')
      .select('*')
      .eq('user_id', userId)
      .not('last_interaction', 'is', null)
      .order('last_interaction', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching recent characters:', error);
    return [];
  }
};

// Record an interaction with a character
export const recordCharacterInteraction = async (
  userId: string,
  characterId: string
): Promise<UserCharacter | null> => {
  try {
    const now = new Date().toISOString();
    
    // Check if relationship already exists
    const { data: existingRelation } = await supabase
      .from('user_characters')
      .select('*')
      .eq('user_id', userId)
      .eq('character_id', characterId)
      .single();
    
    if (existingRelation) {
      // Update existing relationship
      const { data, error } = await supabase
        .from('user_characters')
        .update({
          last_interaction: now,
          interaction_count: existingRelation.interaction_count + 1,
          updated_at: now,
        })
        .eq('id', existingRelation.id)
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    } else {
      // Create new relationship
      const { data, error } = await supabase
        .from('user_characters')
        .insert({
          user_id: userId,
          character_id: characterId,
          last_interaction: now,
          interaction_count: 1,
        })
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error recording character interaction:', error);
    return null;
  }
};

// Toggle favorite status for a character
export const toggleFavoriteCharacter = async (
  userId: string,
  characterId: string,
  isFavorite: boolean
): Promise<boolean> => {
  try {
    // Check if relationship already exists
    const { data: existingRelation } = await supabase
      .from('user_characters')
      .select('*')
      .eq('user_id', userId)
      .eq('character_id', characterId)
      .single();
    
    if (existingRelation) {
      // Update existing relationship
      const { error } = await supabase
        .from('user_characters')
        .update({
          is_favorite: isFavorite,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingRelation.id);
      
      if (error) throw error;
    } else {
      // Create new relationship
      const { error } = await supabase
        .from('user_characters')
        .insert({
          user_id: userId,
          character_id: characterId,
          is_favorite: isFavorite,
        });
      
      if (error) throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error toggling favorite character:', error);
    return false;
  }
}; 