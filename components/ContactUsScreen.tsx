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
  Linking,
} from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

// Simplified contact categories
const CONTACT_CATEGORIES = [
  { id: 'general', label: 'General Inquiry', icon: 'help-circle-outline' },
  { id: 'technical', label: 'Technical Support', icon: 'construct-outline' },
  { id: 'account', label: 'Account Help', icon: 'person-outline' },
  { id: 'billing', label: 'Billing Question', icon: 'card-outline' },
  { id: 'feature', label: 'Feature Suggestion', icon: 'bulb-outline' },
];

export default function ContactUsScreen({ navigation }) {
  const { isDarkMode } = React.useContext(ThemeContext);
  
  const [selectedCategory, setSelectedCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  // Dynamic colors based on theme
  const colors = {
    background: isDarkMode ? '#121212' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    subText: isDarkMode ? '#AAAAAA' : '#666666',
    inputBackground: isDarkMode ? '#2A2A2A' : '#F5F5F5',
    border: isDarkMode ? '#333333' : '#E0E0E0',
    primary: isDarkMode ? '#3D8CFF' : '#4F46E5',
    accent: isDarkMode ? '#3D8CFF' : '#4F46E5',
    card: isDarkMode ? '#1E1E1E' : '#F9F9F9',
    iconBackground: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(79,70,229,0.1)',
    error: '#FF3B30',
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isFormValid = 
    selectedCategory && 
    message.trim().length > 10 && 
    email.trim().length > 0 && 
    isValidEmail(email);

  const handleSubmit = () => {
    if (!isFormValid) {
      let errorMessage = 'Please check the following:';
      if (!selectedCategory) errorMessage += '\n- Select a category';
      if (message.trim().length <= 10) errorMessage += '\n- Provide a more detailed message';
      if (email.trim().length === 0) errorMessage += '\n- Enter your email address';
      else if (!isValidEmail(email)) errorMessage += '\n- Enter a valid email address';
      
      Alert.alert("Form Incomplete", errorMessage, [{ text: "OK" }]);
      return;
    }

    // In a real app, this would send the message to the server
    Alert.alert(
      "Message Sent",
      "Thank you for contacting us. We'll get back to you as soon as possible.",
      [{ text: "OK", onPress: () => navigation.goBack() }]
    );
  };

  const renderCategoryButton = (category) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryButton,
        { 
          backgroundColor: selectedCategory === category.id ? colors.primary : colors.card,
          borderColor: selectedCategory === category.id ? colors.primary : colors.border
        }
      ]}
      onPress={() => setSelectedCategory(category.id)}
    >
      <Ionicons 
        name={category.icon} 
        size={20} 
        color={selectedCategory === category.id ? '#FFFFFF' : colors.accent} 
        style={styles.categoryIcon}
      />
      <Text 
        style={[
          styles.categoryButtonText, 
          { color: selectedCategory === category.id ? '#FFFFFF' : colors.text }
        ]}
      >
        {category.label}
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
            <Text style={[styles.headerText, { color: colors.text }]}>Contact Support</Text>
            <Text style={[styles.subHeaderText, { color: colors.subText }]}>
              Have a question or need help? We're here for you.
            </Text>
          </View>

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

          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>What can we help you with?</Text>
            <Text style={[styles.sectionDescription, { color: colors.subText }]}>
              Select a category below
            </Text>
            <View style={styles.categoriesContainer}>
              {CONTACT_CATEGORIES.map(renderCategoryButton)}
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Message</Text>
            <Text style={[styles.sectionDescription, { color: colors.subText }]}>
              Please provide details about your inquiry
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
              numberOfLines={8}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Information</Text>
            <Text style={[styles.sectionDescription, { color: colors.subText }]}>
              Where should we send our reply?
            </Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="mail-outline" size={20} color={colors.subText} style={styles.inputIcon} />
              <TextInput
                style={[
                  styles.emailInput,
                  { 
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                    color: colors.text
                  }
                ]}
                placeholder="Your email address"
                placeholderTextColor={colors.subText}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
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
            <Text style={styles.submitButtonText}>Send Message</Text>
          </TouchableOpacity>

          <View style={styles.alternativeContact}>
            <Text style={[styles.alternativeText, { color: colors.subText }]}>
              You can also email us directly at:
            </Text>
            <TouchableOpacity 
              onPress={() => Linking.openURL('mailto:support@fantasyai.com')}
              style={styles.emailLinkContainer}
            >
              <Ionicons name="mail" size={16} color={colors.primary} style={styles.emailLinkIcon} />
              <Text style={[styles.emailLink, { color: colors.primary }]}>
                support@fantasyai.com
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.navigate('HelpCenter')}
          >
            <Text style={[styles.backButtonText, { color: colors.subText }]}>
              Return to Help Center
            </Text>
          </TouchableOpacity>
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
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 16,
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
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
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
    minHeight: 160,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  inputIcon: {
    paddingHorizontal: 12,
  },
  emailInput: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 16,
    fontSize: 16,
    borderWidth: 0,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  alternativeContact: {
    alignItems: 'center',
    marginBottom: 20,
  },
  alternativeText: {
    fontSize: 14,
    marginBottom: 8,
  },
  emailLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emailLinkIcon: {
    marginRight: 6,
  },
  emailLink: {
    fontSize: 15,
    fontWeight: '500',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 14,
  },
}); 