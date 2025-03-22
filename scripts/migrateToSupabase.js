const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * This script migrates existing local data to Supabase.
 * It assumes you have JSON files with users, chat history, etc.
 */
async function migrateToSupabase() {
  try {
    console.log('Starting migration to Supabase...');
    
    // 1. Migrate Users
    await migrateUsers();
    
    // 2. Migrate Conversations
    await migrateConversations();
    
    // 3. Migrate Character Interactions
    await migrateCharacterInteractions();
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

async function migrateUsers() {
  try {
    console.log('Migrating users...');
    
    // Read users from JSON file (example path - adjust as needed)
    const usersFilePath = path.join(__dirname, '../data/users.json');
    
    if (!fs.existsSync(usersFilePath)) {
      console.log('No users file found, skipping user migration');
      return;
    }
    
    const usersData = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
    
    // For each user in the file
    for (const user of usersData) {
      // Check if user already exists in Supabase auth
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (existingUser) {
        console.log(`User ${user.id} already exists, updating...`);
        
        // Update existing user
        const { error } = await supabase
          .from('users')
          .update({
            username: user.username,
            display_name: user.displayName,
            avatar_url: user.avatarUrl,
            preferences: user.preferences || {},
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
        
        if (error) throw error;
      } else {
        console.log(`Creating new user ${user.id}...`);
        
        // Create new user profile
        const { error } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            username: user.username,
            display_name: user.displayName,
            avatar_url: user.avatarUrl,
            preferences: user.preferences || {},
          });
        
        if (error) throw error;
      }
    }
    
    console.log(`Migrated ${usersData.length} users successfully`);
  } catch (error) {
    console.error('User migration failed:', error);
    throw error;
  }
}

async function migrateConversations() {
  try {
    console.log('Migrating conversations and messages...');
    
    // Read conversations from JSON file (example path - adjust as needed)
    const conversationsFilePath = path.join(__dirname, '../data/conversations.json');
    
    if (!fs.existsSync(conversationsFilePath)) {
      console.log('No conversations file found, skipping conversation migration');
      return;
    }
    
    const conversationsData = JSON.parse(fs.readFileSync(conversationsFilePath, 'utf8'));
    
    // For each conversation
    for (const conversation of conversationsData) {
      // Check if conversation already exists
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', conversation.userId)
        .eq('character_id', conversation.characterId)
        .single();
      
      let conversationId;
      
      if (existingConversation) {
        console.log(`Conversation between user ${conversation.userId} and character ${conversation.characterId} already exists, updating...`);
        conversationId = existingConversation.id;
        
        // Update existing conversation
        const { error } = await supabase
          .from('conversations')
          .update({
            title: conversation.title,
            is_favorite: conversation.isFavorite || false,
            character_data: conversation.characterData || {},
            updated_at: new Date().toISOString()
          })
          .eq('id', conversationId);
        
        if (error) throw error;
      } else {
        console.log(`Creating new conversation for user ${conversation.userId} and character ${conversation.characterId}...`);
        
        // Create new conversation
        const { data, error } = await supabase
          .from('conversations')
          .insert({
            user_id: conversation.userId,
            character_id: conversation.characterId,
            title: conversation.title,
            is_favorite: conversation.isFavorite || false,
            character_data: conversation.characterData || {},
          })
          .select('id')
          .single();
        
        if (error) throw error;
        conversationId = data.id;
      }
      
      // Migrate messages for this conversation
      if (conversation.messages && conversation.messages.length > 0) {
        // First, delete existing messages to avoid duplicates
        const { error: deleteError } = await supabase
          .from('messages')
          .delete()
          .eq('conversation_id', conversationId);
        
        if (deleteError) throw deleteError;
        
        // Insert all messages
        const messagesToInsert = conversation.messages.map(msg => ({
          conversation_id: conversationId,
          sender_type: msg.sender === 'user' ? 'user' : 'character',
          content: msg.text,
          metadata: msg.metadata || {},
          created_at: new Date(msg.timestamp).toISOString()
        }));
        
        const { error: insertError } = await supabase
          .from('messages')
          .insert(messagesToInsert);
        
        if (insertError) throw insertError;
        
        console.log(`Migrated ${messagesToInsert.length} messages for conversation ${conversationId}`);
      }
    }
    
    console.log(`Migrated ${conversationsData.length} conversations successfully`);
  } catch (error) {
    console.error('Conversation migration failed:', error);
    throw error;
  }
}

async function migrateCharacterInteractions() {
  try {
    console.log('Migrating character interactions...');
    
    // Read character interactions from JSON file (example path - adjust as needed)
    const interactionsFilePath = path.join(__dirname, '../data/characterInteractions.json');
    
    if (!fs.existsSync(interactionsFilePath)) {
      console.log('No character interactions file found, skipping migration');
      return;
    }
    
    const interactionsData = JSON.parse(fs.readFileSync(interactionsFilePath, 'utf8'));
    
    // For each interaction
    for (const interaction of interactionsData) {
      // Check if interaction already exists
      const { data: existingInteraction } = await supabase
        .from('user_characters')
        .select('id')
        .eq('user_id', interaction.userId)
        .eq('character_id', interaction.characterId)
        .single();
      
      if (existingInteraction) {
        console.log(`Interaction between user ${interaction.userId} and character ${interaction.characterId} already exists, updating...`);
        
        // Update existing interaction
        const { error } = await supabase
          .from('user_characters')
          .update({
            is_favorite: interaction.isFavorite || false,
            last_interaction: interaction.lastInteraction ? new Date(interaction.lastInteraction).toISOString() : null,
            interaction_count: interaction.interactionCount || 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingInteraction.id);
        
        if (error) throw error;
      } else {
        console.log(`Creating new interaction for user ${interaction.userId} and character ${interaction.characterId}...`);
        
        // Create new interaction
        const { error } = await supabase
          .from('user_characters')
          .insert({
            user_id: interaction.userId,
            character_id: interaction.characterId,
            is_favorite: interaction.isFavorite || false,
            last_interaction: interaction.lastInteraction ? new Date(interaction.lastInteraction).toISOString() : null,
            interaction_count: interaction.interactionCount || 1,
          });
        
        if (error) throw error;
      }
    }
    
    console.log(`Migrated ${interactionsData.length} character interactions successfully`);
  } catch (error) {
    console.error('Character interaction migration failed:', error);
    throw error;
  }
}

// Run the migration
migrateToSupabase(); 