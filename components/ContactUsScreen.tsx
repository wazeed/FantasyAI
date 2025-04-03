import React, { useState, useContext, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ActivityIndicator, // Added for loading state
} from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/navigation'; // Adjust path as needed

// --- Constants ---
const MIN_MESSAGE_LENGTH = 15; // Define minimum message length

// --- Interfaces ---

interface ContactCategory {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

// --- Static Data ---

const CONTACT_CATEGORIES: ContactCategory[] = [
  { id: 'general', label: 'General Inquiry', icon: 'help-circle-outline' },
  { id: 'technical', label: 'Technical Support', icon: 'construct-outline' },
  { id: 'account', label: 'Account Help', icon: 'person-outline' },
  { id: 'billing', label: 'Billing Question', icon: 'card-outline' },
  { id: 'feature', label: 'Feature Suggestion', icon: 'bulb-outline' },
];

// --- Helper Functions ---

function isValidEmail(email: string): boolean {
  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// --- Helper Components ---

interface CategoryButtonProps {
  category: ContactCategory;
  isSelected: boolean;
  onPress: (id: string) => void;
  colors: Record<string, string>;
}

function CategoryButton({ category, isSelected, onPress, colors }: CategoryButtonProps) {
  return (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryButton,
        {
          backgroundColor: isSelected ? colors.primary : colors.card,
          borderColor: isSelected ? colors.primary : colors.border
        }
      ]}
      onPress={() => onPress(category.id)}
      activeOpacity={0.7}
    >
      <Ionicons
        name={category.icon}
        size={20}
        color={isSelected ? '#FFFFFF' : colors.accent}
        style={styles.categoryIcon}
      />
      <Text
        style={[
          styles.categoryButtonText,
          { color: isSelected ? '#FFFFFF' : colors.text }
        ]}
      >
        {category.label}
      </Text>
    </TouchableOpacity>
  );
}

// --- Main Component ---

type ContactUsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ContactUs'>;

interface ContactUsScreenProps {
  navigation: ContactUsScreenNavigationProp;
}

