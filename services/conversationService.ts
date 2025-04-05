import { supabase } from '../utils/supabase';
import { Database } from '../types/database'; // Import the main generated type
import { RealtimeChannel } from '@supabase/supabase-js';

// Define Message type based on the generated types and EXPORT it
export type Message = Database['public']['Tables']['messages']['Row'];
// Define type for inserting a new message
// Define type for inserting a new message, including optional media URLs
type MessageInsert = Database['public']['Tables']['messages']['Insert'] & {
  image_url?: string | null;
  audio_url?: string | null;
};

// Define a type for the recent chats list, used by the RPC function result
// TODO: Uncomment this interface when the 'get_recent_chats' SQL function is defined and types are regenerated.
// export interface RecentChatInfo {
//   character_id: number;
//   last_message_content: string | null;
//   last_message_time: string | null;
//   // Note: Add other relevant fields if the RPC function 'get_recent_chats' returns them
//   // e.g., character_name, character_image_url if joined in the RPC function
// }


/**
 * Fetches all messages for a specific chat between a user and a character,
 * ordered by creation time (ascending).
 * @param userId - The ID of the user.
 * @param characterId - The ID of the character.
 * @returns A promise that resolves to an array of messages, or an empty array on error or if none found.
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
      console.error(`Error fetching chat messages for user ${userId}, character ${characterId}:`, error.message);
      return []; // Return empty array on error
    }
    return data || []; // Return data or empty array if null
  } catch (error) {
    console.error('Unexpected error in getChatMessages:', error instanceof Error ? error.message : error);
    return []; // Return empty array on unexpected errors
  }
};

// TODO: Uncomment this function when the 'get_recent_chats' SQL function is defined and types are regenerated.
// /**
//  * Fetches recent chats for a user using the 'get_recent_chats' RPC function.
//  * Shows the last message summary for each character interaction.
//  * @param userId - The ID of the user.
//  * @param limit - The maximum number of recent chats to retrieve (default: 20).
//  * @returns A promise that resolves to an array of recent chat info, or an empty array on error.
//  */
// export const getRecentChats = async (userId: string, limit: number = 20): Promise<RecentChatInfo[]> => {
//   try {
//     // Ensure the RPC function 'get_recent_chats' exists in Supabase
//     // and accepts 'p_user_id' and 'p_limit' parameters.
//     // The 'never' type error here indicates the function is not defined in the generated types (types/database.ts)
//     // Regenerate types after defining the function in SQL.
//     const { data, error } = await supabase.rpc('get_recent_chats', { p_user_id: userId, p_limit: limit });
//
//     if (error) {
//       console.error(`Error fetching recent chats via RPC for user ${userId}:`, error.message);
//       return []; // Return empty array on RPC error
//     }
//
//     // Assume the RPC function returns the correct structure matching RecentChatInfo[]
//     // If the structure might vary, add more robust type checking here.
//     return (data as RecentChatInfo[]) || [];
//
//   } catch (error) {
//     console.error('Unexpected error in getRecentChats:', error instanceof Error ? error.message : error);
//     return []; // Return empty array on unexpected errors
//   }
// };


/**
 * Sends a message from either the user or the AI and saves it to the 'messages' table.
 * @param userId - The ID of the user associated with the conversation.
 * @param characterId - The ID of the character involved in the conversation.
 * @param content - The text content of the message (can be null if sending media).
 * @param sender - Indicates whether the message is from the 'user' or 'ai'.
 * @param imageUrl - Optional URL of an image associated with the message.
 * @param audioUrl - Optional URL of an audio file associated with the message.
 * @returns A promise that resolves to the newly created message object, or null on error.
 */
export const sendMessage = async (
  userId: string,
  characterId: number,
  content: string | null, // Allow null content for media messages
  sender: 'user' | 'ai',
  imageUrl?: string | null, // Add optional image URL parameter
  audioUrl?: string | null // Add optional audio URL parameter
): Promise<Message | null> => {
  try {
    // Construct the message object, including optional fields only if they have a value
    const newMessage: MessageInsert = {
      user_id: userId,
      character_id: characterId,
      content: content ?? '', // Provide empty string if content is null to satisfy NOT NULL constraint
      sender: sender,
      ...(imageUrl && { image_url: imageUrl }), // Conditionally add image_url
      ...(audioUrl && { audio_url: audioUrl }), // Conditionally add audio_url
    };

    const { data, error } = await supabase
      .from('messages')
      .insert(newMessage)
      .select() // Select the newly inserted row
      .single(); // Expect a single row back

    if (error) {
      console.error(`Error sending message for user ${userId}, character ${characterId}:`, error.message);
      return null; // Return null on error
    }

    return data; // Return the newly created message
  } catch (error) {
    console.error('Unexpected error in sendMessage:', error instanceof Error ? error.message : error);
    return null; // Return null on unexpected errors
  }
};

