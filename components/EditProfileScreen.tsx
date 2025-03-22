import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

// Placeholder profile data - would normally be fetched from the server
const INITIAL_PROFILE_DATA = {
  username: 'johnsmith',
  displayName: 'John Smith',
  bio: 'Fantasy AI enthusiast and avid storyteller. I love creating unique character interactions and exploring different narratives.',
  location: 'San Francisco, CA',
  email: 'john.smith@example.com',
  phone: '+1 (555) 123-4567',
  interests: ['AI Characters', 'Storytelling', 'Science Fiction', 'Fantasy Worlds', 'Interactive Fiction'],
};

export default function EditProfileScreen({ navigation }) {
  const { isGuest } = useAuth();
  const [profileData, setProfileData] = useState({ ...INITIAL_PROFILE_DATA });
  const [newInterest, setNewInterest] = useState('');

  const handleSave = () => {
    // In a real app, this would send the updated profile data to the server
    Alert.alert(
      "Profile Updated", 
      "Your profile has been successfully updated.",
      [{ text: "OK", onPress: () => navigation.goBack() }]
    );
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleAddInterest = () => {
    if (newInterest.trim() === '') return;
    
    setProfileData({
      ...profileData,
      interests: [...profileData.interests, newInterest.trim()]
    });
    
    setNewInterest('');
  };

  const handleRemoveInterest = (index) => {
    const updatedInterests = [...profileData.interests];
    updatedInterests.splice(index, 1);
    
    setProfileData({
      ...profileData,
      interests: updatedInterests
    });
  };

  const updateField = (field, value) => {
    setProfileData({
      ...profileData,
      [field]: value
    });
  };

  const renderInterestItem = (interest, index) => (
    <View key={index} style={styles.interestItem}>
      <Text style={styles.interestText}>{interest}</Text>
      <TouchableOpacity 
        onPress={() => handleRemoveInterest(index)}
        style={styles.removeInterestButton}
      >
        <Text style={styles.removeInterestText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  if (isGuest) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.guestContainer}>
          <Text style={styles.guestTitle}>Guest Account</Text>
          <Text style={styles.guestText}>
            You're currently using Fantasy AI as a guest. Create an account to set up and customize your profile.
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.profileImageSection}>
            <Image
              source={require('../assets/profile-placeholder.png')}
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.changePhotoButton}>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.input}
                value={profileData.username}
                onChangeText={(text) => updateField('username', text)}
                placeholder="Username"
                placeholderTextColor="#999"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Display Name</Text>
              <TextInput
                style={styles.input}
                value={profileData.displayName}
                onChangeText={(text) => updateField('displayName', text)}
                placeholder="Display Name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={profileData.bio}
                onChangeText={(text) => updateField('bio', text)}
                placeholder="Tell us about yourself..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                style={styles.input}
                value={profileData.location}
                onChangeText={(text) => updateField('location', text)}
                placeholder="City, Country"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={profileData.email}
                onChangeText={(text) => updateField('email', text)}
                placeholder="Email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                value={profileData.phone}
                onChangeText={(text) => updateField('phone', text)}
                placeholder="Phone Number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Interests</Text>
            
            <View style={styles.interestsContainer}>
              {profileData.interests.map(renderInterestItem)}
            </View>

            <View style={styles.addInterestContainer}>
              <TextInput
                style={styles.addInterestInput}
                value={newInterest}
                onChangeText={setNewInterest}
                placeholder="Add a new interest"
                placeholderTextColor="#999"
                returnKeyType="done"
                onSubmitEditing={handleAddInterest}
              />
              <TouchableOpacity 
                style={styles.addInterestButton}
                onPress={handleAddInterest}
              >
                <Text style={styles.addInterestText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
  profileImageSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F0F0',
    marginBottom: 12,
  },
  changePhotoButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changePhotoText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
  formSection: {
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
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333333',
  },
  multilineInput: {
    minHeight: 100,
    paddingTop: 12,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  interestItem: {
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  interestText: {
    fontSize: 14,
    color: '#333333',
  },
  removeInterestButton: {
    marginLeft: 8,
  },
  removeInterestText: {
    fontSize: 18,
    color: '#666666',
  },
  addInterestContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addInterestInput: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333333',
    marginRight: 8,
  },
  addInterestButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  addInterestText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 40,
  },
  saveButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333333',
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