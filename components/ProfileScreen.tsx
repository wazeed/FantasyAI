import React, { useState, useContext, useEffect } from 'react';
import { ProfileTabScreenProps } from '../types/screens';

interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
}

interface ProfileData {
  displayName: string;
  bio: string;
  location: string;
  email: string;
  phone: string;
  interests: string[];
  achievements: Achievement[];
}

interface SettingItem {
  title: string;
  icon: string;
  screen?: string;
  toggle?: boolean;
  action?: string;
}

interface SettingsCategory {
  title: string;
  items: SettingItem[];
}

const SETTINGS_CATEGORIES: SettingsCategory[] = [
  {
    title: 'Help & Support',
    items: [
      { title: 'Help Center', icon: 'help-circle-outline', screen: 'HelpCenter' },
      { title: 'Report a Problem', icon: 'bug-outline', screen: 'ReportProblem' },
      { title: 'Contact Us', icon: 'mail-outline', screen: 'ContactUs' },
      { title: 'Terms & Conditions', icon: 'document-text-outline', screen: 'TermsAndConditions' },
      { title: 'Privacy Policy', icon: 'shield-outline', screen: 'PrivacyPolicy' }
    ]
  },
  {
    title: 'Preferences',
    items: [
      { title: 'Dark Mode', icon: 'moon-outline', toggle: true, action: 'toggleTheme' }
    ]
  }
];

