import React, { useContext, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../contexts/ThemeContext';
import type { StackNavigationProp } from '@react-navigation/stack'; // Import navigation types
import type { RootStackParamList } from '../types/navigation'; // Adjust path as needed

// --- Component Props Interface ---
// Although not currently used, define for future flexibility and consistency
type TermsAndConditionsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'TermsAndConditions'>;

interface TermsAndConditionsScreenProps {
  // navigation: TermsAndConditionsScreenNavigationProp; // Add if navigation is needed later
}

// --- Main Component ---

export default function TermsAndConditionsScreen(props: TermsAndConditionsScreenProps) {
  const themeContext = useContext(ThemeContext);
  if (!themeContext) {
    throw new Error("ThemeContext must be used within a ThemeProvider");
  }
  const { isDarkMode } = themeContext;

  // Dynamic colors based on theme
  const colors = useMemo(() => ({
    background: isDarkMode ? '#121212' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    heading: isDarkMode ? '#E0E0E0' : '#333333', // Slightly different color for headings
    subText: isDarkMode ? '#AAAAAA' : '#666666', // For less important text if needed
    border: isDarkMode ? '#333333' : '#E0E0E0', // For potential separators
  }), [isDarkMode]);

  // Placeholder content structure
  const sections = [
    {
      title: "1. Introduction",
      content: "Welcome to Fantasy AI. These terms and conditions outline the rules and regulations for the use of Fantasy AI's Mobile Application. By accessing this app we assume you accept these terms and conditions. Do not continue to use Fantasy AI if you do not agree to take all of the terms and conditions stated on this page."
    },
    {
      title: "2. Intellectual Property Rights",
      content: "Other than the content you own, under these Terms, Fantasy AI and/or its licensors own all the intellectual property rights and materials contained in this App. You are granted limited license only for purposes of viewing the material contained on this App."
    },
    {
      title: "3. Restrictions",
      content: "You are specifically restricted from all of the following: publishing any App material in any other media; selling, sublicensing and/or otherwise commercializing any App material; publicly performing and/or showing any App material; using this App in any way that is or may be damaging to this App; using this App in any way that impacts user access to this App..."
    },
    {
      title: "4. Your Content",
      content: "In these App Standard Terms and Conditions, “Your Content” shall mean any audio, video text, images or other material you choose to display on this App. By displaying Your Content, you grant Fantasy AI a non-exclusive, worldwide irrevocable, sub licensable license to use, reproduce, adapt, publish, translate and distribute it in any and all media..."
    },
    {
      title: "5. No warranties",
      content: "This App is provided “as is,” with all faults, and Fantasy AI express no representations or warranties, of any kind related to this App or the materials contained on this App. Also, nothing contained on this App shall be interpreted as advising you."
    },
    {
      title: "6. Limitation of liability",
      content: "In no event shall Fantasy AI, nor any of its officers, directors and employees, shall be held liable for anything arising out of or in any way connected with your use of this App whether such liability is under contract. Fantasy AI, including its officers, directors and employees shall not be held liable for any indirect, consequential or special liability arising out of or in any way related to your use of this App."
    },
    {
      title: "7. Indemnification",
      content: "You hereby indemnify to the fullest extent Fantasy AI from and against any and/or all liabilities, costs, demands, causes of action, damages and expenses arising in any way related to your breach of any of the provisions of these Terms."
    },
    {
      title: "8. Severability",
      content: "If any provision of these Terms is found to be invalid under any applicable law, such provisions shall be deleted without affecting the remaining provisions herein."
    },
    {
      title: "9. Variation of Terms",
      content: "Fantasy AI is permitted to revise these Terms at any time as it sees fit, and by using this App you are expected to review these Terms on a regular basis."
    },
    {
      title: "10. Governing Law & Jurisdiction",
      content: "These Terms will be governed by and interpreted in accordance with the laws of the State/Country of [Your Location], and you submit to the non-exclusive jurisdiction of the state and federal courts located in [Your Location] for the resolution of any disputes."
    }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom', 'left', 'right']}>
      {/* Consider adding a header component here if consistent across app */}
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={[styles.mainTitle, { color: colors.text }]}>Terms and Conditions</Text>
        <Text style={[styles.lastUpdated, { color: colors.subText }]}>Last updated: April 1, 2025</Text>

        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.heading }]}>{section.title}</Text>
            <Text style={[styles.sectionContent, { color: colors.text }]}>{section.content}</Text>
          </View>
        ))}

        {/* Add a concluding statement if necessary */}
        <View style={styles.section}>
           <Text style={[styles.sectionContent, { color: colors.text }]}>
             By using the Fantasy AI application, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
           </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16, // Add vertical padding
    paddingBottom: 40, // Ensure space at the bottom
  },
  mainTitle: {
    fontSize: 26, // Larger title
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center', // Center title
  },
  lastUpdated: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24, // More space after date
  },
  section: {
    marginBottom: 20, // Consistent spacing between sections
  },
  sectionTitle: {
    fontSize: 18, // Slightly smaller section titles
    fontWeight: '600', // Bold section titles
    marginBottom: 10, // Space below title
  },
  sectionContent: {
    fontSize: 15, // Slightly smaller content text
    lineHeight: 23, // Adjust line height for readability
  },
});