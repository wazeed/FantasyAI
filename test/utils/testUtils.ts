import { supabase } from '../../utils/supabase';
import { Database, UserProfile, Character, Conversation } from '../../types/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Test database utilities
 */
export class TestDb {
  /**
   * Clean all test data from tables
   */
  static async cleanDatabase(): Promise<void> {
    const tables = ['messages', 'conversations', 'user_characters', 'characters', 'users'];
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .filter('id', 'like', 'test-%');
      
      if (error) {
        console.error(`Error cleaning ${table}:`, error);
      }
    }
  }

  /**
   * Create a test user
   */
  static async createTestUser(override: Partial<UserProfile> = {}): Promise<UserProfile> {
    const testUser: Omit<UserProfile, 'created_at' | 'updated_at'> = {
      id: `test-${uuidv4()}`,
      email: `test-${uuidv4()}@example.com`,
      username: `testuser-${uuidv4()}`,
      ...override
    };

    const { data, error } = await supabase
      .from('users')
      .insert(testUser)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create a test character
   */
  static async createTestCharacter(override: Partial<Character> = {}): Promise<Character> {
    const testCharacter = {
      id: `test-${uuidv4()}`,
      name: `Test Character ${uuidv4()}`,
      type: 'fantasy' as const,
      description: 'Test character description',
      avatar_url: 'https://example.com/avatar.png',
      personality: {
        traits: ['friendly', 'helpful'],
        background: 'Test background',
        speaking_style: 'Formal',
        interests: ['testing']
      },
      ...override
    };

    const { data, error } = await supabase
      .from('characters')
      .insert(testCharacter)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create a test conversation
   */
  static async createTestConversation(
    userId: string,
    characterId: string,
    override: Partial<Conversation> = {}
  ): Promise<Conversation> {
    const testConversation = {
      id: `test-${uuidv4()}`,
      user_id: userId,
      character_id: characterId,
      title: 'Test Conversation',
      is_favorite: false,
      character_data: {},
      ...override
    };

    const { data, error } = await supabase
      .from('conversations')
      .insert(testConversation)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

/**
 * Test auth utilities
 */
export class TestAuth {
  /**
   * Create a test auth session
   */
  static async createTestSession(): Promise<{
    user: { id: string; email: string };
    session: { access_token: string };
  }> {
    const email = `test-${uuidv4()}@example.com`;
    const password = 'testpassword123';

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) throw error;
    if (!data.user || !data.session) {
      throw new Error('Failed to create test session');
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email!
      },
      session: {
        access_token: data.session.access_token
      }
    };
  }

  /**
   * Clean up test auth data
   */
  static async cleanAuth(): Promise<void> {
    // Note: This requires admin access to auth.users table
    const { error } = await supabase.rpc('delete_test_users');
    if (error) {
      console.error('Error cleaning auth data:', error);
    }
  }
}

/**
 * Test monitoring utilities
 */
export class TestMonitoring {
  private static metrics: any[] = [];

  /**
   * Record test metric
   */
  static recordMetric(metric: any): void {
    this.metrics.push({
      ...metric,
      timestamp: Date.now()
    });
  }

  /**
   * Get recorded metrics
   */
  static getMetrics(): any[] {
    return [...this.metrics];
  }

  /**
   * Clear recorded metrics
   */
  static clearMetrics(): void {
    this.metrics = [];
  }
}

/**
 * Common test setup and teardown
 */
export class TestSetup {
  /**
   * Setup test environment
   */
  static async setup(): Promise<void> {
    // Clear existing test data
    await TestDb.cleanDatabase();
    await TestAuth.cleanAuth();
    TestMonitoring.clearMetrics();
  }

  /**
   * Teardown test environment
   */
  static async teardown(): Promise<void> {
    // Clean up test data
    await TestDb.cleanDatabase();
    await TestAuth.cleanAuth();
    TestMonitoring.clearMetrics();
  }
}

/**
 * Test data generators
 */
export class TestData {
  /**
   * Generate random test data
   */
  static generateTestData(): Record<string, any> {
    return {
      string: `test-${uuidv4()}`,
      number: Math.floor(Math.random() * 1000),
      boolean: Math.random() > 0.5,
      array: Array.from({ length: 3 }, (_, i) => `item-${i}`),
      object: {
        key1: 'value1',
        key2: 'value2'
      }
    };
  }
}