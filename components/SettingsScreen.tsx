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
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';

// --- Interfaces ---
interface SettingsScreenProps {
  navigation: NavigationProp<ParamListBase>;
}

interface SettingsListItemProps {
  title: string;
  description: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  colors: any;
}

interface SettingsSwitchItemProps {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  colors: any;
}

// --- Main Component ---
export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { isGuest } = useAuth();
  const { colors, styles: themeStyles, isDarkMode, toggleTheme } = useTheme();

  // Implement Dark Mode toggle with the actual state from ThemeContext
  const handleToggleDarkMode = (newValue: boolean) => {
    toggleTheme();
  };

  // TODO: Implement Autoplay Media state and toggle logic
  const handleToggleAutoplay = (newValue: boolean) => {
    console.log('Autoplay Media Toggled (Not Implemented):', newValue);
    // Add state management logic here
  };

  // Navigation for support items
  const navigateToHelpCenter = () => navigation.navigate('HelpCenter');
  const navigateToReportProblem = () => navigation.navigate('ReportProblem');
  const navigateToTerms = () => navigation.navigate('TermsAndConditions');
  const navigateToPrivacyPolicy = () => navigation.navigate('PrivacyPolicy');

  return (
    <SafeAreaView style={themeStyles.container}>
      <ScrollView>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
          <View style={styles.sectionContent}>
            <SettingsListItem
              title="Profile Information"
              description="Edit your profile details"
              icon="person-outline"
              onPress={() => navigation.navigate('EditProfile')}
              disabled={isGuest}
              colors={colors}
            />
            <SettingsListItem
              title="Privacy Settings"
              description="Manage your privacy preferences"
              icon="shield-outline"
              onPress={() => navigation.navigate('PrivacySettings')}
              disabled={isGuest}
              colors={colors}
            />
            <SettingsListItem
              title="Notification Settings"
              description="Control how you receive notifications"
              icon="notifications-outline"
              onPress={() => navigation.navigate('NotificationSettings')}
              disabled={isGuest}
              colors={colors}
            />
            <SettingsListItem
              title="Security Settings"
              description="Password, two-factor authentication"
              icon="lock-closed-outline"
              onPress={() => navigation.navigate('SecuritySettings')}
              disabled={isGuest}
              colors={colors}
            />
          </View>
        </View>

        {/* App Settings Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>App Settings</Text>
          <View style={styles.sectionContent}>
            <SettingsSwitchItem
              title="Dark Mode"
              description="Switch between light and dark themes"
              icon="moon-outline"
              value={isDarkMode}
              onValueChange={handleToggleDarkMode}
              colors={colors}
            />
            <SettingsSwitchItem
              title="Autoplay Media"
              description="Automatically play videos and animations"
              icon="play-outline"
              value={true} // TODO: Replace with actual state value
              onValueChange={handleToggleAutoplay}
              colors={colors}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Support</Text>
          <View style={styles.sectionContent}>
            <SettingsListItem
              title="Help Center"
              description="Get help with Fantasy AI"
              icon="help-circle-outline"
              onPress={navigateToHelpCenter}
              colors={colors}
            />
            <SettingsListItem
              title="Report a Problem"
              description="Let us know about any issues"
              icon="bug-outline"
              onPress={navigateToReportProblem}
              colors={colors}
            />
            <SettingsListItem
              title="Terms of Service"
              description="Review our terms and conditions"
              icon="document-text-outline"
              onPress={navigateToTerms}
              colors={colors}
            />
            <SettingsListItem
              title="Privacy Policy"
              description="Learn how we handle your data"
              icon="shield-checkmark-outline"
              onPress={navigateToPrivacyPolicy}
              colors={colors}
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
          <View style={styles.sectionContent}>
            <SettingsListItem
              title="Version"
              description="1.0.0"
              icon="information-circle-outline"
              onPress={() => {}}
              disabled={true}
              colors={colors}
            />
          </View>
        </View>

        {/* Guest Prompt */}
        {isGuest && (
          <View style={[styles.guestMessageContainer, { backgroundColor: colors.tileBg }]}>
            <Text style={[styles.guestMessage, { color: colors.secondaryText }]}>
              Create an account to access all settings and customize your experience.
            </Text>
            <TouchableOpacity
              style={[themeStyles.primaryButton, { paddingVertical: 10 }]}
              onPress={() => navigation.navigate('Login')}
              accessibilityRole="button"
              accessibilityLabel="Create Account"
            >
              <Text style={themeStyles.primaryButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Subcomponents ---
const SettingsListItem: React.FC<SettingsListItemProps> = ({
  title,
  description,
  icon,
  onPress,
  disabled = false,
  colors,
}) => (
  <TouchableOpacity
    style={[
      styles.settingItem, 
      { borderBottomColor: colors.border },
      disabled && styles.settingItemDisabled
    ]}
    onPress={onPress}
    disabled={disabled}
    accessibilityLabel={title}
    accessibilityHint={description}
    accessibilityState={{ disabled }}
  >
    {icon && (
      <Ionicons 
        name={icon} 
        size={24} 
        color={colors.icon} 
        style={styles.settingIcon} 
      />
    )}
    <View style={styles.settingContent}>
      <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.settingDescription, { color: colors.secondaryText }]}>{description}</Text>
    </View>
    {!disabled && <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />}
  </TouchableOpacity>
);

const SettingsSwitchItem: React.FC<SettingsSwitchItemProps> = ({
  title,
  description,
  icon,
  value,
  onValueChange,
  disabled = false,
  colors,
}) => (
  <View style={[
    styles.settingItem, 
    { borderBottomColor: colors.border },
    disabled && styles.settingItemDisabled
  ]}>
    {icon && (
      <Ionicons 
        name={icon} 
        size={24} 
        color={colors.icon} 
        style={styles.settingIcon} 
      />
    )}
    <View style={styles.settingContent}>
      <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.settingDescription, { color: colors.secondaryText }]}>{description}</Text>
    </View>
    <Switch
      trackColor={{ false: colors.border, true: colors.primary }}
      thumbColor={value ? "#FFFFFF" : "#D1D5DB"}
      ios_backgroundColor={colors.border}
      onValueChange={onValueChange}
      value={value}
      disabled={disabled}
      accessibilityLabel={title}
    />
  </View>
);

// --- Styles ---
const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionContent: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingIcon: {
    marginRight: 16,
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
  settingContent: {
    flex: 1,
    marginRight: 8,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  guestMessageContainer: {
    margin: 16,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  guestMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
});