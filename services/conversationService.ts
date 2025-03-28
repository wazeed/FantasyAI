import { DatabaseService } from './databaseService';
import { CacheService } from './cacheService';
import { Conversation, Message as DbMessage, Json } from '../types/database';

export type Message = DbMessage;
const cache = CacheService.getInstance();
const CONVERSATION_CACHE_TTL = 5; // Cache conversations for 5 minutes
const MESSAGES_CACHE_TTL = 5; // Cache messages for 5 minutes

type CreateConversation = Omit<Conversation, 'id' | 'created_at' | 'updated_at'>;
type CreateMessage = Omit<Message, 'id' | 'created_at'>;

/**
 * Get all conversations for a user
 */
export const getUserConversations = async (userId: string): Promise<Conversation[]> => {
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
 * Get conversation details
 */
export const getConversation = async (conversationId: string): Promise<Conversation | null> => {
  const cacheKey = `conversation:${conversationId}`;
  
  return cache.getOrCompute(
    cacheKey,
    async () => DatabaseService.getById('conversations', conversationId),
    CONVERSATION_CACHE_TTL
  );
};

/**
 * Create a new conversation
 */
export const createConversation = async (
  userId: string,
  characterId: string,
  characterData: Record<string, any>,
  initialTitle?: string
): Promise<Conversation | null> => {
  try {
    const title = initialTitle || `Chat with ${characterData.name || 'Character'}`;
    
    const newConversation: CreateConversation = {
      user_id: userId,
      character_id: characterId,
      title,
      is_favorite: false,
      character_data: characterData as Json
    };
    
    const conversation = await DatabaseService.insert('conversations', newConversation);
    
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
export const updateConversation = async (
  conversationId: string,
  updates: Partial<Conversation>
): Promise<boolean> => {
  try {
    const conversation = await DatabaseService.update('conversations', conversationId, updates);
    
    if (conversation) {
      // Update cache
      cache.delete(`conversation:${conversationId}`);
      cache.delete(`user:${conversation.user_id}:conversations`);
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
    const newMessage: CreateMessage = {
      conversation_id: conversationId,
      sender_type: senderType,
      role: senderType, // For compatibility
      content,
      metadata: metadata as Json
    };
    
    const message = await DatabaseService.insert('messages', newMessage);
    
    if (message) {
      // Update conversation's updated_at timestamp
      await updateConversation(conversationId, {});
      
      // Update cache
      cache.delete(`conversation:${conversationId}:messages`);
    }
    
    return message;
  } catch (error) {
    console.error('Error sending message:', error);
    return null;
  }
};

/**
 * Get multiple conversations by IDs
 */
export const getConversationsByIds = async (ids: string[]): Promise<Conversation[]> => {
  const results = await Promise.all(
    ids.map(id => getConversation(id))
  );
  
  return results.filter((conv): conv is Conversation => conv !== null);
};

/**
 * Toggle conversation favorite status
 */
export const toggleConversationFavorite = async (
  conversationId: string,
  isFavorite: boolean
): Promise<boolean> => {
  return await updateConversation(conversationId, { is_favorite: isFavorite });
};