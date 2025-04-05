import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  Alert,
  ActivityIndicator, // Added for loading states
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types/navigation';

// --- Types ---

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Placeholder type for session data - replace with actual structure from API
interface ActiveSession {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

type SecuritySettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'SecuritySettings'>;

// --- Subcomponents ---

// SettingRow for the 2FA toggle
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

// Two-Factor Authentication Section
interface TwoFactorAuthSectionProps {
  twoFactorEnabled: boolean;
  showSetupTwoFactor: boolean;
  onToggleTwoFactor: () => void;
  onSetupTwoFactor: () => void;
  isToggling2FA: boolean; // Loading state for toggle/setup
}

const TwoFactorAuthSection: React.FC<TwoFactorAuthSectionProps> = ({
  twoFactorEnabled,
  showSetupTwoFactor,
  onToggleTwoFactor,
  onSetupTwoFactor,
  isToggling2FA,
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Account Security</Text>
    <SettingRow
      title="Two-Factor Authentication"
      description="Add an extra layer of security to your account"
      value={twoFactorEnabled}
      onValueChange={onToggleTwoFactor}
      disabled={isToggling2FA} // Disable while processing
    />
    {showSetupTwoFactor && !twoFactorEnabled && ( // Only show setup if not enabled yet
      <View style={styles.setupContainer}>
        <Text style={styles.setupText}>
          Two-factor authentication adds an extra layer of security. When enabled, you'll need a code from your authenticator app when signing in.
        </Text>
        {/* TODO: Replace with actual QR code component */}
        <View style={styles.qrCodePlaceholder}>
          <Text style={styles.qrCodeText}>QR Code Placeholder</Text>
          <Text style={styles.qrCodeSubtext}>Scan this code with your authenticator app</Text>
        </View>
        <TouchableOpacity
          style={[styles.setupButton, isToggling2FA && styles.disabledButton]}
          onPress={onSetupTwoFactor}
          disabled={isToggling2FA}
        >
          {isToggling2FA ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.setupButtonText}>Complete Setup</Text>
          )}
        </TouchableOpacity>
      </View>
    )}
  </View>
);

