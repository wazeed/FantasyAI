// Simplified character types
export type CharacterType = 
  | 'life_coach'
  | 'creative_buddy'
  | 'study_partner'
  | 'career_helper'
  | 'wellness_guide'
  | 'problem_solver'
  | 'social_coach'
  | 'knowledge_expert'
  | 'fun_companion'
  | 'custom_friend';

// Personality data structure
export interface PersonalityData {
  traits: string[];
  background: string;
  speaking_style: string;
  interests: string[];
  [key: string]: any;
}

// Character interface
export interface Character {
  id: string;
  name: string;
  type: CharacterType;
  description: string;
  avatar_url: string;
  personality: PersonalityData;
  created_at: string; // Keep one
  // created_at: string; // Remove duplicate
  updated_at: string;
}

// Basic JSON type (can be refined if needed)
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// Message interface
export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'character';
  role: 'user' | 'assistant' | 'character'; // Allow 'character' role explicitly or map later
  content: string;
  metadata?: Json | null;
  created_at: string;
  // No duplicate created_at here
}

// Conversation interface (updated)
export interface Conversation {
  id: string;
  user_id: string;
  character_id: string;
  title: string;
  is_favorite: boolean;
  character_data?: Json | null;
  last_message_preview?: string | null;
  last_interaction_at: string | null; // Allow null for new conversations
  created_at: string;
  updated_at: string;
}