const PROFILE_DATA: ProfileData = {
  displayName: 'John Smith',
  bio: 'Fantasy AI enthusiast and avid storyteller. I love creating unique character interactions and exploring different narratives.',
  location: 'San Francisco, CA',
  email: 'john.smith@example.com',
  phone: '+1 (555) 123-4567',
  interests: ['AI Characters', 'Storytelling', 'Science Fiction', 'Fantasy Worlds', 'Interactive Fiction'],
  achievements: [
    {
      id: '1',
      title: 'Story Master',
      description: 'Created 50+ unique conversations',
      date: '2023-12-01'
    },
    {
      id: '2',
      title: 'Conversation Explorer',
      description: 'Talked with 20 different characters',
      date: '2023-11-15'
    },
    {
      id: '3',
      title: 'Premium Member',
      description: 'Subscribed to Fantasy AI Pro',
      date: '2023-10-30'
    }
  ]
};
import { supabase } from '../utils/supabase';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ navigation }: ProfileTabScreenProps) {
  const { user, signOut, isGuest } = useAuth();
  const themeContext = useContext(ThemeContext);
  if (!themeContext) {
    throw new Error('ThemeContext must be used within a ThemeProvider');
  }
  const { isDarkMode, toggleTheme } = themeContext;
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>(PROFILE_DATA);
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(profileData.displayName);
  const [newBio, setNewBio] = useState(profileData.bio);
  const { navigate } = useNavigation();

  useEffect(() => {
    const loadProfileData = async () => {
      setIsLoading(true);
      try {
        if (isGuest) {
          // Load guest profile from AsyncStorage
          const guestProfile = await AsyncStorage.getItem('guestProfile');
          if (guestProfile) {
            setProfileData(JSON.parse(guestProfile));
          }
        } else if (user?.id) {
          // Load authenticated user profile from Supabase
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) throw error;

          if (data) {
            setProfileData({
              displayName: data.display_name || PROFILE_DATA.displayName,
              bio: data.bio || PROFILE_DATA.bio,
              location: data.location || PROFILE_DATA.location,
              email: user.email || PROFILE_DATA.email,
              phone: data.phone || PROFILE_DATA.phone,
              interests: data.interests || PROFILE_DATA.interests,
              achievements: PROFILE_DATA.achievements
            });
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        Alert.alert('Error', 'Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [user?.id, isGuest]);

  // Dynamic colors based on theme
  const colors = {
    background: isDarkMode ? '#121212' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    subText: isDarkMode ? '#AAAAAA' : '#666666',
    card: isDarkMode ? '#1E1E1E' : '#FFFFFF',
    border: isDarkMode ? '#333333' : '#F0F0F0',
    primary: isDarkMode ? '#3D8CFF' : '#000000',
    lightBackground: isDarkMode ? '#252525' : '#F0F0F0',
    accent: '#4F46E5'
  };

  // Removed handleEditProfile function

  const navigateToScreen = (screenName: string) => { // Added type annotation
    navigation.navigate(screenName);
  };

  const handleEditDisplayNameClick = () => {
    setNewDisplayName(profileData.displayName);
    setIsEditingDisplayName(true);
  };

  const isGuestUser = () => {
    return !user?.id;
  };

  const handleSaveDisplayName = async () => {
    setIsSaving(true);
    try {
      if (isGuestUser()) {
        // Save to AsyncStorage for guest users
        await AsyncStorage.setItem('guestProfile', JSON.stringify({
          ...profileData,
          displayName: newDisplayName
        }));
      } else {
        // Save to Supabase for authenticated users
        if (!user?.id) {
          throw new Error('User not authenticated');
        }
        const { error } = await supabase
          .from('users')
          .update({
            display_name: newDisplayName,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) throw error;
      }

      setProfileData(prevData => ({
        ...prevData,
        displayName: newDisplayName
      }));
      setIsEditingDisplayName(false);
      Alert.alert('Success', 'Display name updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update display name');
      console.error('Update error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelDisplayNameEdit = () => {
    setIsEditingDisplayName(false);
    setNewDisplayName(profileData.displayName);
  };

  const handleEditBioClick = () => {
    setIsEditingBio(true);
  };

  const handleSaveBio = async () => {
    setIsSaving(true);
    try {
      if (isGuestUser()) {
        // Save to AsyncStorage for guest users
        await AsyncStorage.setItem('guestProfile', JSON.stringify({
          ...profileData,
          bio: newBio
        }));
      } else if (user?.id) {
        // Save to Supabase for authenticated users
        const { error } = await supabase
          .from('users')
          .update({
            bio: newBio,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) throw error;
      }

      setProfileData(prevData => ({
        ...prevData,
        bio: newBio
      }));
      setIsEditingBio(false);
      Alert.alert('Success', 'Bio updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update bio');
      console.error('Update error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelBioEdit = () => {
    setIsEditingBio(false);
    setNewBio(profileData.bio);
  };

  const handleActionPress = (action: string | undefined, screen: string | undefined) => { // Added types
    if (action === 'toggleTheme') {
      toggleTheme();
    } else if (screen) {
      navigateToScreen(screen);
    }
  };

  const renderInterestItem = (interest: string, index: number) => (
    <View key={index} style={[styles.interestItem, { backgroundColor: colors.lightBackground }]}>
      <Text style={[styles.interestText, { color: colors.text }]}>{interest}</Text>
    </View>
  );

  const renderAchievementItem = (achievement: Achievement) => (
    <View key={achievement.id} style={[styles.achievementItem, { backgroundColor: isDarkMode ? '#252525' : '#F9F9F9' }]}>
      <View style={styles.achievementIcon}>
        <Text style={styles.achievementIconText}>🏆</Text>
      </View>
      <View style={styles.achievementContent}>
        <Text style={[styles.achievementTitle, { color: colors.text }]}>{achievement.title}</Text>
        <Text style={[styles.achievementDescription, { color: colors.subText }]}>{achievement.description}</Text>
        <Text style={[styles.achievementDate, { color: colors.subText }]}>
          {new Date(achievement.date).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  const renderSettingItem = (item: SettingItem) => {
    const isToggle = item.toggle;
    
    return (
      <TouchableOpacity 
        key={item.title}
        style={[styles.settingItem, { borderBottomColor: colors.border }]} 
        onPress={() => handleActionPress(item.action, item.screen)}
      >
        <View style={styles.settingContent}>
          <Ionicons name={item.icon} size={22} color={colors.text} style={styles.settingIcon} />
          <Text style={[styles.settingText, { color: colors.text }]}>{item.title}</Text>
        </View>
        {isToggle ? (
          <Text style={{ color: colors.subText }}>{isDarkMode ? 'On' : 'Off'}</Text>
        ) : (
          <Ionicons name="chevron-forward" size={22} color={colors.subText} />
        )}
      </TouchableOpacity>
    );
  };

  const renderSettingsCategory = (category: SettingsCategory, index: number) => (
    <View key={index} style={[styles.settingsCategoryContainer, index !== 0 && { marginTop: 24 }]}>
      <View style={[styles.settingsCategoryHeader, { backgroundColor: colors.card }]}>
        <Text style={[styles.settingsCategoryTitle, { color: colors.text }]}>{category.title}</Text>
      </View>
      <View style={[styles.settingsList, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {category.items.map((item: SettingItem) => renderSettingItem(item))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: colors.card }]}>
          <View style={styles.profileImageContainer}>
            <Image 
              source={require('../assets/profile-placeholder.png')} 
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.editImageButton}>
              <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {isEditingDisplayName ? (
            <View style={styles.editUsernameContainer}>
              <TextInput
                style={[styles.usernameInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.lightBackground }]}
                value={newDisplayName}
                onChangeText={setNewDisplayName}
                autoCapitalize="words"
                placeholder="Enter display name"
                placeholderTextColor={colors.subText}
              />
              <TouchableOpacity
                onPress={handleSaveDisplayName}
                disabled={isSaving}
                style={[
                  styles.editUsernameButton,
                  { backgroundColor: isSaving ? colors.subText : colors.accent }
                ]}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Ionicons name="checkmark-outline" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCancelDisplayNameEdit}
                disabled={isSaving}
                style={[
                  styles.editUsernameButton,
                  {
                    backgroundColor: colors.subText,
                    marginLeft: 8,
                    opacity: isSaving ? 0.5 : 1
                  }
                ]}
              >
                <Ionicons name="close-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.usernameDisplayContainer, {flexDirection: 'row', alignItems: 'center'}]}>
              <Text style={[styles.displayName, { color: colors.text }]}>
                {profileData.displayName}
              </Text>
              <TouchableOpacity onPress={handleEditDisplayNameClick} style={[styles.editIcon, {marginLeft: 8}]}>
                <Ionicons name="create-outline" size={18} color={colors.subText} />
              </TouchableOpacity>
            </View>
          )}
          
          
          {isEditingBio ? (
            <View style={styles.editBioContainer}>
              <TextInput
                style={[styles.bioInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.lightBackground }]}
                value={newBio}
                onChangeText={setNewBio}
                multiline
                numberOfLines={4}
                placeholder="Tell us about yourself"
                placeholderTextColor={colors.subText}
              />
              <View style={styles.bioButtonContainer}>
                <TouchableOpacity
                  onPress={handleSaveBio}
                  disabled={isSaving}
                  style={[
                    styles.editBioButton,
                    { backgroundColor: isSaving ? colors.subText : colors.accent }
                  ]}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="checkmark-outline" size={20} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCancelBioEdit} style={[styles.editBioButton, { backgroundColor: colors.subText, marginLeft: 8 }]}>
                  <Ionicons name="close-outline" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.bioDisplayContainer}>
              <Text style={[styles.bio, { color: colors.text }]}>
                {profileData.bio || 'Tell us about yourself'}
              </Text>
              <TouchableOpacity onPress={handleEditBioClick} style={styles.editIcon}>
                <Ionicons name="create-outline" size={18} color={colors.subText} />
              </TouchableOpacity>
            </View>
          )}
          
          {/* Removed Edit Profile Button */}
          
        </View>
        
        {/* Removed Achievements section */}
        
        {/* Settings */}
        <View style={[styles.settingsContainer, { backgroundColor: colors.card }]}>
          {SETTINGS_CATEGORIES.map((category, index) => renderSettingsCategory(category, index))}
        </View>
        
        {/* Sign Out Button */}
        <TouchableOpacity
          style={[styles.signOutButton, { backgroundColor: isDarkMode ? '#2A2A2A' : '#F5F5F5' }]}
          onPress={signOut}
        >
          <Ionicons name="log-out-outline" size={22} color={isDarkMode ? '#FF5252' : '#E53935'} style={styles.signOutIcon} />
          <Text style={[styles.signOutText, { color: isDarkMode ? '#FF5252' : '#E53935' }]}>Sign Out</Text>
        </TouchableOpacity>
        
        <Text style={[styles.versionText, { color: colors.subText }]}>
          Version 1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  profileHeader: {
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#4F46E5',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4F46E5',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    marginBottom: 12,
  },
  bio: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
  },
  editButtonIcon: {
    marginRight: 6,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  infoCard: {
    padding: 16,
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 15,
    lineHeight: 22,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    fontSize: 14,
    fontWeight: '500',
  },
  achievementsContainer: {
    marginTop: 8,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  achievementIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  achievementIconText: {
    fontSize: 22,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  achievementDate: {
    fontSize: 12,
  },
  settingsContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsCategoryContainer: {
    marginBottom: 8,
  },
  settingsCategoryHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingsCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingsList: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    fontSize: 15,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 24,
    marginTop: 8,
    marginBottom: 16,
  },
  signOutIcon: {
    marginRight: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Username editing styles
  usernameSection: {
    marginBottom: 16,
    width: '100%',
  },
  editUsernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  usernameInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginRight: 8,
  },
  editUsernameButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  usernameDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIcon: {
    marginLeft: 8,
  },
  // Bio editing styles
  editBioContainer: {
    marginTop: 12,
    width: '100%',
  },
  bioInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  bioButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  editBioButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bioDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
  },
  versionText: {
    fontSize: 14,
    textAlign: 'center',
  },
}); 
