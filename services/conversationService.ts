import { DatabaseService } from './databaseService';
import { CacheService } from './cacheService';
// Updated import: Use Chat instead of Conversation
import { Chat, Message as DbMessage, Json } from '../types/database';

export type Message = DbMessage;
const cache = CacheService.getInstance();
const CONVERSATION_CACHE_TTL = 5; // Cache conversations for 5 minutes
const MESSAGES_CACHE_TTL = 5; // Cache messages for 5 minutes

// Explicitly define the type for creating conversations
type CreateConversation = {
  user_id: string;
  character_id: string;
  title: string;
  is_favorite: boolean;
  character_data?: Json | null;
  last_message_preview?: string | null;
  last_interaction_at: string | null; // Initialize as null
};
type CreateMessage = Omit<Message, 'id' | 'created_at'>;

/**
 * Get all conversations for a user
 */
// Replace Conversation[] with Chat[]
export const getUserConversations = async (userId: string): Promise<Chat[]> => {
  const cacheKey = `user:${userId}:conversations`;
  
  const result = await cache.getOrCompute(
    cacheKey,
    async () => {
      const result = await DatabaseService.query('conversations', {
        filters: [{ column: 'user_id', operator: '=', value: userId }],
        orderBy: { column: 'updated_at', direction: 'desc' }
      });
      return result.data;
    },
    CONVERSATION_CACHE_TTL
  );
  
  return result || [];
};

/**
 * Get recent conversations for a user, ordered by last interaction
 */
// Replace Conversation[] with Chat[]
export const getRecentConversations = async (userId: string, limit: number = 15): Promise<Chat[]> => {
  // No caching for recent conversations as they change frequently,
  // or use a very short TTL if needed.
  try {
    const result = await DatabaseService.query('conversations', {
      filters: [{ column: 'user_id', operator: '=', value: userId }],
      orderBy: { column: 'last_interaction_at', direction: 'desc' },
      limit: limit
    });
    // Ensure last_interaction_at is not null if the DB allows nulls and we want only interacted chats
    // return (result.data || []).filter(c => c.last_interaction_at);
    return result.data || [];
  } catch (error) {
    console.error('Error fetching recent conversations:', error);
    return [];
  }
};


/**
 * Get conversation details
 */
// Replace Conversation with Chat
export const getConversation = async (conversationId: string): Promise<Chat | null> => {
  const cacheKey = `conversation:${conversationId}`;

  // Add type assertion for cache result and ensure the table name is correct
  return cache.getOrCompute(
    cacheKey,
    async () => DatabaseService.getById('chat_history', conversationId),
    CONVERSATION_CACHE_TTL
  ) as Promise<Chat | null>;
};

/**
 * Create a new conversation
 */
export const createConversation = async (
  userId: string,
  characterId: string,
  characterData: Record<string, any>,
  initialTitle?: string
// Replace Conversation with Chat
): Promise<Chat | null> => {
  try {
    const title = initialTitle || `Chat with ${characterData.name || 'Character'}`;
    
    const newConversation: CreateConversation = {
      user_id: userId,
      character_id: characterId,
      title,
      is_favorite: false,
      character_data: characterData as Json,
      last_interaction_at: null, // Initialize as null
      last_message_preview: null // Initialize as null
    };

    // Add type assertion for insert result and ensure table name is correct
    const conversation = await DatabaseService.insert('chat_history', newConversation) as Chat | null;

    if (conversation) {
      // Update cache
      cache.delete(`user:${userId}:conversations`);
    }
    
    return conversation;
  } catch (error) {
    console.error('Error creating conversation:', error);
    return null;
  }
};

/**
 * Update conversation details
 */
