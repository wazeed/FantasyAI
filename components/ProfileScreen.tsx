import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
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
      { title: 'Edit Profile', icon: 'person-outline', screen: 'EditProfile' },
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
  const { isDarkMode, toggleTheme } = React.useContext(ThemeContext);
  const [profileData] = useState(PROFILE_DATA);
  const { navigate } = useNavigation();

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

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const navigateToScreen = (screenName) => {
    navigation.navigate(screenName);
  };

  const handleActionPress = (action, screen) => {
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
          
          <Text style={[styles.displayName, { color: colors.text }]}>
            {isGuest ? 'Guest User' : profileData.displayName}
          </Text>
          
          <Text style={[styles.username, { color: colors.subText }]}>
            @{isGuest ? 'guest' : profileData.username}
          </Text>
          
          {!isGuest && (
            <Text style={[styles.bio, { color: colors.text }]}>
              {profileData.bio}
            </Text>
          )}
          
          <TouchableOpacity
            style={[styles.editProfileButton, { borderColor: colors.border }]}
            onPress={handleEditProfile}
          >
            <Ionicons name="create-outline" size={18} color={colors.text} style={styles.editButtonIcon} />
            <Text style={[styles.editButtonText, { color: colors.text }]}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
        
        {/* Info Cards */}
        {!isGuest && (
          <>
            <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
              <View style={styles.infoHeader}>
                <Ionicons name="location-outline" size={20} color={colors.text} />
                <Text style={[styles.infoTitle, { color: colors.text }]}>Location</Text>
              </View>
              <Text style={[styles.infoText, { color: colors.subText }]}>{profileData.location}</Text>
            </View>
            
            <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
              <View style={styles.infoHeader}>
                <Ionicons name="heart-outline" size={20} color={colors.text} />
                <Text style={[styles.infoTitle, { color: colors.text }]}>Interests</Text>
              </View>
              <View style={styles.interestsContainer}>
                {profileData.interests.map((interest, index) => renderInterestItem(interest, index))}
              </View>
            </View>
            
            <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
              <View style={styles.infoHeader}>
                <Ionicons name="trophy-outline" size={20} color={colors.text} />
                <Text style={[styles.infoTitle, { color: colors.text }]}>Achievements</Text>
              </View>
              <View style={styles.achievementsContainer}>
                {profileData.achievements.map((achievement) => renderAchievementItem(achievement))}
              </View>
            </View>
          </>
        )}
        
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
  versionText: {
    fontSize: 14,
    textAlign: 'center',
  },
}); 