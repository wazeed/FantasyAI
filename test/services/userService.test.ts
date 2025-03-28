import { TestDb, TestAuth, TestSetup } from '../utils/testUtils';
import { getUserProfile, createUserProfile, updateUserProfile } from '../../services/userService';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '../../types/database';

describe('UserService', () => {
  beforeAll(async () => {
    await TestSetup.setup();
  });

  afterAll(async () => {
    await TestSetup.teardown();
  });

  afterEach(async () => {
    await TestDb.cleanDatabase();
  });

  describe('getUserProfile', () => {
    it('should return null for non-existent user', async () => {
      const profile = await getUserProfile('non-existent-id');
      expect(profile).toBeNull();
    });

    it('should return user profile for existing user', async () => {
      const testUser = await TestDb.createTestUser();
      const profile = await getUserProfile(testUser.id);
      
      expect(profile).not.toBeNull();
      expect(profile?.id).toBe(testUser.id);
      expect(profile?.email).toBe(testUser.email);
    });
  });

  describe('createUserProfile', () => {
    it('should create new user profile', async () => {
      const { user } = await TestAuth.createTestSession();
      const profile = await createUserProfile(user as User);
      
      expect(profile).not.toBeNull();
      expect(profile?.id).toBe(user.id);
      expect(profile?.email).toBe(user.email);
    });

    it('should return existing profile if already exists', async () => {
      const testUser = await TestDb.createTestUser();
      const profile = await createUserProfile({ 
        id: testUser.id, 
        email: testUser.email 
      } as User);
      
      expect(profile?.id).toBe(testUser.id);
      expect(profile?.email).toBe(testUser.email);
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile fields', async () => {
      const testUser = await TestDb.createTestUser();
      const updates: Partial<UserProfile> = {
        display_name: 'Updated Name',
        bio: 'Updated bio'
      };

      const updated = await updateUserProfile(testUser.id, updates);
      
      expect(updated).not.toBeNull();
      expect(updated?.display_name).toBe(updates.display_name);
      expect(updated?.bio).toBe(updates.bio);
    });

    it('should return null for non-existent user', async () => {
      const updated = await updateUserProfile('non-existent-id', {
        display_name: 'Test'
      });
      
      expect(updated).toBeNull();
    });
  });
});