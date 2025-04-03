import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  StyleProp,
  ViewStyle,
  TextStyle,
  RegisteredStyle,
  RecursiveArray,
  Falsy,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import type { NavigationProp, ParamListBase } from '@react-navigation/native'; // Assuming usage of react-navigation

// --- Interfaces ---

interface SettingsScreenProps {
  navigation: NavigationProp<ParamListBase>; // Use a more specific type if available (e.g., StackNavigationProp)
}

interface SettingsListItemProps {
  title: string;
  description: string;
  onPress: () => void;
  disabled?: boolean;
}

interface SettingsSwitchItemProps {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void; // Keep signature even if implementation is TODO
  disabled?: boolean;
}

// --- Styles ---
// Define styles before components that use them to avoid potential scope issues flagged by TS

// Define reusable style types
type SettingItemStyle = StyleProp<ViewStyle>;
type SettingTextStyle = StyleProp<TextStyle>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // TODO: Use theme color
  } satisfies ViewStyle,
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  } satisfies ViewStyle,
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000', // TODO: Use theme color
    marginTop: 16,
    marginBottom: 12,
  } satisfies TextStyle,
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0', // TODO: Use theme color
  } satisfies ViewStyle, // Use ViewStyle here as it's the base style
  settingItemDisabled: {
    opacity: 0.5,
  } satisfies ViewStyle, // Use ViewStyle here
  settingContent: {
    flex: 1,
    marginRight: 8, // Add some space before the arrow/switch
  } satisfies ViewStyle,
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000', // TODO: Use theme color
    marginBottom: 4,
  } satisfies SettingTextStyle,
  settingDescription: {
    fontSize: 14,
    color: '#666666', // TODO: Use theme color
  } satisfies SettingTextStyle,
  settingArrow: {
    fontSize: 20,
    color: '#666666', // TODO: Use theme color
    marginLeft: 8,
  } satisfies SettingTextStyle,
  guestMessageContainer: {
    backgroundColor: '#F9F9F9', // TODO: Use theme color
    margin: 16,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 40,
  } satisfies ViewStyle,
  guestMessage: {
    fontSize: 14,
    color: '#666666', // TODO: Use theme color
    textAlign: 'center',
    marginBottom: 16,
  } satisfies TextStyle,
  createAccountButton: {
    backgroundColor: '#000000', // TODO: Use theme color (primary button)
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  } satisfies ViewStyle,
  createAccountText: {
    color: '#FFFFFF', // TODO: Use theme color
    fontWeight: '500',
    fontSize: 14,
  } satisfies TextStyle,
});


// --- Subcomponents ---

const SettingsListItem: React.FC<SettingsListItemProps> = ({
  title,
  description,
  onPress,
  disabled = false,
}) => (
  <TouchableOpacity
    style={[styles.settingItem, disabled && styles.settingItemDisabled]} // Corrected: Use &&
    onPress={onPress}
    disabled={disabled}
    accessibilityLabel={title}
    accessibilityHint={description}
    accessibilityState={{ disabled: !!disabled }} // Corrected: Ensure boolean value
  >
    <View style={styles.settingContent}>
      <Text style={styles.settingTitle}>{title}</Text>
      <Text style={styles.settingDescription}>{description}</Text>
    </View>
    {!disabled && <Text style={styles.settingArrow} aria-hidden={true}>›</Text>} {/* Corrected: Use && */}
  </TouchableOpacity>
);

const SettingsSwitchItem: React.FC<SettingsSwitchItemProps> = ({
  title,
  description,
  value,
  onValueChange,
  disabled = false,
}) => (
  <View style={[styles.settingItem, disabled && styles.settingItemDisabled]}> {/* Corrected: Use && */}
    <View style={styles.settingContent}>
      <Text style={styles.settingTitle}>{title}</Text>
      <Text style={styles.settingDescription}>{description}</Text>
    </View>
    <Switch
      trackColor={{ false: '#E0E0E0', true: '#000000' }} // Consider using theme colors if available
      thumbColor="#FFFFFF"
      ios_backgroundColor="#E0E0E0"
      onValueChange={onValueChange}
      value={value}
      disabled={disabled}
      accessibilityLabel={title}
    />
  </View>
);

