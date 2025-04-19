import { Tables } from './database';
import { ImageSourcePropType } from 'react-native';

// Base database character type
export type DatabaseCharacter = Tables<'characters'>;

// Extended character type with OpenRouter-specific fields
export interface ExtendedCharacter extends DatabaseCharacter {
  // OpenRouter API fields
  model?: string;
  system_prompt?: string;
  
  // UI-specific fields (used in various screens)
  avatar?: ImageSourcePropType | string;
  tags?: string[];
  category?: string;
  openingMessage?: string;
  exampleQuestions?: string[];
  suggestedQuestions?: string[];
}

// Type used specifically in the chat screen
export interface ChatCharacter {
  id: number;
  name: string;
  description?: string;
  avatar: ImageSourcePropType | string;
  tags?: string[];
  category?: string;
  openingMessage?: string;
  exampleQuestions?: string[];
  suggestedQuestions?: string[];
  greeting?: string;
  image_url?: string;
  model?: string;
  system_prompt?: string;
}
