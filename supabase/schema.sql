-- Create enum for simplified character types
CREATE TYPE character_type AS ENUM (
  'life_coach',
  'creative_buddy', 
  'study_partner',
  'career_helper',
  'wellness_guide',
  'problem_solver',
  'social_coach',
  'knowledge_expert',
  'fun_companion',
  'custom_friend'
);

-- Update characters table with new type
ALTER TABLE characters 
ALTER COLUMN type TYPE character_type USING type::character_type;