import React, { useState, useContext, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { ProfileTabScreenProps } from '../types/screens';
import { RootStackParamList } from '../types/navigation';
import { Tables } from '../types/database'; // Import the Tables helper
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';

// --- Types ---

interface SettingItemType {
  title: string;
  icon: string;
  screen?: keyof RootStackParamList;
  toggle?: boolean;
  action?: string;
}

interface SettingsCategoryType {
  title: string;
  items: SettingItemType[];
}

type ProfileDataType = Partial<Tables<'profiles'>>; // Define type alias for profile data state

// --- Constants ---

const SETTINGS_CATEGORIES: SettingsCategoryType[] = [
  {
    title: 'Help & Support',
    items: [
      { title: 'Help Center', icon: 'help-circle-outline', screen: 'HelpCenter' },
      { title: 'Report a Problem', icon: 'bug-outline', screen: 'ReportProblem' },
      { title: 'Contact Us', icon: 'mail-outline', screen: 'ContactUs' },
      { title: 'Terms & Conditions', icon: 'document-text-outline', screen: 'TermsAndConditions' },
      { title: 'Privacy Policy', icon: 'shield-outline', screen: 'PrivacyPolicy' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { title: 'Dark Mode', icon: 'moon-outline', toggle: true, action: 'toggleTheme' },
    ],
  },
];

const DEFAULT_PROFILE_PLACEHOLDER = require('../assets/profile-placeholder.png');

// --- Helper Functions ---

// Function to determine dynamic colors based on theme
const getDynamicColors = (isDarkMode: boolean) => ({
  background: isDarkMode ? '#121212' : '#FFFFFF',
  text: isDarkMode ? '#FFFFFF' : '#000000',
  subText: isDarkMode ? '#AAAAAA' : '#666666',
  card: isDarkMode ? '#1E1E1E' : '#FFFFFF',
  border: isDarkMode ? '#333333' : '#F0F0F0',
  primary: isDarkMode ? '#3D8CFF' : '#000000', // Consider a consistent primary color if needed
  lightBackground: isDarkMode ? '#252525' : '#F0F0F0',
  accent: '#4F46E5',
  danger: isDarkMode ? '#FF5252' : '#E53935',
  buttonDisabled: isDarkMode ? '#555555' : '#CCCCCC',
});

// --- Subcomponents ---

interface ProfileHeaderProps {
  profileData: ProfileDataType; // Use the defined type alias
  isEditingDisplayName: boolean;
  isEditingBio: boolean;
  newDisplayName: string;
  newBio: string;
  isSaving: boolean;
  colors: ReturnType<typeof getDynamicColors>;
  onEditDisplayNameClick: () => void;
  onSaveDisplayName: () => void;
  onCancelDisplayNameEdit: () => void;
  onEditBioClick: () => void;
  onSaveBio: () => void;
  onCancelBioEdit: () => void;
  setNewDisplayName: (value: string) => void;
  setNewBio: (value: string) => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = memo(({
  profileData,
  isEditingDisplayName,
  isEditingBio,
  newDisplayName,
  newBio,
  isSaving,
  colors,
  onEditDisplayNameClick,
  onSaveDisplayName,
  onCancelDisplayNameEdit,
  onEditBioClick,
  onSaveBio,
  onCancelBioEdit,
  setNewDisplayName,
  setNewBio,
}) => {
  return (
    <View style={[styles.profileHeader, { backgroundColor: colors.card }]}>
      <View style={styles.profileImageContainer}>
        <Image
          source={DEFAULT_PROFILE_PLACEHOLDER} // Use constant
          style={styles.profileImage}
        />
        {/* TODO: Implement image editing functionality */}
        <TouchableOpacity style={styles.editImageButton} disabled>
          <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Display Name Section */}
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
            onPress={onSaveDisplayName}
            disabled={isSaving}
            style={[
              styles.editActionButton,
              { backgroundColor: isSaving ? colors.buttonDisabled : colors.accent }
            ]}
          >
            {isSaving ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Ionicons name="checkmark-outline" size={20} color="#FFFFFF" />}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onCancelDisplayNameEdit}
            disabled={isSaving}
            style={[
              styles.editActionButton,
              { backgroundColor: colors.subText, marginLeft: 8, opacity: isSaving ? 0.5 : 1 }
            ]}
          >
            <Ionicons name="close-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.displayContainer}>
          <Text style={[styles.displayName, { color: colors.text }]}>
            {profileData.name || 'Set Display Name'}
          </Text>
          <TouchableOpacity onPress={onEditDisplayNameClick} style={styles.editIcon}>
            <Ionicons name="pencil-outline" size={18} color={colors.subText} />
          </TouchableOpacity>
        </View>
      )}

      {/* Bio Section */}
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
              onPress={onSaveBio}
              disabled={isSaving}
              style={[
                styles.editActionButton,
                { backgroundColor: isSaving ? colors.buttonDisabled : colors.accent }
              ]}
            >
              {isSaving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="checkmark-outline" size={20} color="#FFFFFF" />}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onCancelBioEdit}
              disabled={isSaving}
              style={[
                styles.editActionButton,
                { backgroundColor: colors.subText, marginLeft: 8, opacity: isSaving ? 0.5 : 1 }
              ]}
            >
              <Ionicons name="close-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.displayContainer}>
          <Text style={[styles.bio, { color: colors.text }]}>
            {profileData.bio || 'No bio set.'}
          </Text>
          <TouchableOpacity onPress={onEditBioClick} style={styles.editIcon}>
            <Ionicons name="pencil-outline" size={18} color={colors.subText} />
          </TouchableOpacity>
        </View>
      )}

      {/* Email Display */}
      <View style={styles.emailContainer}>
        <Ionicons name="mail-outline" size={18} color={colors.subText} style={styles.emailIcon} />
        <Text style={[styles.emailText, { color: colors.subText }]}>
          {profileData.email || 'No email'}
        </Text>
      </View>
    </View>
  );
});

