import React from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackNavigationProp } from '../types/navigation';

export default function PrivacyPolicyScreen() {
  const { width } = useWindowDimensions();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={[styles.content, { padding: width * 0.04 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Privacy Policy</Text>
        
        <Text style={styles.sectionHeader}>1. Information We Collect</Text>
        <Text style={styles.text}>
          We collect information you provide directly to us when you use our app, 
          such as account registration info, profile details, and messages.
        </Text>

        <Text style={styles.sectionHeader}>2. How We Use Your Information</Text>
        <Text style={styles.text}>
          We use the information collected to provide and improve our services, personalize 
          your experience, communicate with you, and ensure app security.
        </Text>

        <Text style={styles.sectionHeader}>3. Information Sharing</Text>
        <Text style={styles.text}>
          We do not sell your personal information. We may share it with service providers 
          who assist us in operating the app, only as necessary.
        </Text>

        <Text style={styles.sectionHeader}>4. Data Security</Text>
        <Text style={styles.text}>
          We implement appropriate technical and organizational measures to protect your 
          personal data against unauthorized access.
        </Text>

        <Text style={styles.sectionHeader}>5. Your Rights</Text>
        <Text style={styles.text}>
          You may access, correct, or delete your personal information through your account 
          settings or by contacting us.
        </Text>

        <Text style={styles.sectionHeader}>6. Contact Us</Text>
        <Text style={styles.text}>
          For any privacy-related questions, please contact us at privacy@fantasyai.com
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingBottom: 20,
    
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#333333',
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
    color: '#555555',
  },
});