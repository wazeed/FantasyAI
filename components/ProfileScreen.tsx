import React, { useState, useContext, useEffect } from 'react';
// Use RootStackParamList for navigation and ProfileTabScreenProps for component props
import { ProfileTabScreenProps } from '../types/screens';
import { RootStackParamList } from '../types/navigation';
// Import the Profile type from database types
import { Profile } from '../types/database';
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

// Corrected SettingItem to use RootStackParamList keys for screen
interface SettingItem {
  title: string;
  icon: string;
  screen?: keyof RootStackParamList; // Use keys from RootStackParamList
  toggle?: boolean;
  action?: string;
}

interface SettingsCategory {
  title: string;
  items: SettingItem[]; // Use the updated SettingItem interface
}

// Ensure screen names match keys in RootStackParamList and items match SettingItem
const SETTINGS_CATEGORIES: SettingsCategory[] = [
  {
    title: 'Help & Support',
    // Ensure items conform to SettingItem interface
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
    // Ensure items conform to SettingItem interface
    items: [
      { title: 'Dark Mode', icon: 'moon-outline', toggle: true, action: 'toggleTheme' }
    ]
  }
];

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
  // Use Partial<Profile> for state, initialize with null/defaults
  const [profileData, setProfileData] = useState<Partial<Profile>>({
    name: null,
    bio: null,
    email: user?.email || '', // Get email from auth user
  });
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  // Initialize edit states from profileData after loading
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newBio, setNewBio] = useState('');
  // Use useNavigation hook correctly for typed navigation
  const nav = useNavigation<ProfileTabScreenProps['navigation']>(); // Get typed navigation prop

  useEffect(() => {
    const loadProfileData = async () => {
      setIsLoading(true);
      try {
        if (isGuest) {
          // Load guest profile from AsyncStorage (adjust structure if needed)
          const guestProfileString = await AsyncStorage.getItem('guestProfile');
          if (guestProfileString) {
            const guestProfile = JSON.parse(guestProfileString);
             setProfileData({
               name: guestProfile.name || null, // Use 'name'
               bio: guestProfile.bio || null,
               email: 'guest@example.com' // Placeholder for guest
             });
             setNewDisplayName(guestProfile.name || '');
             setNewBio(guestProfile.bio || '');
          } else {
             // Set default guest state
             setProfileData({ name: 'Guest User', bio: '', email: 'guest@example.com' });
             setNewDisplayName('Guest User');
             setNewBio('');
          }
        } else if (user?.id) {
          // Load authenticated user profile from Supabase 'profiles' table
          const { data, error } = await supabase
            .from('profiles') // Correct table name
            .select('name, bio, email') // Select specific columns
            .eq('id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') { // Ignore 'No rows found' error, handle as new profile
             console.error('Supabase fetch error:', error);
             throw error;
           }

          if (data) {
            setProfileData({
              id: user.id, // Store id if needed
              name: data.name || null,
              bio: data.bio || null,
              email: data.email || user.email || '', // Use profile email or auth email
            });
            // Initialize edit states
            setNewDisplayName(data.name || '');
            setNewBio(data.bio || '');
          } else {
             // Handle case where profile row doesn't exist yet but user is authenticated
             // Attempt to insert a new profile row if it doesn't exist
             const { error: insertError } = await supabase
               .from('profiles')
               .insert({ id: user.id, email: user.email || '', name: null, bio: null });

             if (insertError) {
               console.error('Error inserting initial profile:', insertError);
               // Handle error appropriately, maybe show a message to the user
             } else {
                setProfileData({ id: user.id, name: null, bio: null, email: user.email || '' });
                setNewDisplayName('');
                setNewBio('');
             }
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
  }, [user?.id, isGuest, user?.email]); // Added user.email dependency

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

  // Update function signature to use keyof RootStackParamList
  const navigateToScreen = (screenName: keyof RootStackParamList) => {
    // Use the correctly typed navigation prop
    nav.navigate(screenName as any); // Use 'as any' or refine types if RootStack is not directly navigable from ProfileTab
  };

  const handleEditDisplayNameClick = () => {
    // Ensure profileData.name is not null before setting
    setNewDisplayName(profileData.name || '');
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
        const currentGuestProfile = profileData; // Get current state
        await AsyncStorage.setItem('guestProfile', JSON.stringify({
          ...currentGuestProfile, // Spread existing guest data
          name: newDisplayName // Update name
        }));
      } else {
        // Save to Supabase 'profiles' table for authenticated users
        if (!user?.id) {
          throw new Error('User not authenticated');
        }
        const { error } = await supabase
          .from('profiles') // Correct table name
          .update({
            name: newDisplayName, // Correct column name
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) throw error;
      }

      // Update local state
      setProfileData(prevData => ({
        ...prevData,
        name: newDisplayName // Update name field
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
    // Reset from potentially loaded profile data
    setNewDisplayName(profileData.name || '');
  };

  const handleEditBioClick = () => {
    // Ensure profileData.bio is not null before setting
    setNewBio(profileData.bio || '');
    setIsEditingBio(true);
  };

  const handleSaveBio = async () => {
    setIsSaving(true);
    try {
      if (isGuestUser()) {
        // Save to AsyncStorage for guest users
        const currentGuestProfile = profileData; // Get current state
        await AsyncStorage.setItem('guestProfile', JSON.stringify({
          ...currentGuestProfile, // Spread existing guest data
          bio: newBio // Update bio
        }));
      } else if (user?.id) {
        // Save to Supabase 'profiles' table for authenticated users
        const { error } = await supabase
          .from('profiles') // Correct table name
          .update({
            bio: newBio, // Correct column name
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) throw error;
      }

      // Update local state
      setProfileData(prevData => ({
        ...prevData,
        bio: newBio // Update bio field
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
    // Reset from potentially loaded profile data
    setNewBio(profileData.bio || '');
  };

  // Corrected handleActionPress signature and usage
  const handleActionPress = (action?: string, screen?: keyof RootStackParamList) => {
    if (action === 'toggleTheme') {
      toggleTheme();
    } else if (screen) {
      navigateToScreen(screen);
    }
  };

  // Removed renderInterestItem and renderAchievementItem as they are not used

  const renderSettingItem = (item: SettingItem) => {
    const isToggle = item.toggle;

    return (
      <TouchableOpacity
        key={item.title}
        style={[styles.settingItem, { borderBottomColor: colors.border }]}
        // Pass item.screen directly which is now keyof RootStackParamList | undefined
        onPress={() => handleActionPress(item.action, item.screen)}
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
  };

  const renderSettingsCategory = (category: SettingsCategory, index: number) => (
    <View key={index} style={[styles.settingsCategoryContainer, index !== 0 && { marginTop: 24 }]}>
      <View style={[styles.settingsCategoryHeader, { backgroundColor: colors.card }]}>
        <Text style={[styles.settingsCategoryTitle, { color: colors.text }]}>{category.title}</Text>
      </View>
      <View style={[styles.settingsList, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Map should infer item type correctly now */}
        {category.items.map((item) => renderSettingItem(item))}
      </View>
    </View>
  );

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
                value={newDisplayName} // Use state variable
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
                {/* Display name from state */}
                {profileData.name || 'Set Display Name'}
              </Text>
              <TouchableOpacity onPress={handleEditDisplayNameClick} style={[styles.editIcon, {marginLeft: 8}]}>
                <Ionicons name="pencil-outline" size={18} color={colors.subText} />
              </TouchableOpacity>
            </View>
          )}


          {isEditingBio ? (
            <View style={styles.editBioContainer}>
              <TextInput
                style={[styles.bioInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.lightBackground }]}
                value={newBio} // Use state variable
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
                {/* Display bio from state */}
                {profileData.bio || 'No bio set.'}
              </Text>
              <TouchableOpacity onPress={handleEditBioClick} style={styles.editIcon}>
                <Ionicons name="pencil-outline" size={18} color={colors.subText} />
              </TouchableOpacity>
            </View>
          )}

          {/* Display Email (Non-editable) */}
          <View style={styles.emailContainer}>
             <Ionicons name="mail-outline" size={18} color={colors.subText} style={styles.emailIcon} />
             <Text style={[styles.emailText, { color: colors.subText }]}>
               {profileData.email}
             </Text>
          </View>

        </View>

        {/* Settings */}
        <View style={[styles.settingsContainer /* Removed background color here, applied in renderSettingsCategory */]}>
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
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4F46E5', // Accent color
    padding: 6,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FFFFFF', // White border
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
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  editUsernameButton: {
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  usernameDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  displayName: {
    fontSize: 22,
    fontWeight: '700',
  },
  editBioContainer: {
    width: '100%',
    marginTop: 8,
  },
  bioInput: {
    width: '100%',
    minHeight: 80, // Adjust height as needed
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 10, // Add padding top for multiline
    fontSize: 14,
    textAlignVertical: 'top', // Align text to top for multiline
    marginBottom: 8,
  },
  bioButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Align buttons to the right
    alignItems: 'center',
    marginTop: 8, // Spacing for bio edit buttons
  },
  editBioButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40, // Ensure buttons have some width
  },
  bioDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Align edit icon to top
    marginTop: 8,
    width: '100%',
  },
  bio: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1, // Allow text to wrap
    marginRight: 8, // Space before edit icon
    textAlign: 'center', // Center bio text
  },
  editIcon: {
    padding: 4, // Make icon easier to tap
  },
  emailContainer: { // Added style
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    width: '100%',
    justifyContent: 'center',
  },
  emailIcon: { // Added style
    marginRight: 6,
  },
  emailText: { // Added style
    fontSize: 14,
  },
  settingsContainer: {
    marginTop: 16,
    // Removed background color, applied in renderSettingsCategory
    // Removed shadow styles, applied to individual category containers if needed
  },
  settingsCategoryContainer: {
    marginBottom: 0, // Remove bottom margin if categories are contiguous
    borderRadius: 16, // Apply border radius here
    overflow: 'hidden', // Clip children
    // Add shadow here if desired per category
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingsCategoryHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    // Removed background color, inherited from parent or set individually
    borderTopLeftRadius: 16, // Match parent container
    borderTopRightRadius: 16,
    borderBottomWidth: 1, // Separator line
    // borderBottomColor set by theme
  },
  settingsCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingsList: {
    // Removed background color, inherited
    borderBottomLeftRadius: 16, // Match parent container
    borderBottomRightRadius: 16,
    // Removed border color, set by theme
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    // borderBottomColor set by theme
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 16,
    width: 24, // Ensure consistent icon alignment
    textAlign: 'center',
  },
  settingText: {
    fontSize: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 24, // Space above sign out
  },
  signOutIcon: {
    marginRight: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  versionText: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 12,
  },
  // Removed unused styles: interestItem, interestText, achievementItem, achievementIcon, etc.
});
