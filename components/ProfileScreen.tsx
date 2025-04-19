import React, { useState, useEffect, useCallback } from 'react';
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
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ProfileTabScreenProps } from '../types/screens';
import { Tables } from '../types/database';
import { RootStackParamList } from '../types/navigation';

// Types
type ProfileDataType = Partial<Tables<'profiles'>>;

// Profile screen component with updated UI but preserving backend functionality
export const ProfileScreen: React.FC<ProfileTabScreenProps> = ({ navigation: propNavigation }) => {
  const { user, signOut: contextSignOut, isGuest } = useAuth();
  const { colors, styles: themeStyles, isDarkMode, toggleTheme } = useTheme();
  const navigation = useNavigation<ProfileTabScreenProps['navigation']>();
  const parentNavigation = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();

  // States
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileDataType>({
    name: null,
    bio: null,
    email: user?.email || '',
  });
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newBio, setNewBio] = useState('');

  // Load profile data
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

          if (error && error.code !== 'PGRST116') {
            console.error('Supabase fetch error:', error);
            throw error;
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
              Alert.alert('Error', 'Could not initialize your profile. Please try again later.');
            } else {
              console.log(`Initial profile created for user ${user.id}`);
              setProfileData({ id: user.id, name: null, bio: null, email: initialEmail });
              setNewDisplayName('');
              setNewBio('');
            }
          }
        } else {
          console.warn("User is not guest but has no ID, cannot load profile.");
          setProfileData({ name: 'Error', bio: 'Could not load profile', email: '' });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        Alert.alert('Error', 'Failed to load profile data. Please try again.');
        setProfileData({ name: 'Error', bio: 'Load failed', email: '' });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [user?.id, isGuest, user?.email]);

  // Edit profile handlers
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
      setIsEditingDisplayName(false);
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

      setProfileData((prevData: ProfileDataType) => ({ ...prevData, name: newDisplayName }));
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
      setIsEditingBio(false);
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

      setProfileData((prevData: ProfileDataType) => ({ ...prevData, bio: newBio }));
      setIsEditingBio(false);
      Alert.alert('Success', 'Bio updated.');
    } catch (error) {
      Alert.alert('Error', `Failed to update bio: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Update bio error:', error);
    } finally {
      setIsSaving(false);
    }
  }, [newBio, profileData, isGuest, user?.id]);

  const handleSignOut = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: contextSignOut }
      ]
    );
  }, [contextSignOut]);

  const renderGoProButton = () => {
    return (
      <TouchableOpacity
        style={styles.goProContainer}
        onPress={() => parentNavigation?.navigate('SubscriptionScreen', { isSpecialOffer: false })}
      >
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.goProContent}
        >
          <View style={styles.goProLeftContent}>
            <View style={styles.goProIconContainer}>
              <Ionicons name="star" size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.goProText}>Go Pro</Text>
              <Text style={styles.goProSubText}>Unlock premium features</Text>
            </View>
          </View>
          <View style={styles.goProBadge}>
            <Text style={styles.goPriceText}>50% OFF</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // Display loading indicator
  if (isLoading) {
    return (
      <SafeAreaView style={[themeStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // Profile editing components
  const renderDisplayNameEdit = () => {
    if (isEditingDisplayName) {
      return (
        <View style={styles.editContainer}>
          <TextInput
            style={[styles.editInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
            value={newDisplayName}
            onChangeText={setNewDisplayName}
            placeholder="Enter your name"
            placeholderTextColor={colors.secondaryText}
          />
          <View style={styles.editButtonsContainer}>
            <TouchableOpacity 
              style={[styles.editButton, { backgroundColor: colors.primary }]} 
              onPress={handleSaveDisplayName}
              disabled={isSaving}
            >
              {isSaving ? 
                <ActivityIndicator size="small" color="#FFFFFF" /> : 
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              }
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.editButton, { backgroundColor: colors.secondaryText }]} 
              onPress={handleCancelDisplayNameEdit}
              disabled={isSaving}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return null;
  };

  const renderBioEdit = () => {
    if (isEditingBio) {
      return (
        <View style={styles.editContainer}>
          <TextInput
            style={[styles.editInput, styles.bioInput, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
            value={newBio}
            onChangeText={setNewBio}
            placeholder="Tell us about yourself"
            placeholderTextColor={colors.secondaryText}
            multiline
            numberOfLines={3}
          />
          <View style={styles.editButtonsContainer}>
            <TouchableOpacity 
              style={[styles.editButton, { backgroundColor: colors.primary }]} 
              onPress={handleSaveBio}
              disabled={isSaving}
            >
              {isSaving ? 
                <ActivityIndicator size="small" color="#FFFFFF" /> : 
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              }
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.editButton, { backgroundColor: colors.secondaryText }]} 
              onPress={handleCancelBioEdit}
              disabled={isSaving}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return null;
  };

  // Create a section component with consistent styling
  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={[themeStyles.subheadingText, styles.sectionTitle]}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  // Create a setting item component with consistent styling
  const renderSettingItem = (icon: keyof typeof Ionicons.glyphMap, text: string, onPress?: () => void, rightElement?: React.ReactNode) => (
    <TouchableOpacity
      style={[styles.settingItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={24} color={colors.icon} style={styles.settingIcon} />
        <Text style={[styles.settingText, { color: colors.text }]}>{text}</Text>
      </View>
      {rightElement || (onPress && <Ionicons name="chevron-forward" size={24} color={colors.secondaryText} />)}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={themeStyles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Header Section */}
        <View style={[styles.profileHeader, { backgroundColor: colors.card }]}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.tileBg }]}>
            <Image
              source={require('../assets/profile-placeholder.png')}
              style={[styles.avatar, { tintColor: colors.primary }]}
            />
          </View>
          
          <View style={styles.nameContainer}>
            <Text style={[styles.userName, { color: colors.text }]}>{profileData.name || 'Guest User'}</Text>
            {!isEditingDisplayName && (
              <TouchableOpacity onPress={handleEditDisplayNameClick} style={styles.editIcon}>
                <Ionicons name="pencil-outline" size={18} color={colors.secondaryText} />
              </TouchableOpacity>
            )}
          </View>
          {renderDisplayNameEdit()}
          
          <View style={styles.bioContainer}>
            <Text style={[styles.userBio, { color: colors.secondaryText }]}>{profileData.bio || 'No bio set.'}</Text>
            {!isEditingBio && (
              <TouchableOpacity onPress={handleEditBioClick} style={styles.editIcon}>
                <Ionicons name="pencil-outline" size={18} color={colors.secondaryText} />
              </TouchableOpacity>
            )}
          </View>
          {renderBioEdit()}
          
          <Text style={[styles.userEmail, { color: colors.secondaryText }]}>{profileData.email || 'guest@example.com'}</Text>
        </View>

        {/* Go Pro Button */}
        {renderGoProButton()}

        {/* Account Section */}
        {renderSection('Account', 
          renderSettingItem('settings-outline', 'Settings', () => parentNavigation?.navigate('Settings'))
        )}

        {/* Help & Support Section */}
        {renderSection('Help & Support', 
          <>
            {renderSettingItem('help-circle-outline', 'Help Center', () => parentNavigation?.navigate('HelpCenter'))}
            {renderSettingItem('bug-outline', 'Report a Problem', () => parentNavigation?.navigate('ReportProblem'))}
            {renderSettingItem('mail-outline', 'Contact Us', () => parentNavigation?.navigate('ContactUs'))}
            {renderSettingItem('document-text-outline', 'Terms & Conditions', () => parentNavigation?.navigate('TermsAndConditions'))}
            {renderSettingItem('shield-outline', 'Privacy Policy', () => parentNavigation?.navigate('PrivacyPolicy'))}
          </>
        )}

        {/* Preferences Section */}
        {renderSection('Preferences',
          renderSettingItem('moon-outline', 'Dark Mode', undefined, 
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isDarkMode ? '#FFFFFF' : '#D1D5DB'}
            />
          )
        )}

        {/* Sign Out Button (Not for guests) */}
        {!isGuest && (
          <TouchableOpacity
            style={[styles.signOutButton, { backgroundColor: colors.tileBg }]}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={22} color={colors.error} style={styles.signOutIcon} />
            <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
          </TouchableOpacity>
        )}

        {/* Extra spacing at bottom */}
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    margin: 16,
    borderRadius: 16,
  },
  avatarContainer: {
    height: 120,
    width: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatar: {
    height: 120,
    width: 120,
    borderRadius: 60,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  editIcon: {
    marginLeft: 8,
    padding: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
  },
  userBio: {
    fontSize: 16,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    marginTop: 4,
  },
  editContainer: {
    width: '100%',
    marginVertical: 8,
    paddingHorizontal: 20,
  },
  editInput: {
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  goProContainer: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  goProContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  goProLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goProIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  goProText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  goProSubText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 2,
  },
  goProBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    transform: [{ rotate: '4deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  goPriceText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  section: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  sectionContent: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  sectionTitle: {
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 16,
    width: 24,
  },
  settingText: {
    fontSize: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  signOutIcon: {
    marginRight: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
