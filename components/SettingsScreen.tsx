import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsScreen({ navigation }) {
  const { isGuest } = useAuth();

  const navigateToPrivacySettings = () => {
    navigation.navigate('PrivacySettings');
  };

  const navigateToNotificationSettings = () => {
    navigation.navigate('NotificationSettings');
  };

  const navigateToSecuritySettings = () => {
    navigation.navigate('SecuritySettings');
  };

  const renderSettingItem = (title, description, onPress, disabled = false) => (
    <TouchableOpacity 
      style={[styles.settingItem, disabled && styles.settingItemDisabled]} 
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Text style={styles.settingArrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          {renderSettingItem(
            'Profile Information',
            'Edit your profile details',
            () => navigation.navigate('EditProfile'),
            false
          )}
          
          {renderSettingItem(
            'Privacy Settings',
            'Manage your privacy preferences',
            navigateToPrivacySettings,
            isGuest
          )}
          
          {renderSettingItem(
            'Notification Settings',
            'Control how you receive notifications',
            navigateToNotificationSettings,
            isGuest
          )}
          
          {renderSettingItem(
            'Security Settings',
            'Password, two-factor authentication',
            navigateToSecuritySettings,
            isGuest
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Dark Mode</Text>
              <Text style={styles.settingDescription}>Switch between light and dark themes</Text>
            </View>
            <Switch
              trackColor={{ false: '#E0E0E0', true: '#000000' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E0E0E0"
              // onValueChange={toggleDarkMode}
              value={false}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Autoplay Media</Text>
              <Text style={styles.settingDescription}>Automatically play videos and animations</Text>
            </View>
            <Switch
              trackColor={{ false: '#E0E0E0', true: '#000000' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E0E0E0"
              // onValueChange={toggleAutoplay}
              value={true}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          {renderSettingItem(
            'Help Center',
            'Get help with Fantasy AI',
            () => {}
          )}
          
          {renderSettingItem(
            'Report a Problem',
            'Let us know about any issues',
            () => {}
          )}
          
          {renderSettingItem(
            'Terms of Service',
            'Review our terms and conditions',
            () => {}
          )}
          
          {renderSettingItem(
            'Privacy Policy',
            'Learn how we handle your data',
            () => {}
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Version</Text>
              <Text style={styles.settingDescription}>1.0.0</Text>
            </View>
          </View>
        </View>

        {isGuest && (
          <View style={styles.guestMessageContainer}>
            <Text style={styles.guestMessage}>
              Create an account to access all settings and customize your experience.
            </Text>
            <TouchableOpacity 
              style={styles.createAccountButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.createAccountText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666666',
  },
  settingArrow: {
    fontSize: 20,
    color: '#666666',
    marginLeft: 8,
  },
  guestMessageContainer: {
    backgroundColor: '#F9F9F9',
    margin: 16,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  guestMessage: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
  },
  createAccountButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  createAccountText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
}); 