/**
 * Deletes all messages in the chat history between a specific user and character.
 * @param userId - The ID of the user.
 * @param characterId - The ID of the character.
 * @returns A promise that resolves to true if deletion was successful or no rows needed deleting, false on error.
 */
export const deleteChat = async (userId: string, characterId: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('user_id', userId)
      .eq('character_id', characterId);

    if (error) {
      // Don't necessarily treat 'no rows found' as an error for deletion
      // Log other errors
      console.error(`Error deleting chat for user ${userId}, character ${characterId}:`, error.message);
      return false; // Return false on actual deletion error
    }

    return true; // Return true if deletion succeeded or no matching rows existed
  } catch (error) {
    console.error('Unexpected error in deleteChat:', error instanceof Error ? error.message : error);
    return false; // Return false on unexpected errors
  }
};

/**
 * Fetches a paginated list of messages for a specific chat, ordered oldest to newest.
 * @param userId - The ID of the user.
 * @param characterId - The ID of the character.
 * @param page - The page number to fetch (1-based).
 * @param pageSize - The number of messages per page (default: 50).
 * @returns A promise resolving to an object containing the messages array and a boolean indicating if more messages are available. Returns empty messages and hasMore: false on error.
 */
export const getPaginatedMessages = async (
  userId: string,
  characterId: number,
  page: number = 1,
  pageSize: number = 50
): Promise<{ messages: Message[], hasMore: boolean }> => {
  const defaultReturn = { messages: [], hasMore: false };
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Fetch total count to determine if more pages exist
    // Using head: true is efficient as it doesn't retrieve data rows
    const { count, error: countError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('character_id', characterId);

     if (countError) {
       console.error(`Error fetching message count for user ${userId}, character ${characterId}:`, countError.message);
       return defaultReturn; // Return default on count error
     }

    // Fetch the actual data page, ordered ascending for standard chat display
    const { data, error: dataError } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .eq('character_id', characterId)
      .order('created_at', { ascending: true }) // Oldest first
      .range(from, to);

    if (dataError) {
      console.error(`Error fetching paginated messages (page ${page}) for user ${userId}, character ${characterId}:`, dataError.message);
      return defaultReturn; // Return default on data fetch error
    }

    return {
      messages: data || [],
      hasMore: count ? count > (page * pageSize) : false // Calculate if more messages exist
    };
  } catch (error) {
    console.error('Unexpected error in getPaginatedMessages:', error instanceof Error ? error.message : error);
    return defaultReturn; // Return default on unexpected errors
  }
};

/**
 * Sets up a real-time subscription for new messages inserted into a specific chat.
 * @param userId - The ID of the user.
 * @param characterId - The ID of the character.
 * @param onMessage - Callback function invoked with the new message when received.
 * @returns The Supabase RealtimeChannel instance, allowing the caller to unsubscribe later.
 */
export const subscribeToNewMessages = (
  userId: string,
  characterId: number,
  onMessage: (message: Message) => void
): RealtimeChannel => {
  const channelIdentifier = `chat-${userId}-${characterId}`;
  const channel = supabase
    .channel(channelIdentifier)
    .on<Message>( // Specify the payload type for type safety
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        // Filter ensures we only get messages for this specific chat
        filter: `user_id=eq.${userId} AND character_id=eq.${characterId}`
      },
      (payload) => {
        // payload.new contains the newly inserted Message row
        console.log(`New message received on channel ${channelIdentifier}:`, payload.new);
        onMessage(payload.new); // Pass the new message to the callback
      }
    )
    .subscribe((status, err) => {
      // Optional: Handle subscription status changes or errors
      if (err) {
        console.error(`Error subscribing to channel ${channelIdentifier}:`, err);
      } else {
        console.log(`Subscription status for channel ${channelIdentifier}: ${status}`);
      }
    });

  console.log(`Attempting to subscribe to real-time channel: ${channelIdentifier}`);
  return channel;
};

/**
 * Unsubscribes from a specific Supabase RealtimeChannel.
 * Logs the outcome or any errors encountered.
 * @param channel - The RealtimeChannel instance to unsubscribe from.
 */
export const unsubscribeFromChat = async (channel: RealtimeChannel | null) => {
  if (channel) {
    const channelTopic = channel.topic; // Store topic in case channel becomes invalid after unsubscribe
    try {
      const status = await channel.unsubscribe();
      console.log(`Unsubscribed from channel ${channelTopic}, status: ${status}`);
    } catch (error) {
      console.error(`Error unsubscribing from channel ${channelTopic}:`, error instanceof Error ? error.message : error);
    }
  } else {
    console.warn("Attempted to unsubscribe from a null channel.");
  }
};

// Note: Functions related to older schema versions (e.g., 'conversations', 'chat_history')
// are assumed to be removed or handled elsewhere as per previous refactoring efforts.