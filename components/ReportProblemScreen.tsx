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
  ActivityIndicator, // Added for loading state
} from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons'; // Added for potential future icon use
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/navigation'; // Adjust path as needed

// --- Constants ---
const MIN_DESCRIPTION_LENGTH = 15; // Define minimum description length

// --- Static Data ---

// Consider making this an array of objects if icons or more data are needed later
const PROBLEM_CATEGORIES: string[] = [
  'Technical Issue',
  'Content Problem',
  'Account Issue',
  'Payment Problem',
  'Feature Request',
  'Inappropriate Content',
  'Other',
];

// --- Helper Components ---

interface CategoryButtonProps {
  category: string;
  isSelected: boolean;
  onPress: (category: string) => void;
  colors: Record<string, string>;
}

function CategoryButton({ category, isSelected, onPress, colors }: CategoryButtonProps) {
  return (
    <TouchableOpacity
      key={category}
      style={[
        styles.categoryButton,
        {
          backgroundColor: isSelected ? colors.primary : colors.inputBackground,
          borderColor: isSelected ? colors.primary : colors.border, // Use primary color for border when selected
        }
      ]}
      onPress={() => onPress(category)}
      activeOpacity={0.7}
    >
      {/* Optional: Add icon here if needed in the future */}
      {/* <Ionicons name="bug-outline" size={18} color={isSelected ? colors.buttonText : colors.text} style={styles.categoryIcon} /> */}
      <Text
        style={[
          styles.categoryButtonText,
          { color: isSelected ? colors.buttonText : colors.text }
        ]}
      >
        {category}
      </Text>
    </TouchableOpacity>
  );
}

// --- Main Component ---

type ReportProblemScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ReportProblem'>;

interface ReportProblemScreenProps {
  navigation: ReportProblemScreenNavigationProp;
}

