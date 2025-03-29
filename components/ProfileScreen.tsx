import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  TextInput, // Added TextInput
  Alert, // Added Alert for feedback
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

// Placeholder profile data
const PROFILE_DATA = {
  username: 'johnsmith',
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

// Organize settings into categories for better structure
const SETTINGS_CATEGORIES = [
  {
    title: 'Account',
    items: [
      // { title: 'Edit Profile', icon: 'person-outline', screen: 'EditProfile' }, // Removed Edit Profile setting
      { title: 'Privacy Settings', icon: 'shield-outline', screen: 'PrivacySettings' },
      { title: 'Notification Settings', icon: 'notifications-outline', screen: 'NotificationSettings' },
      { title: 'Security Settings', icon: 'lock-closed-outline', screen: 'SecuritySettings' },
    ]
  },
  {
    title: 'Help & Support',
    items: [
      { title: 'Help Center', icon: 'help-circle-outline', screen: 'HelpCenter' }, 
      { title: 'Report a Problem', icon: 'bug-outline', screen: 'ReportProblem' },
      { title: 'Contact Us', icon: 'mail-outline', screen: 'ContactUs' }
    ]
  },
  {
    title: 'Preferences',
    items: [
      { title: 'Dark Mode', icon: 'moon-outline', toggle: true, action: 'toggleTheme' }
    ]
  }
];

export default function ProfileScreen({ navigation }) {
  const { user, signOut, isGuest } = useAuth();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext); // Use useContext directly
  const [profileData, setProfileData] = useState(PROFILE_DATA); // Allow setting profile data
  const { navigate } = useNavigation();
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newUsername, setNewUsername] = useState(profileData.username);
  const [newDisplayName, setNewDisplayName] = useState(profileData.displayName);
  const [newBio, setNewBio] = useState(profileData.bio);

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

  const handleEditUsernameClick = () => {
    setNewUsername(profileData.username); // Reset input on edit start
    setIsEditingUsername(true);
  };

  const handleSaveUsername = () => {
    // TODO: Implement actual username update logic (e.g., call API)
    console.log('Saving new username:', newUsername);
    // Update local state for immediate feedback (replace with actual data update)
    setProfileData({ ...profileData, username: newUsername });
    setIsEditingUsername(false);
    Alert.alert('Username Updated', `Your username has been changed to ${newUsername}`);
  };

  const handleEditDisplayNameClick = () => {
    setNewDisplayName(profileData.displayName);
    setIsEditingDisplayName(true);
  };

  const handleSaveDisplayName = () => {
    setProfileData({ ...profileData, displayName: newDisplayName });
    setIsEditingDisplayName(false);
    Alert.alert('Display Name Updated', `Your display name has been changed to ${newDisplayName}`);
  };

  const handleCancelDisplayNameEdit = () => {
    setIsEditingDisplayName(false);
    setNewDisplayName(profileData.displayName);
  };

  const handleCancelEdit = () => {
    setIsEditingUsername(false);
    setNewUsername(profileData.username); // Revert to original username
  };

  const handleEditBioClick = () => {
    setIsEditingBio(true);
  };

  const handleSaveBio = () => {
    setProfileData({ ...profileData, bio: newBio });
    setIsEditingBio(false);
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

  const renderInterestItem = (interest, index) => (
    <View key={index} style={[styles.interestItem, { backgroundColor: colors.lightBackground }]}>
      <Text style={[styles.interestText, { color: colors.text }]}>{interest}</Text>
    </View>
  );

  const renderAchievementItem = (achievement) => (
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

  const renderSettingItem = (item) => {
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

  const renderSettingsCategory = (category, index) => (
    <View key={index} style={[styles.settingsCategoryContainer, index !== 0 && { marginTop: 24 }]}>
      <View style={[styles.settingsCategoryHeader, { backgroundColor: colors.card }]}>
        <Text style={[styles.settingsCategoryTitle, { color: colors.text }]}>{category.title}</Text>
      </View>
      <View style={[styles.settingsList, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {category.items.map(item => renderSettingItem(item))}
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
              <TouchableOpacity onPress={handleSaveDisplayName} style={[styles.editUsernameButton, { backgroundColor: colors.accent }]}>
                <Ionicons name="checkmark-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCancelDisplayNameEdit} style={[styles.editUsernameButton, { backgroundColor: colors.subText, marginLeft: 8 }]}>
                <Ionicons name="close-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.usernameDisplayContainer}>
              <Text style={[styles.displayName, { color: colors.text }]}>
                {isGuest ? 'Guest User' : profileData.displayName}
              </Text>
              {!isGuest && (
                <TouchableOpacity onPress={handleEditDisplayNameClick} style={styles.editIcon}>
                  <Ionicons name="create-outline" size={18} color={colors.subText} />
                </TouchableOpacity>
              )}
            </View>
          )}
          
          {/* Username Display/Edit Section */}
          <View style={styles.usernameSection}>
            {isEditingUsername ? (
              <View style={styles.editUsernameContainer}>
                <TextInput
                  style={[styles.usernameInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.lightBackground }]}
                  value={newUsername}
                  onChangeText={setNewUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="Enter new username"
                  placeholderTextColor={colors.subText}
                />
                <TouchableOpacity onPress={handleSaveUsername} style={[styles.editUsernameButton, { backgroundColor: colors.accent }]}>
                  <Ionicons name="checkmark-outline" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCancelEdit} style={[styles.editUsernameButton, { backgroundColor: colors.subText, marginLeft: 8 }]}>
                  <Ionicons name="close-outline" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.usernameDisplayContainer}>
                <Text style={[styles.username, { color: colors.subText }]}>
                  @{isGuest ? 'guest' : profileData.username}
                </Text>
                {!isGuest && (
                   <TouchableOpacity onPress={handleEditUsernameClick} style={styles.editIcon}>
                     <Ionicons name="create-outline" size={18} color={colors.subText} />
                   </TouchableOpacity>
                )}
              </View>
            )}
          </View>
          
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
                <TouchableOpacity onPress={handleSaveBio} style={[styles.editBioButton, { backgroundColor: colors.accent }]}>
                  <Ionicons name="checkmark-outline" size={20} color="#FFFFFF" />
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