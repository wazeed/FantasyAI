import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function NotificationSettingsScreen({ navigation }) {
  const { isGuest } = useAuth();
  
  const [notificationSettings, setNotificationSettings] = useState({
    pushEnabled: true,
    emailEnabled: true,
    newFeatures: true,
    characterUpdates: true,
    newMessages: true,
    promotions: false,
    weeklyDigest: true,
    nightMode: false,
  });
  
  const toggleSwitch = (setting) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: !notificationSettings[setting],
    });
  };
  
  const handleSave = () => {
    // In a real app, this would save the settings to the server
    Alert.alert(
      "Settings Saved",
      "Your notification preferences have been updated.",
      [{ text: "OK" }]
    );
  };
  
  if (isGuest) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.guestContainer}>
          <Text style={styles.guestTitle}>Guest Account</Text>
          <Text style={styles.guestText}>
            You need to create an account to access and customize notification settings.
          </Text>
          <TouchableOpacity 
            style={styles.createAccountButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.createAccountText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Channels</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive alerts on your device
              </Text>
            </View>
            <Switch
              trackColor={{ false: '#E0E0E0', true: '#000000' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E0E0E0"
              onValueChange={() => toggleSwitch('pushEnabled')}
              value={notificationSettings.pushEnabled}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Email Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive updates via email
              </Text>
            </View>
            <Switch
              trackColor={{ false: '#E0E0E0', true: '#000000' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E0E0E0"
              onValueChange={() => toggleSwitch('emailEnabled')}
              value={notificationSettings.emailEnabled}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Push Notification Types</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>New Messages</Text>
              <Text style={styles.settingDescription}>
                When you receive new messages from characters
              </Text>
            </View>
            <Switch
              trackColor={{ false: '#E0E0E0', true: '#000000' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E0E0E0"
              onValueChange={() => toggleSwitch('newMessages')}
              value={notificationSettings.newMessages}
              disabled={!notificationSettings.pushEnabled}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Character Updates</Text>
              <Text style={styles.settingDescription}>
                When your favorite characters are updated
              </Text>
            </View>
            <Switch
              trackColor={{ false: '#E0E0E0', true: '#000000' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E0E0E0"
              onValueChange={() => toggleSwitch('characterUpdates')}
              value={notificationSettings.characterUpdates}
              disabled={!notificationSettings.pushEnabled}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>New Features</Text>
              <Text style={styles.settingDescription}>
                When new app features are available
              </Text>
            </View>
            <Switch
              trackColor={{ false: '#E0E0E0', true: '#000000' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E0E0E0"
              onValueChange={() => toggleSwitch('newFeatures')}
              value={notificationSettings.newFeatures}
              disabled={!notificationSettings.pushEnabled}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Promotions</Text>
              <Text style={styles.settingDescription}>
                Special offers and promotional content
              </Text>
            </View>
            <Switch
              trackColor={{ false: '#E0E0E0', true: '#000000' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E0E0E0"
              onValueChange={() => toggleSwitch('promotions')}
              value={notificationSettings.promotions}
              disabled={!notificationSettings.pushEnabled}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Email Preferences</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Weekly Digest</Text>
              <Text style={styles.settingDescription}>
                Weekly summary of your conversations and new characters
              </Text>
            </View>
            <Switch
              trackColor={{ false: '#E0E0E0', true: '#000000' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E0E0E0"
              onValueChange={() => toggleSwitch('weeklyDigest')}
              value={notificationSettings.weeklyDigest}
              disabled={!notificationSettings.emailEnabled}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quiet Hours</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Do Not Disturb</Text>
              <Text style={styles.settingDescription}>
                Mute notifications between 10 PM and 7 AM
              </Text>
            </View>
            <Switch
              trackColor={{ false: '#E0E0E0', true: '#000000' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E0E0E0"
              onValueChange={() => toggleSwitch('nightMode')}
              value={notificationSettings.nightMode}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingContent: {
    flex: 1,
    paddingRight: 16,
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
  saveButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginVertical: 16,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  guestText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  createAccountButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  createAccountText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
}); 