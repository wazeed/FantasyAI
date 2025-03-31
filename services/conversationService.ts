import { supabase } from '../utils/supabase';
import { Database } from '../types/database'; // Import the main generated type
import { RealtimeChannel } from '@supabase/supabase-js';

// Define Message type based on the generated types and EXPORT it
export type Message = Database['public']['Tables']['messages']['Row'];
// Define type for inserting a new message
type MessageInsert = Database['public']['Tables']['messages']['Insert'];

// Define a type for the recent chats list
export interface RecentChatInfo {
  character_id: number;
  last_message_content: string | null;
  last_message_time: string | null;
  // Add other relevant fields if needed, e.g., character name/image from a join
}


/**
 * Get all messages for a specific chat between a user and a character, ordered by creation time.
 */
export const getChatMessages = async (userId: string, characterId: number): Promise<Message[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .eq('character_id', characterId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching chat messages:', error);
      throw error;
    }
    return data || [];
  } catch (error) {
    console.error('Error in getChatMessages:', error);
    return [];
  }
};

/**
 * Get recent chats for a user, showing the last message for each character.
 * Note: This requires a more complex query or post-processing.
 * A simpler version might just fetch distinct character_ids recently messaged.
 */
export const getRecentChats = async (userId: string, limit: number = 20): Promise<RecentChatInfo[]> => {
  try {
    // This query fetches the latest message timestamp for each character interaction
    // Ensure the RPC function 'get_recent_chats' exists and accepts 'p_user_id' and 'p_limit'
    const { data, error } = await supabase.rpc('get_recent_chats', { p_user_id: userId, p_limit: limit });


    if (error) {
      console.error('Error fetching recent chats via RPC:', error);
      // Fallback or alternative logic if RPC fails or doesn't exist
      // For now, just rethrow or return empty
      throw error;
    }

    // Assuming the RPC function returns the correct structure
    return (data as RecentChatInfo[]) || [];

  } catch (error) {
    console.error('Error in getRecentChats:', error);
    return [];
  }
};


/**
 * Send a message and save it to the 'messages' table.
 */
export const sendMessage = async (
  userId: string,
  characterId: number,
  content: string,
  sender: 'user' | 'ai' // Use the enum defined in the table
): Promise<Message | null> => {
  try {
    const newMessage: MessageInsert = {
      user_id: userId,
      character_id: characterId,
      content,
      sender: sender // Directly use the sender value
    };

    const { data, error } = await supabase
      .from('messages')
      .insert(newMessage)
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in sendMessage:', error);
    return null;
  }
};

/**
 * Delete all messages between a user and character
 */
export const deleteChat = async (userId: string, characterId: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('user_id', userId)
      .eq('character_id', characterId);

    if (error) {
      console.error('Error deleting chat:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteChat:', error);
    return false;
  }
};

/**
 * Get paginated messages for a chat, ordered oldest to newest for display
 */
export const getPaginatedMessages = async (
  userId: string,
  characterId: number,
  page: number = 1,
  pageSize: number = 50
): Promise<{ messages: Message[], hasMore: boolean }> => {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Fetch total count first (or adjust query if count is not needed every time)
    const { count, error: countError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true }) // head: true gets only count
      .eq('user_id', userId)
      .eq('character_id', characterId);

     if (countError) {
       console.error('Error fetching message count:', countError);
       throw countError;
     }

    // Fetch the actual data page, ordered ascending for chat display
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .eq('character_id', characterId)
      .order('created_at', { ascending: true }) // Order ascending for display
      .range(from, to);

    if (error) {
      console.error('Error fetching paginated messages:', error);
      throw error;
    }

    return {
      messages: data || [],
      hasMore: count ? count > (page * pageSize) : false
    };
  } catch (error) {
    console.error('Error in getPaginatedMessages:', error);
    return { messages: [], hasMore: false };
  }
};

/**
 * Set up real-time subscription for new messages in a specific chat.
 * Returns the channel instance so the caller can unsubscribe.
 */
export const subscribeToNewMessages = (
  userId: string,
  characterId: number,
  onMessage: (message: Message) => void
): RealtimeChannel => {
  const channel = supabase
    .channel(`chat-${userId}-${characterId}`) // Unique channel per chat
    .on<Message>( // Specify the payload type
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `user_id=eq.${userId} AND character_id=eq.${characterId}`
      },
      (payload) => {
        console.log('New message received:', payload.new);
        onMessage(payload.new);
      }
    )
    .subscribe((status, err) => {
      if (err) {
        console.error(`Error subscribing to chat ${userId}-${characterId}:`, err);
      }
      console.log(`Subscription status for chat ${userId}-${characterId}: ${status}`);
    });

  return channel;
};

/**
 * Unsubscribe from a specific chat channel.
 */
export const unsubscribeFromChat = async (channel: RealtimeChannel) => {
  if (channel) {
    try {
      const status = await channel.unsubscribe();
      console.log(`Unsubscribed from channel ${channel.topic}, status: ${status}`);
    } catch (error) {
      console.error(`Error unsubscribing from channel ${channel.topic}:`, error);
    }
  }
};

// --- Functions related to old 'conversations'/'chat_history' schema are removed or commented out ---