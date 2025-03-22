import React, { useState } from 'react';
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
} from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';

// Problem categories
const PROBLEM_CATEGORIES = [
  'Technical Issue',
  'Content Problem',
  'Account Issue',
  'Payment Problem',
  'Feature Request',
  'Inappropriate Content',
  'Other',
];

export default function ReportProblemScreen({ navigation }) {
  const { isDarkMode } = React.useContext(ThemeContext);
  
  const [selectedCategory, setSelectedCategory] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');

  // Dynamic colors based on theme
  const colors = {
    background: isDarkMode ? '#121212' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    subText: isDarkMode ? '#AAAAAA' : '#666666',
    card: isDarkMode ? '#1E1E1E' : '#F9F9F9',
    border: isDarkMode ? '#333333' : '#E0E0E0',
    inputBackground: isDarkMode ? '#2A2A2A' : '#F5F5F5',
    primary: isDarkMode ? '#3D8CFF' : '#000000',
    error: '#FF3B30',
  };

  const isFormValid = selectedCategory && description.trim().length > 10;

  const handleSubmit = () => {
    if (!isFormValid) {
      Alert.alert(
        "Incomplete Form",
        "Please select a category and provide a detailed description (at least 10 characters).",
        [{ text: "OK" }]
      );
      return;
    }

    // In a real app, this would send the report to the server
    Alert.alert(
      "Report Submitted",
      "Thank you for your report. We'll review it and take appropriate action.",
      [{ text: "OK", onPress: () => navigation.goBack() }]
    );
  };

  const renderCategoryButton = (category) => (
    <TouchableOpacity
      key={category}
      style={[
        styles.categoryButton,
        { 
          backgroundColor: selectedCategory === category ? colors.primary : colors.inputBackground,
          borderColor: colors.border
        }
      ]}
      onPress={() => setSelectedCategory(category)}
    >
      <Text 
        style={[
          styles.categoryButtonText, 
          { color: selectedCategory === category ? '#FFFFFF' : colors.text }
        ]}
      >
        {category}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.headerContainer}>
            <Text style={[styles.headerText, { color: colors.text }]}>Report a Problem</Text>
            <Text style={[styles.subHeaderText, { color: colors.subText }]}>
              Please provide details about the issue you're experiencing so we can help resolve it.
            </Text>
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Problem Category</Text>
            <Text style={[styles.sectionDescription, { color: colors.subText }]}>
              Select the category that best describes your issue
            </Text>
            
            <View style={styles.categoriesContainer}>
              {PROBLEM_CATEGORIES.map(renderCategoryButton)}
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
            <Text style={[styles.sectionDescription, { color: colors.subText }]}>
              Please provide as much detail as possible
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
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Information</Text>
            <Text style={[styles.sectionDescription, { color: colors.subText }]}>
              Provide your email if you'd like us to follow up (optional)
            </Text>
            
            <TextInput
              style={[
                styles.emailInput,
                { 
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                  color: colors.text
                }
              ]}
              placeholder="Your email address (optional)"
              placeholderTextColor={colors.subText}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              { 
                backgroundColor: isFormValid ? colors.primary : colors.inputBackground,
                opacity: isFormValid ? 1 : 0.5
              }
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid}
          >
            <Text style={styles.submitButtonText}>Submit Report</Text>
          </TouchableOpacity>

          <View style={styles.noteContainer}>
            <Text style={[styles.noteText, { color: colors.subText }]}>
              Note: This report will be reviewed by our team. We may contact you for additional information if needed.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
  headerContainer: {
    marginBottom: 24,
  },
  headerText: {
    fontSize: 24,
    fontWeight: '600',
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
    marginBottom: 6,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  descriptionInput: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
  },
  emailInput: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    fontSize: 16,
    height: 48,
  },
  submitButton: {
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  noteContainer: {
    marginBottom: 40,
  },
  noteText: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
}); 