// --- Main Component ---

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { isGuest } = useAuth();

  // TODO: Implement Dark Mode state and toggle logic
  const handleToggleDarkMode = (newValue: boolean) => {
    console.log('Dark Mode Toggled (Not Implemented):', newValue);
    // Add state management logic here (e.g., using ThemeContext)
  };

  // TODO: Implement Autoplay Media state and toggle logic
  const handleToggleAutoplay = (newValue: boolean) => {
    console.log('Autoplay Media Toggled (Not Implemented):', newValue);
    // Add state management logic here
  };

  // TODO: Implement navigation for support items
  const navigateToHelpCenter = () => console.log('Navigate to Help Center (Not Implemented)');
  const navigateToReportProblem = () => console.log('Navigate to Report Problem (Not Implemented)');
  const navigateToTerms = () => console.log('Navigate to Terms of Service (Not Implemented)');
  const navigateToPrivacyPolicy = () => console.log('Navigate to Privacy Policy (Not Implemented)');


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <SettingsListItem
            title="Profile Information"
            description="Edit your profile details"
            onPress={() => navigation.navigate('EditProfile')} // Consider defining route names as constants
            disabled={isGuest} // Profile editing likely requires login
          />
          <SettingsListItem
            title="Privacy Settings"
            description="Manage your privacy preferences"
            onPress={() => navigation.navigate('PrivacySettings')}
            disabled={isGuest}
          />
          <SettingsListItem
            title="Notification Settings"
            description="Control how you receive notifications"
            onPress={() => navigation.navigate('NotificationSettings')}
            disabled={isGuest}
          />
          <SettingsListItem
            title="Security Settings"
            description="Password, two-factor authentication"
            onPress={() => navigation.navigate('SecuritySettings')}
            disabled={isGuest}
          />
        </View>

        {/* App Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          <SettingsSwitchItem
            title="Dark Mode"
            description="Switch between light and dark themes"
            value={false} // TODO: Replace with actual state value
            onValueChange={handleToggleDarkMode}
          />
          <SettingsSwitchItem
            title="Autoplay Media"
            description="Automatically play videos and animations"
            value={true} // TODO: Replace with actual state value
            onValueChange={handleToggleAutoplay}
          />
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <SettingsListItem
            title="Help Center"
            description="Get help with Fantasy AI"
            onPress={navigateToHelpCenter} // TODO: Implement navigation
          />
          <SettingsListItem
            title="Report a Problem"
            description="Let us know about any issues"
            onPress={navigateToReportProblem} // TODO: Implement navigation
          />
          <SettingsListItem
            title="Terms of Service"
            description="Review our terms and conditions"
            onPress={navigateToTerms} // TODO: Implement navigation
          />
          <SettingsListItem
            title="Privacy Policy"
            description="Learn how we handle your data"
            onPress={navigateToPrivacyPolicy} // TODO: Implement navigation
          />
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          {/* Using SettingsListItem for consistency, even though it's not interactive */}
          <SettingsListItem
            title="Version"
            description="1.0.0" // TODO: Get version dynamically (e.g., from package.json or config)
            onPress={() => {}} // No action
            disabled={true} // Visually indicate non-interactive
          />
        </View>

        {/* Guest Prompt */}
        {isGuest && ( // Corrected: Use &&
          <View style={styles.guestMessageContainer}>
            <Text style={styles.guestMessage}>
              Create an account to access all settings and customize your experience.
            </Text>
            <TouchableOpacity
              style={styles.createAccountButton}
              onPress={() => navigation.navigate('Login')} // Consider defining route names as constants
              accessibilityRole="button"
              accessibilityLabel="Create Account"
            >
              <Text style={styles.createAccountText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}