import React, { useState, useCallback } from 'react';
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
// Assuming Stack Navigator is used, adjust if different
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types/navigation'; // Use the correct exported type

// --- Types ---

interface UserProfile {
  username: string;
  displayName: string;
  bio: string;
  location: string;
  email: string;
  phone: string;
  interests: string[];
  profileImageUrl?: string | null; // Add optional profile image URL
}

type EditProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'EditProfile'>; // Use RootStackParamList

// --- Constants ---

// Placeholder profile data - In a real app, this would be fetched via userService
// potentially using useEffect and useState for loading/error states.
const INITIAL_PROFILE_DATA = {
  username: 'johnsmith',
  displayName: 'John Smith',
  bio: 'Fantasy AI enthusiast and avid storyteller. I love creating unique character interactions and exploring different narratives.',
  location: 'San Francisco, CA',
  email: 'john.smith@example.com',
  phone: '+1 (555) 123-4567',
  interests: ['AI Characters', 'Storytelling', 'Science Fiction', 'Fantasy Worlds', 'Interactive Fiction'],
};

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const { isGuest, user } = useAuth(); // Assuming user object holds profile data source
  
  // TODO: Fetch initial profile data from userService based on user?.id
  // Example: const { data: initialData, isLoading, error } = useFetchUserProfile(user?.id);
  const [profileData, setProfileData] = useState<UserProfile>({ ...INITIAL_PROFILE_DATA });
  const [newInterest, setNewInterest] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false); // Add saving state

  // --- Handlers ---

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    // TODO: Implement actual API call to userService.updateProfile(user?.id, profileData)
    // Handle loading state and potential errors from the API call.
    console.log("Saving profile data:", profileData);
    try {
      // const updatedProfile = await userService.updateProfile(user?.id, profileData);
      // Optionally update local context/state with updatedProfile
      Alert.alert(
        "Profile Updated",
        "Your profile has been successfully updated.", // In real app, use success message from API
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error("Failed to save profile:", error);
      Alert.alert("Save Failed", "Could not update your profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [profileData, navigation, isSaving]); // Add dependencies

  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleAddInterest = useCallback(() => {
    const trimmedInterest = newInterest.trim();
    if (trimmedInterest === '' || profileData.interests.includes(trimmedInterest)) {
      // Prevent adding empty or duplicate interests
      setNewInterest(''); // Clear input even if not added
      return;
    }
    
    setProfileData(prevData => ({
      ...prevData,
      interests: [...prevData.interests, trimmedInterest]
    }));
    
    setNewInterest('');
  }, [newInterest, profileData.interests]);

  const handleRemoveInterest = useCallback((indexToRemove: number) => {
    setProfileData(prevData => ({
      ...prevData,
      interests: prevData.interests.filter((_, index) => index !== indexToRemove)
    }));
  }, []);

  // Use useCallback to prevent unnecessary re-creation of the handler on each render
  const handleInputChange = useCallback((field: keyof UserProfile, value: string) => {
     // Basic validation could be added here per field if needed
    setProfileData(prevData => ({
      ...prevData,
      [field]: value
    }));
  }, []);

  // --- Render Functions ---

  // Use useCallback if this function relies on props/state that don't change often,
  // but given it uses index and interest directly, it's likely fine without it unless performance issues arise.
  const renderInterestItem = (interest: string, index: number) => (
    <View key={`${interest}-${index}`} style={styles.interestItem}>
      {/* Use a more stable key if possible, e.g., if interests had IDs */}
      <Text style={styles.interestText}>{interest}</Text>
      <TouchableOpacity
        onPress={() => handleRemoveInterest(index)}
        style={styles.removeInterestButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Increase touch area
      >
        <Text style={styles.removeInterestText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  // --- Conditional Rendering ---

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
              // TODO: Replace with actual user profile image URI if available
              source={profileData.profileImageUrl ? { uri: profileData.profileImageUrl } : require('../assets/profile-placeholder.png')}
              style={styles.profileImage}
            />
            {/* TODO: Implement image picker functionality */}
            <TouchableOpacity style={styles.changePhotoButton} onPress={() => Alert.alert("Feature Not Implemented", "Changing profile photo is not yet available.")}>
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
                onChangeText={(text) => handleInputChange('username', text)}
                placeholder="Enter your username"
                placeholderTextColor="#999"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Display Name</Text>
              <TextInput
                style={styles.input}
                value={profileData.displayName}
                onChangeText={(text) => handleInputChange('displayName', text)}
                placeholder="Enter your display name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={profileData.bio}
                onChangeText={(text) => handleInputChange('bio', text)}
                placeholder="Write a short bio..."
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
                onChangeText={(text) => handleInputChange('location', text)}
                placeholder="Enter your location"
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
                onChangeText={(text) => handleInputChange('email', text)}
                placeholder="Enter your email address"
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
                onChangeText={(text) => handleInputChange('phone', text)}
                placeholder="Enter your phone number"
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
              disabled={isSaving} // Disable button while saving
            >
              <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
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