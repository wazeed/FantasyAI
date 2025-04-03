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
import { RootStackParamList } from '../types/navigation';

// --- Types ---

interface PrivacySettings {
  profileVisibility: boolean;
  showActivity: boolean;
  allowDataCollection: boolean;
  shareInterests: boolean;
  allowSearch: boolean;
  showLocation: boolean;
}

type PrivacySettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'PrivacySettings'>;

// --- Subcomponents ---

// Reusable component for settings rows with switches
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
      thumbColor={disabled ? '#BDBDBD' : '#FFFFFF'}
      ios_backgroundColor="#E0E0E0"
      onValueChange={onValueChange}
      value={value}
      disabled={disabled}
    />
  </View>
));

// --- Main Component ---

// TODO: Fetch initial settings from userService
const INITIAL_SETTINGS: PrivacySettings = {
  profileVisibility: true,
  showActivity: true,
  allowDataCollection: true,
  shareInterests: true,
  allowSearch: true,
  showLocation: false,
};

export const PrivacySettingsScreen: React.FC<PrivacySettingsScreenProps> = ({ navigation }) => {
  const { isGuest, user } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings>(INITIAL_SETTINGS);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // TODO: Add useEffect to fetch actual settings when component mounts

  const handleToggleSwitch = useCallback((settingKey: keyof PrivacySettings) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [settingKey]: !prevSettings[settingKey],
    }));
  }, []);
  
  const handleSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    // TODO: Implement API call to userService.updatePrivacySettings(user?.id, settings)
    console.log("Saving privacy settings:", settings);
    try {
      // await userService.updatePrivacySettings(user?.id, settings);
      Alert.alert(
        "Settings Saved",
        "Your privacy settings have been updated.",
        [{ text: "OK" }] // Optionally navigate back
      );
    } catch (error) {
      console.error("Failed to save privacy settings:", error);
      Alert.alert("Save Failed", "Could not update settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [settings, isSaving]); // Add user?.id if used
  
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
          
          <SettingRow
            title="Profile Visibility"
            description="Make your profile visible to others"
            value={settings.profileVisibility}
            onValueChange={() => handleToggleSwitch('profileVisibility')}
          />
          <SettingRow
            title="Activity Status"
            description="Show when you're active on Fantasy AI"
            value={settings.showActivity}
            onValueChange={() => handleToggleSwitch('showActivity')}
          />
          <SettingRow
            title="Location Information"
            description="Share your location on your profile"
            value={settings.showLocation}
            onValueChange={() => handleToggleSwitch('showLocation')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content & Interaction</Text>
          
          <SettingRow
            title="Interest Sharing"
            description="Let others see your interests"
            value={settings.shareInterests}
            onValueChange={() => handleToggleSwitch('shareInterests')}
          />
          <SettingRow
            title="Discoverability"
            description="Allow others to find you by username"
            value={settings.allowSearch}
            onValueChange={() => handleToggleSwitch('allowSearch')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Collection</Text>
          
          <SettingRow
            title="Usage Analytics"
            description="Allow us to collect anonymized usage data to improve the app"
            value={settings.allowDataCollection}
            onValueChange={() => handleToggleSwitch('allowDataCollection')}
          />
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
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
  disabledItem: {
    opacity: 0.5,
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