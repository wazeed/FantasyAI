import { supabase } from '../utils/supabase';

export type Conversation = {
  id: string;
  user_id: string;
  character_id: string;
  title: string;
  is_favorite: boolean;
  character_data: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'character';
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
};

// Get all conversations for a user
export const getUserConversations = async (userId: string): Promise<Conversation[]> => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user conversations:', error);
    return [];
  }
};

// Get conversation details
export const getConversation = async (conversationId: string): Promise<Conversation | null> => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return null;
  }
};

// Create a new conversation
export const createConversation = async (
  userId: string,
  characterId: string,
  characterData: Record<string, any>,
  initialTitle?: string
): Promise<Conversation | null> => {
  try {
    const title = initialTitle || `Chat with ${characterData.name || 'Character'}`;
    
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        character_id: characterId,
        title,
        character_data: characterData,
      })
      .select('*')
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating conversation:', error);
    return null;
  }
};

// Update conversation details
export const updateConversation = async (
  conversationId: string,
  updates: Partial<Conversation>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('conversations')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating conversation:', error);
    return false;
  }
};

// Delete a conversation
export const deleteConversation = async (conversationId: string): Promise<boolean> => {
  try {
    // First delete all messages in the conversation
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId);
    
    if (messagesError) throw messagesError;
    
    // Then delete the conversation
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return false;
  }
};

// Get all messages for a conversation
export const getConversationMessages = async (conversationId: string): Promise<Message[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    return [];
  }
};

// Send a message
export const sendMessage = async (
  conversationId: string,
  senderType: 'user' | 'character',
  content: string,
  metadata?: Record<string, any>
): Promise<Message | null> => {
  try {
    // Add the message
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_type: senderType,
        content,
        metadata,
      })
      .select('*')
      .single();
    
    if (error) throw error;
    
    // Update conversation's updated_at timestamp
    await updateConversation(conversationId, {});
    
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    return null;
  }
}; 