// Change Password Form Section
interface ChangePasswordFormProps {
  passwordData: PasswordData;
  onPasswordInputChange: (field: keyof PasswordData, value: string) => void;
  onChangePassword: () => void;
  isChangingPassword: boolean;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
  passwordData,
  onPasswordInputChange,
  onChangePassword,
  isChangingPassword,
}) => {
  const [showPasswords, setShowPasswords] = useState(false);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Change Password</Text>
      <View style={styles.passwordContainer}>
        <View style={styles.passwordHeader}>
          <Text style={styles.passwordHeaderText}>Update your password</Text>
          <TouchableOpacity onPress={() => setShowPasswords(prev => !prev)}>
            <Text style={styles.showPasswordText}>{showPasswords ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Current Password</Text>
          <TextInput
            style={styles.input}
            value={passwordData.currentPassword}
            onChangeText={(text) => onPasswordInputChange('currentPassword', text)}
            placeholder="Enter current password"
            placeholderTextColor="#999"
            secureTextEntry={!showPasswords}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>New Password</Text>
          <TextInput
            style={styles.input}
            value={passwordData.newPassword}
            onChangeText={(text) => onPasswordInputChange('newPassword', text)}
            placeholder="Enter new password (min 8 characters)"
            placeholderTextColor="#999"
            secureTextEntry={!showPasswords}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            value={passwordData.confirmPassword}
            onChangeText={(text) => onPasswordInputChange('confirmPassword', text)}
            placeholder="Confirm new password"
            placeholderTextColor="#999"
            secureTextEntry={!showPasswords}
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={[styles.changePasswordButton, isChangingPassword && styles.disabledButton]}
          onPress={onChangePassword}
          disabled={isChangingPassword}
        >
          {isChangingPassword ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.changePasswordButtonText}>Change Password</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Active Sessions Section
interface ActiveSessionsSectionProps {
  sessions: ActiveSession[]; // Use placeholder data for now
  onLogoutSession: (sessionId: string) => void;
  onLogoutAllSessions: () => void;
}

const ActiveSessionsSection: React.FC<ActiveSessionsSectionProps> = ({
  sessions,
  onLogoutSession,
  onLogoutAllSessions,
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Active Sessions</Text>
    {/* TODO: Replace with actual session data mapping */}
    {sessions.map((session) => (
      <View key={session.id} style={styles.sessionItem}>
        <View>
          <Text style={styles.sessionDevice}>{session.device}</Text>
          <Text style={styles.sessionDetails}>{session.location} • {session.lastActive}</Text>
        </View>
        {session.isCurrent ? (
          <Text style={styles.sessionCurrent}>Current</Text>
        ) : (
          <TouchableOpacity onPress={() => onLogoutSession(session.id)}>
            <Text style={styles.sessionLogout}>Log out</Text>
          </TouchableOpacity>
        )}
      </View>
    ))}
    {sessions.length > 1 && ( // Only show if more than one session exists
      <TouchableOpacity style={styles.logoutAllButton} onPress={onLogoutAllSessions}>
        <Text style={styles.logoutAllText}>Log Out Of All Other Devices</Text>
      </TouchableOpacity>
    )}
  </View>
);

// Danger Zone Section
interface DangerZoneSectionProps {
  onDeleteAccount: () => void;
  isDeletingAccount: boolean;
}

const DangerZoneSection: React.FC<DangerZoneSectionProps> = ({ onDeleteAccount, isDeletingAccount }) => (
  <View style={styles.dangerSection}>
    <Text style={styles.dangerTitle}>Danger Zone</Text>
    <TouchableOpacity
      style={[styles.deleteButton, isDeletingAccount && styles.disabledButton]}
      onPress={onDeleteAccount}
      disabled={isDeletingAccount}
    >
      {isDeletingAccount ? (
        <ActivityIndicator size="small" color="#FF3B30" />
      ) : (
        <Text style={styles.deleteButtonText}>Delete Account</Text>
      )}
    </TouchableOpacity>
  </View>
);


// --- Main Component ---

// TODO: Fetch initial security settings (like 2FA status) and active sessions
const PLACEHOLDER_SESSIONS: ActiveSession[] = [
  { id: '1', device: 'iPhone 14 Pro', location: 'San Francisco, CA', lastActive: 'Active now', isCurrent: true },
  { id: '2', device: 'MacBook Pro', location: 'San Francisco, CA', lastActive: '2 days ago', isCurrent: false },
];

export const SecuritySettingsScreen: React.FC<SecuritySettingsScreenProps> = ({ navigation }) => {
  const { isGuest, user } = useAuth(); // Assuming user object needed for API calls

  // State
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(false); // TODO: Fetch initial state
  const [showSetupTwoFactor, setShowSetupTwoFactor] = useState<boolean>(false);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>(PLACEHOLDER_SESSIONS); // TODO: Fetch real sessions

  // Loading States
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [isToggling2FA, setIsToggling2FA] = useState<boolean>(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState<boolean>(false);
  // Add loading states for session logout if needed

  // --- Handlers ---

  // 2FA Handlers
  const handleToggleTwoFactor = useCallback(() => {
    if (isToggling2FA) return;

    if (!twoFactorEnabled) {
      // Show setup UI immediately, actual enabling happens on 'Complete Setup'
      setShowSetupTwoFactor(true);
    } else {
      // Ask for confirmation before disabling
      Alert.alert(
        "Disable Two-Factor Authentication",
        "Are you sure? This will make your account less secure.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Disable",
            style: "destructive",
            onPress: async () => {
              setIsToggling2FA(true);
              // TODO: Implement API call to userService.disableTwoFactor(user?.id)
              try {
                // await userService.disableTwoFactor(user?.id);
                setTwoFactorEnabled(false);
                setShowSetupTwoFactor(false); // Hide setup if it was somehow visible
                Alert.alert("2FA Disabled", "Two-Factor Authentication has been disabled.");
              } catch (error) {
                console.error("Failed to disable 2FA:", error);
                Alert.alert("Error", "Could not disable 2FA. Please try again.");
              } finally {
                setIsToggling2FA(false);
              }
            },
          },
        ]
      );
    }
  }, [twoFactorEnabled, isToggling2FA]);
  
  const handleSetupTwoFactor = useCallback(async () => {
    if (isToggling2FA) return;
    setIsToggling2FA(true);
    // TODO: Implement API call to userService.enableTwoFactor(user?.id, verificationCode)
    // This would likely involve verifying a code entered by the user after scanning the QR
    try {
      // await userService.enableTwoFactor(user?.id, /* verificationCode */);
      setTwoFactorEnabled(true);
      setShowSetupTwoFactor(false);
      Alert.alert("2FA Enabled", "Two-Factor Authentication is now active.");
    } catch (error) {
      console.error("Failed to enable 2FA:", error);
      Alert.alert("Error", "Could not enable 2FA. Please verify the code and try again.");
    } finally {
      setIsToggling2FA(false);
    }
  }, [isToggling2FA]);
  
  // Password Handlers
  const handleChangePassword = useCallback(async () => {
    if (isChangingPassword) return;

    // Basic Client-Side Validation
    if (!passwordData.currentPassword) {
      Alert.alert("Validation Error", "Please enter your current password.");
      return;
    }
    if (passwordData.newPassword.length < 8) {
      Alert.alert("Validation Error", "New password must be at least 8 characters long.");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert("Validation Error", "New passwords do not match.");
      return;
    }
    if (passwordData.newPassword === passwordData.currentPassword) {
       Alert.alert("Validation Error", "New password cannot be the same as the current password.");
       return;
    }

    setIsChangingPassword(true);
    // TODO: Implement API call to userService.changePassword(user?.id, passwordData)
    console.log("Changing password with data:", passwordData);
    try {
      // await userService.changePassword(user?.id, passwordData);
      Alert.alert(
        "Password Changed",
        "Your password has been successfully updated.",
        [{ text: "OK" }]
      );
      // Clear fields on success
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) { // Catch specific error types if possible
      console.error("Failed to change password:", error);
      // Provide more specific feedback if the API returns error codes/messages
      const errorMessage = error?.message || "Could not change password. Please check your current password and try again.";
      Alert.alert("Change Password Failed", errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  }, [passwordData, isChangingPassword]);
  
  const handlePasswordInputChange = useCallback((field: keyof PasswordData, value: string) => {
    setPasswordData(prevData => ({
      ...prevData,
      [field]: value,
    }));
  }, []);

  // Session Handlers (Placeholders)
  const handleLogoutSession = useCallback(async (sessionId: string) => {
    // TODO: Implement API call to userService.logoutSession(user?.id, sessionId)
    Alert.alert("Log Out Session", `Request to log out session ${sessionId}. (Not implemented)`);
    // On success, update the activeSessions state:
    // setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
  }, []);

  const handleLogoutAllSessions = useCallback(async () => {
    // TODO: Implement API call to userService.logoutAllOtherSessions(user?.id)
    Alert.alert("Log Out All Devices", "Request to log out all other devices. (Not implemented)");
     // On success, update the activeSessions state:
    // setActiveSessions(prev => prev.filter(s => s.isCurrent));
  }, []);

  // Account Deletion Handler
  const handleDeleteAccount = useCallback(() => {
     if (isDeletingAccount) return;

     Alert.alert(
       "Delete Account",
       "Are you absolutely sure you want to delete your account? This action is permanent and cannot be undone.",
       [
         { text: "Cancel", style: "cancel" },
         {
           text: "Delete My Account",
           style: "destructive",
           onPress: async () => {
             setIsDeletingAccount(true);
             // TODO: Implement API call to userService.deleteAccount(user?.id)
             try {
                // await userService.deleteAccount(user?.id);
                Alert.alert("Account Deletion Requested", "Your account deletion process has started. You will be logged out.");
                // TODO: Trigger logout logic from AuthContext
                // authContext.logout();
             } catch (error) {
                console.error("Failed to delete account:", error);
                Alert.alert("Deletion Failed", "Could not delete your account. Please try again or contact support.");
             } finally {
                setIsDeletingAccount(false);
             }
           },
         },
       ]
     );
  }, [isDeletingAccount]); // Add dependencies like authContext.logout if used
  
  if (isGuest) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.guestContainer}>
          <Text style={styles.guestTitle}>Guest Account</Text>
          <Text style={styles.guestText}>
            You need to create an account to access security settings.
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
        <TwoFactorAuthSection
          twoFactorEnabled={twoFactorEnabled}
          showSetupTwoFactor={showSetupTwoFactor}
          onToggleTwoFactor={handleToggleTwoFactor}
          onSetupTwoFactor={handleSetupTwoFactor}
          isToggling2FA={isToggling2FA}
        />
        
        <ChangePasswordForm
          passwordData={passwordData}
          onPasswordInputChange={handlePasswordInputChange}
          onChangePassword={handleChangePassword}
          isChangingPassword={isChangingPassword}
        />
        
        <ActiveSessionsSection
          sessions={activeSessions} // Use fetched or placeholder data
          onLogoutSession={handleLogoutSession}
          onLogoutAllSessions={handleLogoutAllSessions}
        />
        
        <DangerZoneSection
          onDeleteAccount={handleDeleteAccount}
          isDeletingAccount={isDeletingAccount}
        />
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
    paddingBottom: 16,
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
    paddingVertical: 12, // Keep padding for touch area
  },
  disabledItem: {
    opacity: 0.5,
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
  setupContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  setupText: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 16,
    lineHeight: 20,
  },
  qrCodePlaceholder: {
    backgroundColor: '#E0E0E0',
    height: 180,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  qrCodeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
  },
  qrCodeSubtext: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
  },
  setupButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 44, // Ensure minimum touch target size
  },
  setupButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  passwordContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  passwordHeaderText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  showPasswordText: {
    fontSize: 14,
    color: '#0070F3',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333333',
  },
  changePasswordButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 44, // Ensure minimum touch target size
  },
  changePasswordButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sessionDevice: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  sessionDetails: {
    fontSize: 14,
    color: '#666666',
  },
  sessionCurrent: {
    fontSize: 14,
    color: '#0070F3',
    fontWeight: '500',
  },
  sessionLogout: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
  logoutAllButton: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
    minHeight: 44, // Ensure minimum touch target size
  },
  logoutAllText: {
    color: '#FF3B30',
    fontWeight: '600',
    fontSize: 16,
  },
  dangerSection: {
    marginTop: 24,
    marginBottom: 40,
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 16,
  },
  deleteButton: {
    backgroundColor: '#FFF1F0',
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 44, // Ensure minimum touch target size
  },
  deleteButtonText: {
    color: '#FF3B30',
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
  disabledButton: {
    opacity: 0.6,
    backgroundColor: '#A0A0A0', // Example disabled background color
  },
});