-- Enum for character types
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

-- Characters Table (Added Definition)
CREATE TABLE IF NOT EXISTS characters (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type character_type, -- Use the enum type
  image_url TEXT, -- Example column for character image
  greeting TEXT, -- Example column for initial greeting
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  bio TEXT,
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  character_id BIGINT REFERENCES characters(id) ON DELETE CASCADE NOT NULL, -- Foreign key to characters
  content TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for profiles table
DROP TRIGGER IF EXISTS handle_profile_update ON profiles;
CREATE TRIGGER handle_profile_update
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Indexes for faster querying
CREATE INDEX IF NOT EXISTS messages_user_id_character_id_idx ON messages (user_id, character_id, created_at DESC);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles (email);
CREATE INDEX IF NOT EXISTS characters_type_idx ON characters (type); -- Example index

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Profiles
DROP POLICY IF EXISTS "Allow authenticated users to select own profile" ON profiles;
CREATE POLICY "Allow authenticated users to select own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow authenticated users to insert own profile" ON profiles;
CREATE POLICY "Allow authenticated users to insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow authenticated users to update own profile" ON profiles;
CREATE POLICY "Allow authenticated users to update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- RLS Policies for Messages
DROP POLICY IF EXISTS "Allow authenticated users to select own messages" ON messages;
CREATE POLICY "Allow authenticated users to select own messages"
ON messages FOR SELECT
USING (auth.uid() = messages.user_id);

DROP POLICY IF EXISTS "Allow authenticated users to insert own messages" ON messages;
CREATE POLICY "Allow authenticated users to insert own messages"
ON messages FOR INSERT
WITH CHECK (auth.uid() = messages.user_id);

-- RLS Policies for Characters
DROP POLICY IF EXISTS "Allow authenticated users to select characters" ON characters;
CREATE POLICY "Allow authenticated users to select characters"
ON characters FOR SELECT
USING (auth.role() = 'authenticated');

-- Ensure Supabase Realtime is enabled for the messages table (Manual step in Dashboard)
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Function to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();