export default function ReportProblemScreen({ navigation }: ReportProblemScreenProps) {
  const themeContext = useContext(ThemeContext);
  if (!themeContext) {
    throw new Error("ThemeContext must be used within a ThemeProvider");
  }
  const { isDarkMode } = themeContext;

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [email, setEmail] = useState<string>(''); // Optional email
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Dynamic colors based on theme
  const colors = useMemo(() => ({
    background: isDarkMode ? '#121212' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    subText: isDarkMode ? '#AAAAAA' : '#666666',
    inputBackground: isDarkMode ? '#2C2C2E' : '#F5F5F5',
    border: isDarkMode ? '#333333' : '#E0E0E0',
    primary: isDarkMode ? '#FF6347' : '#D9534F', // Use a distinct color for reporting (e.g., red/orange)
    accent: isDarkMode ? '#FF6347' : '#D9534F',
    card: isDarkMode ? '#1E1E1E' : '#F9F9F9', // Not used currently, but kept for consistency
    error: '#FF3B30',
    buttonText: '#FFFFFF',
    disabled: isDarkMode ? '#444444' : '#CCCCCC',
  }), [isDarkMode]);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!selectedCategory) errors.push('- Select a category');
    if (description.trim().length < MIN_DESCRIPTION_LENGTH) errors.push(`- Provide a description of at least ${MIN_DESCRIPTION_LENGTH} characters`);
    // Email is optional, no validation needed unless entered
    // if (email.trim().length > 0 && !isValidEmail(email)) errors.push('- Enter a valid email address if provided');
    return errors;
  }, [selectedCategory, description]);

  const isFormValid = validationErrors.length === 0;

  const handleSelectCategory = useCallback((category: string) => {
    setSelectedCategory(category);
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
    // In a real app, replace this with your API call logic to submit the report
    // Example:
    // try {
    //   await apiService.submitProblemReport({ category: selectedCategory, description, email });
    //   Alert.alert(
    //     "Report Submitted",
    //     "Thank you for your report. We'll review it.",
    //     [{ text: "OK", onPress: () => navigation.goBack() }]
    //   );
    // } catch (error) {
    //   console.error("Problem report submission error:", error);
    //   Alert.alert("Submission Failed", "Could not submit report. Please try again later.");
    // } finally {
    //   setIsSubmitting(false);
    // }
    // -------------------------

    // Placeholder simulation
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

    setIsSubmitting(false);
    Alert.alert(
      "Report Submitted",
      "Thank you for your report. We'll review it and take appropriate action.",
      [{ text: "OK", onPress: () => navigation.goBack() }]
    );
    // Reset form? Optional.
    // setSelectedCategory('');
    // setDescription('');
    // setEmail('');

  }, [isFormValid, isSubmitting, validationErrors, selectedCategory, description, email, navigation]);

  const navigateToHelpCenter = useCallback(() => {
    navigation.navigate('HelpCenter', undefined);
  }, [navigation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerContainer}>
            <Text style={[styles.headerText, { color: colors.text }]}>Report a Problem</Text>
            <Text style={[styles.subHeaderText, { color: colors.subText }]}>
              Please provide details about the issue you're experiencing so we can help resolve it.
            </Text>
          </View>

          {/* Category Selection */}
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Problem Category</Text>
            <Text style={[styles.sectionDescription, { color: colors.subText }]}>
              Select the category that best describes your issue
            </Text>
            <View style={styles.categoriesContainer}>
              {PROBLEM_CATEGORIES.map((category) => (
                <CategoryButton
                  key={category}
                  category={category}
                  isSelected={selectedCategory === category}
                  onPress={handleSelectCategory}
                  colors={colors}
                />
              ))}
            </View>
          </View>

          {/* Description Input */}
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
            <Text style={[styles.sectionDescription, { color: colors.subText }]}>
              Please provide as much detail as possible (min. {MIN_DESCRIPTION_LENGTH} characters)
            </Text>
            <TextInput
              style={[
                styles.descriptionInput,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                  color: colors.text
                }
              ]}
              placeholder="Describe the issue you're experiencing..."
              placeholderTextColor={colors.subText}
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Optional Email Input */}
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Information (Optional)</Text>
            <Text style={[styles.sectionDescription, { color: colors.subText }]}>
              Provide your email if you'd like us to follow up
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
                placeholder="Your email address (optional)"
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
              !isFormValid && styles.disabledButton
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || !isFormValid}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.buttonText} />
            ) : (
              <Text style={[styles.submitButtonText, { color: isFormValid ? colors.buttonText : colors.subText }]}>
                Submit Report
              </Text>
            )}
          </TouchableOpacity>

          {/* Note */}
          <View style={styles.noteContainer}>
            <Ionicons name="information-circle-outline" size={18} color={colors.subText} style={styles.noteIcon} />
            <Text style={[styles.noteText, { color: colors.subText }]}>
              This report will be reviewed by our team. We may contact you for additional information if an email is provided.
            </Text>
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
    marginBottom: 24,
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
  },
  categoryButton: {
    flexDirection: 'row', // Allow for icon later
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  // categoryIcon: { // Style if icon is added
  //   marginRight: 6,
  // },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  descriptionInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    fontSize: 16,
    minHeight: 140, // Adjusted height
    lineHeight: 22,
  },
  inputWithIcon: { // Reusing style from ContactUs
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  inputIcon: { // Reusing style from ContactUs
    paddingLeft: 14,
    paddingRight: 8,
  },
  emailInput: { // Reusing style from ContactUs
    flex: 1,
    height: 50,
    paddingRight: 16,
    fontSize: 16,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 24,
    minHeight: 50,
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    // Color set dynamically
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 30, // More space at bottom
    paddingHorizontal: 8, // Slight indent
  },
  noteIcon: {
    marginRight: 8,
    marginTop: 2, // Align with text
  },
  noteText: {
    flex: 1,
    fontSize: 13, // Slightly smaller
    fontStyle: 'italic',
    lineHeight: 19,
  },
  backButton: { // Consistent with FAQs
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  backButtonIcon: { // Consistent with FAQs
    marginRight: 6,
  },
  backButtonText: { // Consistent with FAQs
    fontSize: 14,
    fontWeight: '500',
  },
});