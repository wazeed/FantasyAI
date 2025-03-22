import React, { useState } from 'react';
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
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function SecuritySettingsScreen({ navigation }) {
  const { isGuest } = useAuth();
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [showPasswords, setShowPasswords] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showSetupTwoFactor, setShowSetupTwoFactor] = useState(false);
  
  const toggleTwoFactor = () => {
    if (!twoFactorEnabled) {
      setShowSetupTwoFactor(true);
    } else {
      Alert.alert(
        "Disable Two-Factor Authentication",
        "Are you sure you want to disable two-factor authentication? This will make your account less secure.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Disable", 
            style: "destructive",
            onPress: () => {
              setTwoFactorEnabled(false);
              setShowSetupTwoFactor(false);
              Alert.alert("Two-Factor Authentication Disabled", "Your account is now less secure.");
            } 
          }
        ]
      );
    }
  };
  
  const setupTwoFactor = () => {
    // In a real app, this would initiate the 2FA setup process
    Alert.alert(
      "Two-Factor Authentication Enabled",
      "Your account is now more secure with 2FA.",
      [{ text: "OK", onPress: () => {
        setTwoFactorEnabled(true);
        setShowSetupTwoFactor(false);
      }}]
    );
  };
  
  const handleChangePassword = () => {
    // Validation
    if (passwordData.currentPassword.length === 0) {
      Alert.alert("Error", "Please enter your current password");
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      Alert.alert("Error", "New password must be at least 8 characters");
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }
    
    // In a real app, this would send the password change to the server
    Alert.alert(
      "Password Changed",
      "Your password has been successfully updated.",
      [{ text: "OK", onPress: () => {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }}]
    );
  };
  
  const updatePasswordField = (field, value) => {
    setPasswordData({
      ...passwordData,
      [field]: value
    });
  };
  
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Security</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Two-Factor Authentication</Text>
              <Text style={styles.settingDescription}>
                Add an extra layer of security to your account
              </Text>
            </View>
            <Switch
              trackColor={{ false: '#E0E0E0', true: '#000000' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E0E0E0"
              onValueChange={toggleTwoFactor}
              value={twoFactorEnabled}
            />
          </View>
          
          {showSetupTwoFactor && (
            <View style={styles.setupContainer}>
              <Text style={styles.setupText}>
                Two-factor authentication adds an extra layer of security to your account.
                When enabled, you'll need to enter a code from your authenticator app
                when signing in, in addition to your password.
              </Text>
              <View style={styles.qrCodePlaceholder}>
                <Text style={styles.qrCodeText}>QR Code Placeholder</Text>
                <Text style={styles.qrCodeSubtext}>
                  Scan this code with your authenticator app
                </Text>
              </View>
              <TouchableOpacity
                style={styles.setupButton}
                onPress={setupTwoFactor}
              >
                <Text style={styles.setupButtonText}>Complete Setup</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Change Password</Text>
          
          <View style={styles.passwordContainer}>
            <View style={styles.passwordHeader}>
              <Text style={styles.passwordHeaderText}>Update your password</Text>
              <TouchableOpacity onPress={() => setShowPasswords(!showPasswords)}>
                <Text style={styles.showPasswordText}>
                  {showPasswords ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                style={styles.input}
                value={passwordData.currentPassword}
                onChangeText={(text) => updatePasswordField('currentPassword', text)}
                placeholder="Enter current password"
                placeholderTextColor="#999"
                secureTextEntry={!showPasswords}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.input}
                value={passwordData.newPassword}
                onChangeText={(text) => updatePasswordField('newPassword', text)}
                placeholder="Enter new password"
                placeholderTextColor="#999"
                secureTextEntry={!showPasswords}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                value={passwordData.confirmPassword}
                onChangeText={(text) => updatePasswordField('confirmPassword', text)}
                placeholder="Confirm new password"
                placeholderTextColor="#999"
                secureTextEntry={!showPasswords}
              />
            </View>
            
            <TouchableOpacity
              style={styles.changePasswordButton}
              onPress={handleChangePassword}
            >
              <Text style={styles.changePasswordButtonText}>Change Password</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Sessions</Text>
          
          <View style={styles.sessionItem}>
            <View>
              <Text style={styles.sessionDevice}>iPhone 14 Pro</Text>
              <Text style={styles.sessionDetails}>San Francisco, CA • Active now</Text>
            </View>
            <Text style={styles.sessionCurrent}>Current</Text>
          </View>
          
          <View style={styles.sessionItem}>
            <View>
              <Text style={styles.sessionDevice}>MacBook Pro</Text>
              <Text style={styles.sessionDetails}>San Francisco, CA • 2 days ago</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.sessionLogout}>Log out</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.logoutAllButton}>
            <Text style={styles.logoutAllText}>Log Out Of All Devices</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.dangerSection}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => {
              Alert.alert(
                "Delete Account",
                "Are you sure you want to delete your account? This action cannot be undone.",
                [
                  { text: "Cancel", style: "cancel" },
                  { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: () => Alert.alert("Account Deletion", "Your account deletion request has been received.") 
                  }
                ]
              );
            }}
          >
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </TouchableOpacity>
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
}); 