export default function ContactUsScreen({ navigation }: ContactUsScreenProps) {
  const themeContext = useContext(ThemeContext);
  if (!themeContext) {
    // Handle case where context is not provided, though this shouldn't happen in a well-structured app
    throw new Error("ThemeContext must be used within a ThemeProvider");
  }
  const { isDarkMode } = themeContext;

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Dynamic colors based on theme
  const colors = useMemo(() => ({
    background: isDarkMode ? '#121212' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    subText: isDarkMode ? '#AAAAAA' : '#666666',
    inputBackground: isDarkMode ? '#2C2C2E' : '#F5F5F5', // Specific input background
    border: isDarkMode ? '#333333' : '#E0E0E0',
    primary: isDarkMode ? '#3D8CFF' : '#4F46E5',
    accent: isDarkMode ? '#3D8CFF' : '#4F46E5',
    card: isDarkMode ? '#1E1E1E' : '#F9F9F9',
    iconBackground: isDarkMode ? 'rgba(61, 140, 255, 0.2)' : 'rgba(79, 70, 229, 0.1)', // Adjusted alpha
    error: '#FF3B30',
    buttonText: '#FFFFFF',
    disabled: isDarkMode ? '#444444' : '#CCCCCC', // Color for disabled button background
  }), [isDarkMode]);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!selectedCategory) errors.push('- Select a category');
    if (message.trim().length < MIN_MESSAGE_LENGTH) errors.push(`- Provide a message of at least ${MIN_MESSAGE_LENGTH} characters`);
    if (email.trim().length === 0) errors.push('- Enter your email address');
    else if (!isValidEmail(email)) errors.push('- Enter a valid email address');
    return errors;
  }, [selectedCategory, message, email]);

  const isFormValid = validationErrors.length === 0;

  const handleSelectCategory = useCallback((id: string) => {
    setSelectedCategory(id);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!isFormValid || isSubmitting) {
      if (!isFormValid) {
        const errorMessage = `Please check the following:\n${validationErrors.join('\n')}`;
        Alert.alert("Form Incomplete", errorMessage, [{ text: "OK" }]);
      }
      return;
    }

    setIsSubmitting(true);

    // --- Simulate API Call ---
    // In a real app, replace this with your API call logic
    // Example:
    // try {
    //   await apiService.submitContactForm({ category: selectedCategory, message, email });
    //   Alert.alert(
    //     "Message Sent",
    //     "Thank you for contacting us. We'll get back to you soon.",
    //     [{ text: "OK", onPress: () => navigation.goBack() }]
    //   );
    // } catch (error) {
    //   console.error("Contact form submission error:", error);
    //   Alert.alert("Submission Failed", "Could not send message. Please try again later.");
    // } finally {
    //   setIsSubmitting(false);
    // }
    // -------------------------

    // Placeholder simulation
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

    setIsSubmitting(false);
    Alert.alert(
      "Message Sent",
      "Thank you for contacting us. We'll get back to you as soon as possible.",
      [{ text: "OK", onPress: () => navigation.goBack() }]
    );
    // Reset form? Optional.
    // setSelectedCategory('');
    // setMessage('');
    // setEmail('');

  }, [isFormValid, isSubmitting, validationErrors, selectedCategory, message, email, navigation]);

  const handleOpenMail = useCallback(() => {
    Linking.openURL('mailto:support@fantasyai.com').catch(err => {
      console.error("Failed to open mail app:", err);
      Alert.alert("Error", "Could not open email app.");
    });
  }, []);

  const navigateToHelpCenter = useCallback(() => {
    navigation.navigate('HelpCenter', undefined);
  }, [navigation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} // 'height' can be problematic
        style={styles.keyboardAvoidView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0} // Adjust offset if needed
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerContainer}>
            <Text style={[styles.headerText, { color: colors.text }]}>Contact Support</Text>
            <Text style={[styles.subHeaderText, { color: colors.subText }]}>
              Have a question or need help? We're here for you.
            </Text>
          </View>

          {/* Info Card */}
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.accent }]}>
            <View style={styles.infoCardContent}>
              <Ionicons name="time-outline" size={24} color={colors.accent} style={styles.infoCardIcon} />
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoText, { color: colors.subText }]}>
                  Our support team typically responds within 24-48 hours on business days.
                </Text>
              </View>
            </View>
          </View>

          {/* Category Selection */}
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>What can we help you with?</Text>
            <Text style={[styles.sectionDescription, { color: colors.subText }]}>
              Select a category below
            </Text>
            <View style={styles.categoriesContainer}>
              {CONTACT_CATEGORIES.map((category) => (
                <CategoryButton
                  key={category.id}
                  category={category}
                  isSelected={selectedCategory === category.id}
                  onPress={handleSelectCategory}
                  colors={colors}
                />
              ))}
            </View>
          </View>

          {/* Message Input */}
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Message</Text>
            <Text style={[styles.sectionDescription, { color: colors.subText }]}>
              Please provide details about your inquiry (min. {MIN_MESSAGE_LENGTH} characters)
            </Text>
            <TextInput
              style={[
                styles.messageInput,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                  color: colors.text
                }
              ]}
              placeholder="How can we help you? Please be as specific as possible..."
              placeholderTextColor={colors.subText}
              value={message}
              onChangeText={setMessage}
              multiline
              textAlignVertical="top" // Ensures text starts at the top on Android
            />
          </View>

          {/* Email Input */}
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Information</Text>
            <Text style={[styles.sectionDescription, { color: colors.subText }]}>
              Where should we send our reply?
            </Text>
            <View style={[
              styles.inputWithIcon,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.border,
              }
            ]}>
              <Ionicons name="mail-outline" size={20} color={colors.subText} style={styles.inputIcon} />
              <TextInput
                style={[styles.emailInput, { color: colors.text }]}
                placeholder="Your email address"
                placeholderTextColor={colors.subText}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="done"
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: isFormValid ? colors.primary : colors.disabled },
              !isFormValid && styles.disabledButton // Apply opacity style if invalid
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || !isFormValid}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.buttonText} />
            ) : (
              <Text style={[styles.submitButtonText, { color: isFormValid ? colors.buttonText : colors.subText }]}>
                Send Message
              </Text>
            )}
          </TouchableOpacity>

          {/* Alternative Contact */}
          <View style={styles.alternativeContact}>
            <Text style={[styles.alternativeText, { color: colors.subText }]}>
              You can also email us directly at:
            </Text>
            <TouchableOpacity
              onPress={handleOpenMail}
              style={styles.emailLinkContainer}
              activeOpacity={0.7}
            >
              <Ionicons name="mail" size={16} color={colors.primary} style={styles.emailLinkIcon} />
              <Text style={[styles.emailLink, { color: colors.primary }]}>
                support@fantasyai.com
              </Text>
            </TouchableOpacity>
          </View>

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={navigateToHelpCenter}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back-outline" size={16} color={colors.subText} style={styles.backButtonIcon} />
            <Text style={[styles.backButtonText, { color: colors.subText }]}>
              Return to Help Center
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 16,
  },
  headerText: {
    fontSize: 26, // Consistent
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subHeaderText: {
    fontSize: 16,
    lineHeight: 22,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
  },
  infoCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoCardIcon: {
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 19,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // justifyContent: 'space-between', // Adjust as needed
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20, // More rounded
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  messageInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    fontSize: 16,
    minHeight: 150, // Adjusted height
    lineHeight: 22,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden', // Important for border radius on children
  },
  inputIcon: {
    paddingLeft: 14, // Adjusted padding
    paddingRight: 8,
  },
  emailInput: {
    flex: 1,
    height: 50, // Defined height
    paddingRight: 16,
    fontSize: 16,
    // Removed borderWidth as it's on parent
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 25, // Consistent rounded
    alignItems: 'center',
    marginBottom: 24,
    minHeight: 50, // Ensure consistent height with inputs
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6, // Style for disabled state
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    // Color set dynamically
  },
  alternativeContact: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderColor: '#E0E0E0', // Use theme color if needed: colors.border
  },
  alternativeText: {
    fontSize: 14,
    marginBottom: 8,
  },
  emailLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4, // Add padding for easier tapping
  },
  emailLinkIcon: {
    marginRight: 6,
  },
  emailLink: {
    fontSize: 15,
    fontWeight: '500',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  backButtonIcon: {
    marginRight: 6,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});