interface SettingsItemProps {
  item: SettingItemType;
  colors: ReturnType<typeof getDynamicColors>;
  isDarkMode: boolean;
  onPress: (action?: string, screen?: keyof RootStackParamList) => void;
}

const SettingsItem: React.FC<SettingsItemProps> = memo(({ item, colors, isDarkMode, onPress }) => {
  const isToggle = item.toggle;

  return (
    <TouchableOpacity
      style={[styles.settingItem, { borderBottomColor: colors.border }]}
      onPress={() => onPress(item.action, item.screen)}
    >
      <View style={styles.settingContent}>
        <Ionicons name={item.icon as any} size={22} color={colors.text} style={styles.settingIcon} />
        <Text style={[styles.settingText, { color: colors.text }]}>{item.title}</Text>
      </View>
      {isToggle ? (
        <Text style={{ color: colors.subText }}>{isDarkMode ? 'On' : 'Off'}</Text>
      ) : (
        <Ionicons name="chevron-forward" size={22} color={colors.subText} />
      )}
    </TouchableOpacity>
  );
});

interface SettingsSectionProps {
  category: SettingsCategoryType;
  colors: ReturnType<typeof getDynamicColors>;
  isDarkMode: boolean;
  onItemPress: (action?: string, screen?: keyof RootStackParamList) => void;
}

