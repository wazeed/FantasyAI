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
  created_at: string;
  updated_at: string;
}