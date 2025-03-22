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

export default function PrivacySettingsScreen({ navigation }) {
  const { isGuest } = useAuth();
  
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: true,
    showActivity: true,
    allowDataCollection: true,
    shareInterests: true,
    allowSearch: true,
    showLocation: false,
  });
  
  const toggleSwitch = (setting) => {
    setPrivacySettings({
      ...privacySettings,
      [setting]: !privacySettings[setting],
    });
  };
  
  const handleSave = () => {
    // In a real app, this would save the settings to the server
    Alert.alert(
      "Settings Saved",
      "Your privacy settings have been updated.",
      [{ text: "OK" }]
    );
  };
  
  if (isGuest) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.guestContainer}>
          <Text style={styles.guestTitle}>Guest Account</Text>
          <Text style={styles.guestText}>
            You need to create an account to access and customize privacy settings.
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
          <Text style={styles.sectionTitle}>Profile Privacy</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Profile Visibility</Text>
              <Text style={styles.settingDescription}>
                Make your profile visible to others
              </Text>
            </View>
            <Switch
              trackColor={{ false: '#E0E0E0', true: '#000000' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E0E0E0"
              onValueChange={() => toggleSwitch('profileVisibility')}
              value={privacySettings.profileVisibility}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Activity Status</Text>
              <Text style={styles.settingDescription}>
                Show when you're active on Fantasy AI
              </Text>
            </View>
            <Switch
              trackColor={{ false: '#E0E0E0', true: '#000000' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E0E0E0"
              onValueChange={() => toggleSwitch('showActivity')}
              value={privacySettings.showActivity}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Location Information</Text>
              <Text style={styles.settingDescription}>
                Share your location on your profile
              </Text>
            </View>
            <Switch
              trackColor={{ false: '#E0E0E0', true: '#000000' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E0E0E0"
              onValueChange={() => toggleSwitch('showLocation')}
              value={privacySettings.showLocation}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content & Interaction</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Interest Sharing</Text>
              <Text style={styles.settingDescription}>
                Let others see your interests
              </Text>
            </View>
            <Switch
              trackColor={{ false: '#E0E0E0', true: '#000000' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E0E0E0"
              onValueChange={() => toggleSwitch('shareInterests')}
              value={privacySettings.shareInterests}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Discoverability</Text>
              <Text style={styles.settingDescription}>
                Allow others to find you by username
              </Text>
            </View>
            <Switch
              trackColor={{ false: '#E0E0E0', true: '#000000' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E0E0E0"
              onValueChange={() => toggleSwitch('allowSearch')}
              value={privacySettings.allowSearch}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Collection</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Usage Analytics</Text>
              <Text style={styles.settingDescription}>
                Allow us to collect anonymized usage data to improve the app
              </Text>
            </View>
            <Switch
              trackColor={{ false: '#E0E0E0', true: '#000000' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E0E0E0"
              onValueChange={() => toggleSwitch('allowDataCollection')}
              value={privacySettings.allowDataCollection}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Your privacy is important to us. These settings help you control how your information is shared and used within Fantasy AI. For more details, please read our Privacy Policy.
          </Text>
        </View>
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
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  infoContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 40,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
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