const SettingsSection: React.FC<SettingsSectionProps> = memo(({ category, colors, isDarkMode, onItemPress }) => (
  <View style={styles.settingsCategoryContainer}>
    <View style={[styles.settingsCategoryHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      <Text style={[styles.settingsCategoryTitle, { color: colors.text }]}>{category.title}</Text>
    </View>
    <View style={[styles.settingsList, { backgroundColor: colors.card }]}>
      {category.items.map((item) => (
        <SettingsItem
          key={item.title}
          item={item}
          colors={colors}
          isDarkMode={isDarkMode}
          onPress={onItemPress}
        />
      ))}
    </View>
  </View>
));

interface SignOutButtonProps {
  onPress: () => void;
  colors: ReturnType<typeof getDynamicColors>;
}

const SignOutButton: React.FC<SignOutButtonProps> = memo(({ onPress, colors }) => (
  <TouchableOpacity
    style={[styles.signOutButton, { backgroundColor: colors.lightBackground }]}
    onPress={onPress}
  >
    <Ionicons name="log-out-outline" size={22} color={colors.danger} style={styles.signOutIcon} />
    <Text style={[styles.signOutText, { color: colors.danger }]}>Sign Out</Text>
  </TouchableOpacity>
));


// --- Main Component ---

export const ProfileScreen: React.FC<ProfileTabScreenProps> = ({ navigation: propNavigation }) => {
  const { user, signOut: contextSignOut, isGuest } = useAuth();
  const themeContext = useContext(ThemeContext);
  const navigation = useNavigation<ProfileTabScreenProps['navigation']>(); // Use hook for consistency

  if (!themeContext) {
    throw new Error('ThemeContext must be used within a ThemeProvider');
  }
  const { isDarkMode, toggleTheme } = themeContext;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileDataType>({ // Use the defined type alias
    name: null,
    bio: null,
    email: user?.email || '',
  });
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newBio, setNewBio] = useState('');

  const colors = getDynamicColors(isDarkMode); // Calculate colors once

  // --- Data Loading Effect ---
  useEffect(() => {
    const loadProfileData = async () => {
      setIsLoading(true);
      try {
        if (isGuest) {
          const guestProfileString = await AsyncStorage.getItem('guestProfile');
          const guestProfile = guestProfileString ? JSON.parse(guestProfileString) : {};
          const name = guestProfile.name || 'Guest User';
          const bio = guestProfile.bio || '';
          setProfileData({ name, bio, email: 'guest@example.com' });
          setNewDisplayName(name);
          setNewBio(bio);
        } else if (user?.id) {
          const { data, error } = await supabase
            .from('profiles')
            .select('name, bio, email')
            .eq('id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') { // Ignore 'No rows found'
            console.error('Supabase fetch error:', error);
            throw error; // Re-throw to be caught below
          }

          if (data) {
            const name = data.name || '';
            const bio = data.bio || '';
            setProfileData({ id: user.id, name, bio, email: data.email || user.email || '' });
            setNewDisplayName(name);
            setNewBio(bio);
          } else {
            // Profile doesn't exist, attempt to create it
            console.log(`Profile not found for user ${user.id}, attempting to create.`);
            const initialEmail = user.email || '';
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({ id: user.id, email: initialEmail, name: null, bio: null });

            if (insertError) {
              console.error('Error inserting initial profile:', insertError);
              // Show error to user, maybe prevent further edits until resolved
              Alert.alert('Error', 'Could not initialize your profile. Please try again later.');
            } else {
              console.log(`Initial profile created for user ${user.id}`);
              setProfileData({ id: user.id, name: null, bio: null, email: initialEmail });
              setNewDisplayName('');
              setNewBio('');
            }
          }
        } else {
           // Should not happen if isGuest is false, but handle defensively
           console.warn("User is not guest but has no ID, cannot load profile.");
           setProfileData({ name: 'Error', bio: 'Could not load profile', email: '' });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        Alert.alert('Error', 'Failed to load profile data. Please try again.');
        // Set some default error state?
        setProfileData({ name: 'Error', bio: 'Load failed', email: '' });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [user?.id, isGuest, user?.email]); // Dependencies

  // --- Callbacks for Memoization ---

  const handleEditDisplayNameClick = useCallback(() => {
    setNewDisplayName(profileData.name || '');
    setIsEditingDisplayName(true);
  }, [profileData.name]);

  const handleCancelDisplayNameEdit = useCallback(() => {
    setIsEditingDisplayName(false);
    setNewDisplayName(profileData.name || '');
  }, [profileData.name]);

  const handleSaveDisplayName = useCallback(async () => {
    if (newDisplayName === profileData.name) {
      setIsEditingDisplayName(false); // No change, just exit edit mode
      return;
    }
    setIsSaving(true);
    try {
      if (isGuest) {
        const currentGuestProfile = profileData;
        await AsyncStorage.setItem('guestProfile', JSON.stringify({
          ...currentGuestProfile,
          name: newDisplayName,
        }));
      } else if (user?.id) {
        const { error } = await supabase
          .from('profiles')
          .update({ name: newDisplayName, updated_at: new Date().toISOString() })
          .eq('id', user.id);
        if (error) throw error;
      } else {
         throw new Error('Cannot save: User not identified.');
      }

      setProfileData((prevData: ProfileDataType) => ({ ...prevData, name: newDisplayName })); // Add type for prevData
      setIsEditingDisplayName(false);
      Alert.alert('Success', 'Display name updated.');
    } catch (error) {
      Alert.alert('Error', `Failed to update display name: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Update display name error:', error);
    } finally {
      setIsSaving(false);
    }
  }, [newDisplayName, profileData, isGuest, user?.id]);

  const handleEditBioClick = useCallback(() => {
    setNewBio(profileData.bio || '');
    setIsEditingBio(true);
  }, [profileData.bio]);

  const handleCancelBioEdit = useCallback(() => {
    setIsEditingBio(false);
    setNewBio(profileData.bio || '');
  }, [profileData.bio]);

  const handleSaveBio = useCallback(async () => {
    if (newBio === profileData.bio) {
        setIsEditingBio(false); // No change
        return;
    }
    setIsSaving(true);
    try {
      if (isGuest) {
        const currentGuestProfile = profileData;
        await AsyncStorage.setItem('guestProfile', JSON.stringify({
          ...currentGuestProfile,
          bio: newBio,
        }));
      } else if (user?.id) {
        const { error } = await supabase
          .from('profiles')
          .update({ bio: newBio, updated_at: new Date().toISOString() })
          .eq('id', user.id);
        if (error) throw error;
      } else {
         throw new Error('Cannot save: User not identified.');
      }

      setProfileData((prevData: ProfileDataType) => ({ ...prevData, bio: newBio })); // Add type for prevData
      setIsEditingBio(false);
      Alert.alert('Success', 'Bio updated.');
    } catch (error) {
      Alert.alert('Error', `Failed to update bio: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Update bio error:', error);
    } finally {
      setIsSaving(false);
    }
  }, [newBio, profileData, isGuest, user?.id]);

  const navigateToScreen = useCallback((screenName: keyof RootStackParamList) => {
    // Type assertion needed if ProfileScreen isn't directly in RootStackParamList
    // or if RootStackParamList includes screens not reachable from here.
    // Consider creating a specific ParamList for the ProfileTab if needed.
    navigation.navigate(screenName as any);
  }, [navigation]);

  const handleActionPress = useCallback((action?: string, screen?: keyof RootStackParamList) => {
    if (action === 'toggleTheme') {
      toggleTheme();
    } else if (screen) {
      navigateToScreen(screen);
    }
  }, [toggleTheme, navigateToScreen]);

  const handleSignOut = useCallback(() => {
      Alert.alert(
          "Sign Out",
          "Are you sure you want to sign out?",
          [
              { text: "Cancel", style: "cancel" },
              { text: "Sign Out", style: "destructive", onPress: contextSignOut }
          ]
      );
  }, [contextSignOut]);


  // --- Render Logic ---

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <ProfileHeader
          profileData={profileData}
          isEditingDisplayName={isEditingDisplayName}
          isEditingBio={isEditingBio}
          newDisplayName={newDisplayName}
          newBio={newBio}
          isSaving={isSaving}
          colors={colors}
          onEditDisplayNameClick={handleEditDisplayNameClick}
          onSaveDisplayName={handleSaveDisplayName}
          onCancelDisplayNameEdit={handleCancelDisplayNameEdit}
          onEditBioClick={handleEditBioClick}
          onSaveBio={handleSaveBio}
          onCancelBioEdit={handleCancelBioEdit}
          setNewDisplayName={setNewDisplayName}
          setNewBio={setNewBio}
        />

        <View style={styles.settingsContainer}>
          {SETTINGS_CATEGORIES.map((category) => (
            <SettingsSection
              key={category.title}
              category={category}
              colors={colors}
              isDarkMode={isDarkMode}
              onItemPress={handleActionPress}
            />
          ))}
        </View>

        {!isGuest && (
            <SignOutButton onPress={handleSignOut} colors={colors} />
        )}

        <Text style={[styles.versionText, { color: colors.subText }]}>
          Version 1.0.0 {/* TODO: Make version dynamic */}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};


// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  // Profile Header Styles
  profileHeader: {
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 24, // Increased margin
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
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4F46E5', // Accent color
    padding: 6,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FFFFFF', // White border - Use color from theme?
  },
  displayContainer: { // Container for text + edit icon
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center items
    marginTop: 8,
    width: '100%',
    minHeight: 30, // Ensure space even if text is short
  },
  displayName: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  bio: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    flexShrink: 1, // Allow bio to shrink if needed
    marginRight: 4, // Space before edit icon
  },
  editIcon: {
    padding: 4, // Make icon easier to tap
    marginLeft: 8,
  },
  editUsernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  usernameInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 18, // Match display name size?
    fontWeight: '600',
    marginRight: 8,
  },
  editBioContainer: {
    width: '100%',
    marginTop: 8,
  },
  bioInput: {
    width: '100%',
    minHeight: 80,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10, // Use vertical padding
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  bioButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    // marginTop: 8, // Removed, handled by bioInput marginBottom
  },
  editActionButton: { // Combined style for save/cancel buttons
    paddingHorizontal: 10, // Adjusted padding
    paddingVertical: 8,    // Adjusted padding
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
    minHeight: 36, // Ensure consistent height
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    justifyContent: 'center',
  },
  emailIcon: {
    marginRight: 6,
  },
  emailText: {
    fontSize: 14,
  },
  // Settings Styles
  settingsContainer: {
    // Container for all settings sections
  },
  settingsCategoryContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 16, // Space between categories
  },
  settingsCategoryHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingsCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingsList: {
    // Styles for the list wrapper within a category
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    // Last item should not have border? Handled by map index if needed
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  settingText: {
    fontSize: 16,
  },
  // Sign Out Button Styles
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 16, // Adjusted margin
  },
  signOutIcon: {
    marginRight: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Version Text Styles
  versionText: {
    marginTop: 24, // Increased margin
    textAlign: 'center',
    fontSize: 12,
  },
});