// Replace Conversation with Chat in updates type
// Add userId parameter for cache invalidation
export const updateConversation = async (
  conversationId: string,
  userId: string, // Added userId
  updates: Partial<Chat>
): Promise<boolean> => {
  try {
    // Perform the update first
    const updated = await DatabaseService.update('chat_history', conversationId, updates); // Use 'chat_history' table

    if (updated) { // Check if update was successful (DatabaseService.update should return boolean or updated row)
      // Update cache
      cache.delete(`conversation:${conversationId}`);
      // Use the passed userId for cache invalidation
      cache.delete(`user:${userId}:conversations`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error updating conversation:', error);
    return false;
  }
};

/**
 * Delete a conversation and its messages
 */
export const deleteConversation = async (conversationId: string): Promise<boolean> => {
  try {
    // Get conversation first to get user_id for cache invalidation
    const conversation = await getConversation(conversationId);
    if (!conversation) return false;

    // Use transaction to delete conversation and messages
    const success = await DatabaseService.transaction(async () => {
      // Delete all messages in the conversation using DatabaseService
      const messagesResult = await DatabaseService.query('messages', {
        filters: [{ column: 'conversation_id', operator: '=', value: conversationId }]
      });

      // Delete each message
      for (const message of messagesResult.data) {
        await DatabaseService.delete('messages', message.id);
      }
      
      // Then delete the conversation
      return await DatabaseService.delete('conversations', conversationId);
    });
    
    if (success) {
      // Update caches
      cache.delete(`conversation:${conversationId}`);
      cache.delete(`conversation:${conversationId}:messages`);
      // Use conversation.user_id obtained before deletion
      cache.delete(`user:${conversation.user_id}:conversations`);
    }

    return success || false;
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return false;
  }
};

/**
 * Get all messages for a conversation
 */
export const getConversationMessages = async (conversationId: string): Promise<Message[]> => {
  const cacheKey = `conversation:${conversationId}:messages`;
  
  const result = await cache.getOrCompute(
    cacheKey,
    async () => {
      const result = await DatabaseService.query('messages', {
        filters: [{ column: 'conversation_id', operator: '=', value: conversationId }],
        orderBy: { column: 'created_at', direction: 'asc' }
      });
      return result.data;
    },
    MESSAGES_CACHE_TTL
  );
  
  return result || [];
};

/**
 * Send a message in a conversation
 */
export const sendMessage = async (
  conversationId: string,
  senderType: 'user' | 'character',
  content: string,
  metadata?: Record<string, any>
): Promise<Message | null> => {
  try {
    // Corrected property name from conversation_id to chat_id
    const newMessage: CreateMessage = {
      chat_id: conversationId,
      sender: senderType === 'character' ? 'assistant' : 'user', // Use 'sender' based on ChatMessage interface
      content,
      // Assuming metadata is not part of the core ChatMessage type defined earlier
      // metadata: metadata as Json // Remove or adjust based on actual 'messages' table schema if needed
    };

    const insertedMessage = await DatabaseService.insert('messages', newMessage);

    if (insertedMessage) {
      // Fetch the conversation to get the user_id before updating
      const conversation = await getConversation(conversationId);
      const chat = await getConversation(conversationId);
      if (chat) {
        // Update the chat's updated_at timestamp.
        // The 'updates' object in updateConversation needs to match Partial<Chat>.
        // Since 'updated_at' is likely managed by the DB, we might not need explicit update here,
        // but if we do, it should be { updated_at: new Date().toISOString() }
        // For now, we'll rely on the DB trigger or handle it if necessary elsewhere.
        // We still need the userId for cache invalidation in updateConversation.
        await updateConversation(conversationId, chat.user_id, { /* Pass valid updates if any */ });

        // Update message cache
        cache.delete(`conversation:${conversationId}:messages`);
        // User conversation cache is handled within updateConversation now
      } else {
         console.warn(`Could not find conversation ${conversationId} to update after sending message.`);
      }
    }

    // Assert the type of the returned message
    return insertedMessage as Message | null;
  } catch (error) {
    console.error('Error sending message:', error);
    return null;
  }
};

/**
 * Get multiple conversations by IDs
 */
// Replace Conversation[] with Chat[] and explicitly type 'conv'
export const getConversationsByIds = async (ids: string[]): Promise<Chat[]> => {
  const results = await Promise.all(
    ids.map(id => getConversation(id))
  );

  // Explicitly type 'conv' and use 'Chat' type guard
  return results.filter((conv: Chat | null): conv is Chat => conv !== null);
};

/**
 * Toggle conversation favorite status
 */
export const toggleConversationFavorite = async (
  conversationId: string,
  userId: string, // Keep userId as it's needed for updateConversation
  isFavorite: boolean
): Promise<boolean> => {
  // Cannot update is_favorite as it doesn't exist on chat_history table.
  // This function's purpose needs re-evaluation based on schema.
  // If 'is_favorite' were moved to 'profiles' or a linking table, logic would change.
  // For now, log a warning and return false.
  console.warn(`Attempted to toggle favorite on chat ${conversationId} for user ${userId}, but 'is_favorite' column does not exist on chat_history.`);
  // Returning false as the intended operation cannot be completed.
  // We avoid calling updateConversation unnecessarily.
  return false;
  // Original logic that would fail:
  // return await updateConversation(conversationId, userId, { is_favorite: isFavorite });
};