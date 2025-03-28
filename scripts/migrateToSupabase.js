const { supabase } = require('./supabaseClient');

async function migrateSchema() {
  try {
    // Check if tables exist and create if needed
    await createTables();
    
    // Enable RLS and create policies
    await enableRLS();
    
    // Create indexes
    await createIndexes();
    
    // Add constraints
    await addConstraints();
    
    console.log('Database migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

async function createTables() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT auth.uid(),
      email TEXT NOT NULL UNIQUE,
      username TEXT,
      avatar_url TEXT,
      display_name TEXT,
      bio TEXT,
      preferences JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    
    `CREATE TABLE IF NOT EXISTS characters (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      avatar_url TEXT,
      personality JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    
    `CREATE TABLE IF NOT EXISTS conversations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL,
      character_id UUID NOT NULL,
      title TEXT NOT NULL,
      is_favorite BOOLEAN DEFAULT false,
      character_data JSONB, 
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    
    `CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      conversation_id UUID NOT NULL,
      role TEXT NOT NULL,
      sender_type TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    
    `CREATE TABLE IF NOT EXISTS user_characters (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL,
      character_id UUID NOT NULL,
      is_favorite BOOLEAN DEFAULT false,
      last_interaction TIMESTAMP WITH TIME ZONE,
      interaction_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`
  ];

  for (const query of tables) {
    const { error } = await supabase.rpc('sql', { query });
    if (error) throw error;
  }
}

async function enableRLS() {
  const rlsTables = ['users', 'conversations', 'messages', 'user_characters'];
  
  for (const table of rlsTables) {
    const { error } = await supabase.rpc('sql', { 
      query: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY` 
    });
    if (error) throw error;
  }
  
  // Add RLS policies from schema.sql
  const policies = [
    // Users table policies
    `CREATE POLICY "Users can read own profile" ON users FOR SELECT USING (auth.uid() = id)`,
    `CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id)`,
    `CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id)`,
    
    // Conversations table policies
    `CREATE POLICY "Users can read own conversations" ON conversations FOR SELECT USING (auth.uid() = user_id)`,
    `CREATE POLICY "Users can insert own conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = user_id)`,
    `CREATE POLICY "Users can update own conversations" ON conversations FOR UPDATE USING (auth.uid() = user_id)`,
    `CREATE POLICY "Users can delete own conversations" ON conversations FOR DELETE USING (auth.uid() = user_id)`,
    
    // Messages table policies
    `CREATE POLICY "Users can read messages from own conversations" ON messages FOR SELECT USING (
      EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND conversations.user_id = auth.uid())
    )`,
    `CREATE POLICY "Users can insert messages to own conversations" ON messages FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM conversations WHERE conversations.id = conversation_id AND conversations.user_id = auth.uid())
    )`,
    `CREATE POLICY "Users can delete messages from own conversations" ON messages FOR DELETE USING (
      EXISTS (SELECT 1 FROM conversations WHERE conversations.id = conversation_id AND conversations.user_id = auth.uid())
    )`,
    
    // User characters table policies
    `CREATE POLICY "Users can read own character relationships" ON user_characters FOR SELECT USING (auth.uid() = user_id)`,
    `CREATE POLICY "Users can insert own character relationships" ON user_characters FOR INSERT WITH CHECK (auth.uid() = user_id)`,
    `CREATE POLICY "Users can update own character relationships" ON user_characters FOR UPDATE USING (auth.uid() = user_id)`,
    `CREATE POLICY "Users can delete own character relationships" ON user_characters FOR DELETE USING (auth.uid() = user_id)`
  ];

  for (const policy of policies) {
    const { error } = await supabase.rpc('sql', { query: policy });
    if (error) throw error;
  }
}

async function createIndexes() {
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC)',
    'CREATE INDEX IF NOT EXISTS idx_user_characters_last_interaction ON user_characters(last_interaction DESC)',
    'CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at)',
    'CREATE INDEX IF NOT EXISTS idx_user_characters_user_favorite ON user_characters(user_id, is_favorite)'
  ];

  for (const index of indexes) {
    const { error } = await supabase.rpc('sql', { query: index });
    if (error) throw error;
  }
}

async function addConstraints() {
  const constraints = [
    'ALTER TABLE users ADD CONSTRAINT valid_email CHECK (email ~* \'^[A-Za-z0.9._%+-]+@[A-Za-z0.9.-]+\\.[A-Za-z]{2,}$\')',
    'ALTER TABLE conversations ALTER COLUMN user_id SET NOT NULL, ALTER COLUMN character_id SET NOT NULL',
    'ALTER TABLE messages ALTER COLUMN conversation_id SET NOT NULL, ALTER COLUMN content SET NOT NULL, ALTER COLUMN sender_type SET NOT NULL',
    'ALTER TABLE user_characters ALTER COLUMN user_id SET NOT NULL, ALTER COLUMN character_id SET NOT NULL',
    'ALTER TABLE messages DROP CONSTRAINT IF EXISTS fk_conversation, ADD CONSTRAINT fk_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE',
    'ALTER TABLE user_characters DROP CONSTRAINT IF EXISTS fk_user, ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE'
  ];

  for (const constraint of constraints) {
    const { error } = await supabase.rpc('sql', { query: constraint });
    if (error) throw error;
  }
}

migrateSchema();