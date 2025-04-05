import React, { useState, useCallback } from 'react';
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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types/navigation'; // Use the correct exported type

// --- Types ---

interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  newFeatures: boolean;
  characterUpdates: boolean;
  newMessages: boolean;
  promotions: boolean;
  weeklyDigest: boolean;
  nightMode: boolean; // Represents 'Do Not Disturb'
}

type NotificationSettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'NotificationSettings'>;

// --- Subcomponents ---

interface SettingRowProps {
  title: string;
  description: string;
  value: boolean;
  onValueChange: () => void;
  disabled?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = React.memo(({
  title,
  description,
  value,
  onValueChange,
  disabled = false,
}) => (
  <View style={[styles.settingItem, disabled && styles.disabledItem]}>
    <View style={styles.settingContent}>
      <Text style={styles.settingTitle}>{title}</Text>
      <Text style={styles.settingDescription}>{description}</Text>
    </View>
    <Switch
      trackColor={{ false: '#E0E0E0', true: '#000000' }}
      thumbColor={disabled ? '#BDBDBD' : '#FFFFFF'} // Adjust thumb color when disabled
      ios_backgroundColor="#E0E0E0"
      onValueChange={onValueChange}
      value={value}
      disabled={disabled}
    />
  </View>
));

// --- Main Component ---

// TODO: Fetch initial settings from userService
const INITIAL_SETTINGS: NotificationSettings = {
  pushEnabled: true,
  emailEnabled: true,
  newFeatures: true,
  characterUpdates: true,
  newMessages: true,
  promotions: false,
  weeklyDigest: true,
  nightMode: false,
};

export const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({ navigation }) => {
  const { isGuest, user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>(INITIAL_SETTINGS);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // TODO: Add useEffect to fetch actual settings when component mounts, e.g.,
  // useEffect(() => {
  //   const fetchSettings = async () => {
  //     // setLoading(true); setError(null);
  //     try {
  //       // const userSettings = await userService.getNotificationSettings(user?.id);
  //       // setSettings(userSettings);
  //     } catch (err) { /* setError(err) */ }
  //     // finally { setLoading(false); }
  //   };
  //   if (!isGuest) fetchSettings();
  // }, [user, isGuest]);

  const handleToggleSwitch = useCallback((settingKey: keyof NotificationSettings) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [settingKey]: !prevSettings[settingKey],
    }));
  }, []);
  
  const handleSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    // TODO: Implement API call to userService.updateNotificationSettings(user?.id, settings)
    console.log("Saving notification settings:", settings);
    try {
      // await userService.updateNotificationSettings(user?.id, settings);
      Alert.alert(
        "Settings Saved",
        "Your notification preferences have been updated.",
        [{ text: "OK" }] // Optionally navigate back: onPress: () => navigation.goBack()
      );
    } catch (error) {
      console.error("Failed to save notification settings:", error);
      Alert.alert("Save Failed", "Could not update settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [settings, isSaving]); // Add user?.id if used in API call
  
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
          
          <SettingRow
            title="Push Notifications"
            description="Receive alerts on your device"
            value={settings.pushEnabled}
            onValueChange={() => handleToggleSwitch('pushEnabled')}
          />
          <SettingRow
            title="Email Notifications"
            description="Receive updates via email"
            value={settings.emailEnabled}
            onValueChange={() => handleToggleSwitch('emailEnabled')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Push Notification Types</Text>
          
          <SettingRow
            title="New Messages"
            description="When you receive new messages from characters"
            value={settings.newMessages}
            onValueChange={() => handleToggleSwitch('newMessages')}
            disabled={!settings.pushEnabled}
          />
          <SettingRow
            title="Character Updates"
            description="When your favorite characters are updated"
            value={settings.characterUpdates}
            onValueChange={() => handleToggleSwitch('characterUpdates')}
            disabled={!settings.pushEnabled}
          />
          <SettingRow
            title="New Features"
            description="When new app features are available"
            value={settings.newFeatures}
            onValueChange={() => handleToggleSwitch('newFeatures')}
            disabled={!settings.pushEnabled}
          />
          <SettingRow
            title="Promotions"
            description="Special offers and promotional content"
            value={settings.promotions}
            onValueChange={() => handleToggleSwitch('promotions')}
            disabled={!settings.pushEnabled}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Email Preferences</Text>
          
          <SettingRow
            title="Weekly Digest"
            description="Weekly summary of conversations and new characters"
            value={settings.weeklyDigest}
            onValueChange={() => handleToggleSwitch('weeklyDigest')}
            disabled={!settings.emailEnabled}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quiet Hours</Text>
          
          <SettingRow
            title="Do Not Disturb"
            description="Mute notifications between 10 PM and 7 AM" // TODO: Make times configurable?
            value={settings.nightMode}
            onValueChange={() => handleToggleSwitch('nightMode')}
          />
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
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
  disabledItem: {
    opacity: 0.5, // Visually indicate disabled state
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