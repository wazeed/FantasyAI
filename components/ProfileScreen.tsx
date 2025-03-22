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
    <View key={index} style={[styles.settingsCategory, index !== 0 && { marginTop: 24 }]}>
      <Text style={[styles.settingsCategoryTitle, { color: colors.text }]}>{category.title}</Text>
      <View style={[styles.settingsList, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {category.items.map(item => renderSettingItem(item))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Profile Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.profileImageContainer} onPress={handleEditProfile}>
            <Image
              source={require('../assets/profile-placeholder.png')}
              style={styles.profileImage}
            />
            <View style={[styles.editImageButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.editImageText}>Edit</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <Text style={[styles.displayName, { color: colors.text }]}>
              {isGuest ? 'Guest User' : profileData.displayName}
            </Text>
            <Text style={[styles.username, { color: colors.subText }]}>
              @{isGuest ? 'guest' : profileData.username}
            </Text>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.primaryButton, { backgroundColor: colors.primary }]} 
                onPress={handleEditProfile}
              >
                <Text style={styles.primaryButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Subscription Card - Prominent Placement */}
        <View style={[styles.subscriptionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.subscriptionHeader}>
            <Text style={[styles.subscriptionTitle, { color: colors.text }]}>
              {isGuest ? 'Free Plan' : 'Premium Plan'}
            </Text>
            <View style={[
              styles.subscriptionBadge, 
              { backgroundColor: isGuest ? '#64748B' : '#10B981' }
            ]}>
              <Text style={styles.subscriptionBadgeText}>
                {isGuest ? 'BASIC' : 'PREMIUM'}
              </Text>
            </View>
          </View>
          
          <Text style={[styles.subscriptionDescription, { color: colors.subText }]}>
            {isGuest 
              ? 'Limited access with up to 10 messages per day.' 
              : 'Full access to all features and unlimited conversations.'}
          </Text>
          
          {!isGuest && (
            <Text style={[styles.subscriptionValidity, { color: colors.subText }]}>
              Valid until: Dec 31, 2023
            </Text>
          )}
          
          <TouchableOpacity 
            style={[
              styles.subscriptionButton,
              { backgroundColor: isGuest ? colors.accent : `${colors.accent}20` }
            ]}
            onPress={() => navigation.navigate('SubscriptionScreen')}
          >
            <Text style={[
              styles.subscriptionButtonText, 
              { color: isGuest ? '#FFFFFF' : colors.accent }
            ]}>
              {isGuest ? 'Upgrade to Premium' : 'Manage Subscription'}
            </Text>
          </TouchableOpacity>
          
          {isGuest && (
            <View style={styles.benefitsContainer}>
              <Text style={[styles.benefitsTitle, { color: colors.text }]}>
                Why upgrade to Premium?
              </Text>
              
              <View style={styles.benefitItem}>
                <Ionicons name="infinite-outline" size={18} color={colors.accent} />
                <Text style={[styles.benefitText, { color: colors.subText }]}>
                  Unlimited conversations
                </Text>
              </View>
              
              <View style={styles.benefitItem}>
                <Ionicons name="people-outline" size={18} color={colors.accent} />
                <Text style={[styles.benefitText, { color: colors.subText }]}>
                  Access to all AI characters
                </Text>
              </View>
              
              <View style={styles.benefitItem}>
                <Ionicons name="remove-circle-outline" size={18} color={colors.accent} />
                <Text style={[styles.benefitText, { color: colors.subText }]}>
                  Ad-free experience
                </Text>
              </View>
            </View>
          )}
        </View>
        
        {/* Profile Content - Only For Signed In Users */}
        {!isGuest && (
          <>
            <View style={[styles.section, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
              <Text style={[styles.bioText, { color: colors.subText }]}>
                {profileData.bio}
              </Text>
            </View>

            <View style={[styles.section, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Location</Text>
              <Text style={[styles.infoText, { color: colors.subText }]}>{profileData.location}</Text>
            </View>

            <View style={[styles.section, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Interests</Text>
              <View style={styles.interestsContainer}>
                {profileData.interests.map(renderInterestItem)}
              </View>
            </View>

            <View style={[styles.section, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Achievements</Text>
              <View style={styles.achievementsContainer}>
                {profileData.achievements.map(renderAchievementItem)}
              </View>
            </View>
          </>
        )}

        {/* Organized Settings Categories */}
        {SETTINGS_CATEGORIES.map(renderSettingsCategory)}
        
        {/* Sign Out Button */}
        <TouchableOpacity 
          style={[styles.signOutButton, { backgroundColor: isDarkMode ? '#333333' : '#F0F0F0' }]} 
          onPress={signOut}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" style={styles.signOutIcon} />
          <Text style={[styles.signOutText, { color: '#FF3B30' }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editImageText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  displayName: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  primaryButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
    borderBottomWidth: 1,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  bioText: {
    fontSize: 16,
    lineHeight: 22,
  },
  infoText: {
    fontSize: 16,
  },
  contactItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  contactLabel: {
    fontSize: 16,
    width: 60,
  },
  contactValue: {
    fontSize: 16,
    flex: 1,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestItem: {
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    fontSize: 14,
  },
  achievementsContainer: {
    marginTop: 8,
  },
  achievementItem: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  achievementIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFC107',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  achievementIconText: {
    fontSize: 20,
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
    marginBottom: 2,
  },
  achievementDate: {
    fontSize: 12,
  },
  settingsCategory: {
    marginBottom: 16,
  },
  settingsCategoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    paddingLeft: 4,
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
    paddingVertical: 16,
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
    fontSize: 16,
  },
  subscriptionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  subscriptionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  subscriptionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  subscriptionBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  subscriptionDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  subscriptionValidity: {
    fontSize: 14,
    marginBottom: 16,
  },
  subscriptionButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  subscriptionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  benefitsContainer: {
    marginTop: 8,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    marginLeft: 8,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 24,
  },
  signOutIcon: {
    marginRight: 8,
  },
  signOutText: {
    fontWeight: '500',
    fontSize: 16,
  },
}); 