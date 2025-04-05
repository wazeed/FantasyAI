import React, { useContext, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../contexts/ThemeContext';
// Removed unused imports: useWindowDimensions, RootStackNavigationProp
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/navigation';

// --- Interfaces ---

interface PolicySection {
  title: string;
  content: string;
}

// --- Component Props Interface ---
type PrivacyPolicyScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PrivacyPolicy'>;

interface PrivacyPolicyScreenProps {
  // navigation: PrivacyPolicyScreenNavigationProp; // Add if navigation is needed later
}

// --- Static Data ---

const POLICY_SECTIONS: PolicySection[] = [
  {
    title: "1. Information We Collect",
    content: "We collect information you provide directly to us when you use our app, such as account registration info (e.g., email, username), profile details you choose to add, and the content of your messages exchanged within the application. We may also collect technical information automatically, like device type, operating system, IP address, and usage statistics to help us improve the service."
  },
  {
    title: "2. How We Use Your Information",
    content: "We use the information collected primarily to provide, maintain, and improve our services. This includes personalizing your experience (e.g., remembering your preferences), enabling communication features, providing customer support, ensuring the security and integrity of our app, and analyzing usage trends to enhance functionality."
  },
  {
    title: "3. Information Sharing",
    content: "We do not sell your personal information to third parties. We may share your information with trusted third-party service providers who assist us in operating the app (e.g., cloud hosting, analytics providers), but only to the extent necessary for them to perform their services for us and under strict confidentiality agreements. We may also disclose information if required by law or to protect our rights or the safety of others."
  },
  {
    title: "4. Data Security",
    content: "We implement appropriate technical and organizational security measures designed to protect your personal data against accidental or unlawful destruction, loss, alteration, unauthorized disclosure, or access. However, please be aware that no security measures are perfect or impenetrable."
  },
  {
    title: "5. Data Retention",
    content: "We retain your personal information for as long as necessary to provide the services you have requested, or for other essential purposes such as complying with our legal obligations, resolving disputes, and enforcing our policies. Account information is typically retained until the account is deleted."
  },
  {
    title: "6. Your Rights and Choices",
    content: "Depending on your jurisdiction, you may have certain rights regarding your personal information. This typically includes the right to access, correct, update, or request deletion of your personal information. You can usually manage your profile information through your account settings. For other requests or questions about your rights, please contact us."
  },
  {
    title: "7. Children's Privacy",
    content: "Our service is not directed to individuals under the age of 13 (or a higher age threshold depending on the jurisdiction). We do not knowingly collect personal information from children. If we become aware that a child has provided us with personal information, we will take steps to delete such information."
  },
  {
    title: "8. Changes to This Policy",
    content: "We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy within the app or through other communication channels. Your continued use of the app after such changes constitutes your acceptance of the new policy."
  },
  {
    title: "9. Contact Us",
    content: "If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at privacy@fantasyai.com."
  }
];

// --- Main Component ---

export default function PrivacyPolicyScreen(props: PrivacyPolicyScreenProps) {
  const themeContext = useContext(ThemeContext);
  if (!themeContext) {
    throw new Error("ThemeContext must be used within a ThemeProvider");
  }
  const { isDarkMode } = themeContext;

  // Dynamic colors based on theme
  const colors = useMemo(() => ({
    background: isDarkMode ? '#121212' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    heading: isDarkMode ? '#E0E0E0' : '#333333',
    subText: isDarkMode ? '#AAAAAA' : '#666666',
    border: isDarkMode ? '#333333' : '#E0E0E0',
  }), [isDarkMode]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.mainTitle, { color: colors.text }]}>Privacy Policy</Text>
        <Text style={[styles.lastUpdated, { color: colors.subText }]}>Last updated: April 1, 2025</Text>

        {POLICY_SECTIONS.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.heading }]}>{section.title}</Text>
            <Text style={[styles.sectionContent, { color: colors.text }]}>{section.content}</Text>
          </View>
        ))}

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
    paddingHorizontal: 20, // Consistent padding
    paddingVertical: 16,
    paddingBottom: 40,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  lastUpdated: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 23,
  },
});