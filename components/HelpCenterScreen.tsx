import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Platform,
} from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

// Help resources data with improved organization
const HELP_RESOURCES = [
  {
    id: '1',
    title: 'Frequently Asked Questions',
    description: 'Find answers to common questions about using the app.',
    screen: 'FAQs',
    icon: 'help-circle-outline',
  },
  {
    id: '2',
    title: 'Report a Problem',
    description: 'Let us know about any issues you encounter while using the app.',
    screen: 'ReportProblem',
    icon: 'bug-outline',
  },
  {
    id: '3',
    title: 'Contact Support',
    description: 'Reach out to our support team for personalized assistance.',
    screen: 'ContactUs',
    icon: 'mail-outline',
  },
  {
    id: '4',
    title: 'User Guide',
    description: 'Learn how to use all the features of Fantasy AI.',
    screen: 'FAQs', // Using FAQs screen for User Guide content
    icon: 'book-outline',
  }
];

// App features help
const APP_FEATURES = [
  {
    title: 'Characters',
    description: 'Browse and interact with AI characters',
    icon: 'people-outline',
    tips: [
      'Tap on a character to start chatting',
      'Use the search bar to find specific character types',
      'Your recent conversations appear at the top'
    ]
  },
  {
    title: 'Conversations',
    description: 'Chat with AI characters in immersive stories',
    icon: 'chatbubbles-outline',
    tips: [
      'Type your message and tap send',
      'Long press on a message for options',
      'Pull down to refresh the conversation'
    ]
  },
  {
    title: 'Premium Features',
    description: 'Unlock the full potential of Fantasy AI',
    icon: 'star-outline',
    tips: [
      'Upgrade to premium for unlimited messages',
      'Access exclusive characters and content',
      'Remove ads and restrictions'
    ]
  }
];

export default function HelpCenterScreen({ navigation }) {
  const { isDarkMode } = React.useContext(ThemeContext);

  // Dynamic colors based on theme
  const colors = {
    background: isDarkMode ? '#121212' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    subText: isDarkMode ? '#AAAAAA' : '#666666',
    card: isDarkMode ? '#1E1E1E' : '#F5F5F5',
    cardBorder: isDarkMode ? '#333333' : '#E0E0E0',
    accent: isDarkMode ? '#3D8CFF' : '#4F46E5',
    link: isDarkMode ? '#3D8CFF' : '#4F46E5',
    iconBackground: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(79,70,229,0.1)',
  };

  const handleResourcePress = (resource) => {
    if (resource.screen) {
      navigation.navigate(resource.screen);
    }
  };

  const renderResourceCard = (resource) => (
    <TouchableOpacity
      key={resource.id}
      style={[styles.resourceCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      onPress={() => handleResourcePress(resource)}
    >
      <View style={[styles.resourceIconContainer, { backgroundColor: colors.iconBackground }]}>
        <Ionicons name={resource.icon} size={24} color={colors.accent} />
      </View>
      <View style={styles.resourceContent}>
        <Text style={[styles.resourceTitle, { color: colors.text }]}>{resource.title}</Text>
        <Text style={[styles.resourceDescription, { color: colors.subText }]}>{resource.description}</Text>
        <View style={styles.resourceLinkContainer}>
          <Text style={[styles.resourceLink, { color: colors.link }]}>View</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.link} style={styles.resourceLinkIcon} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFeatureSection = (feature, index) => (
    <View key={index} style={[styles.featureSection, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={styles.featureHeader}>
        <View style={[styles.featureIconContainer, { backgroundColor: colors.iconBackground }]}>
          <Ionicons name={feature.icon} size={22} color={colors.accent} />
        </View>
        <View style={styles.featureTitleContainer}>
          <Text style={[styles.featureTitle, { color: colors.text }]}>{feature.title}</Text>
          <Text style={[styles.featureDescription, { color: colors.subText }]}>{feature.description}</Text>
        </View>
      </View>
      
      <View style={styles.featureTipsContainer}>
        {feature.tips.map((tip, tipIndex) => (
          <View key={tipIndex} style={styles.tipRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.accent} style={styles.tipIcon} />
            <Text style={[styles.tipText, { color: colors.text }]}>{tip}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Help Center</Text>
          <Text style={[styles.headerSubtitle, { color: colors.subText }]}>
            Find answers and support for using Fantasy AI
          </Text>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.accent }]}>
          <View style={styles.infoCardHeader}>
            <Ionicons name="information-circle-outline" size={24} color={colors.accent} style={styles.infoCardIcon} />
            <Text style={[styles.infoTitle, { color: colors.text }]}>How can we help?</Text>
          </View>
          <Text style={[styles.infoText, { color: colors.subText }]}>
            Our help center provides resources to answer your questions and guide you through 
            using Fantasy AI. Browse the options below to get started.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Support Resources</Text>
          <Text style={[styles.sectionDescription, { color: colors.subText }]}>
            Choose an option below to get the help you need
          </Text>
          
          <View style={styles.resourcesContainer}>
            {HELP_RESOURCES.map(renderResourceCard)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>App Features Guide</Text>
          <Text style={[styles.sectionDescription, { color: colors.subText }]}>
            Learn how to use the main features of Fantasy AI
          </Text>
          
          <View style={styles.featuresContainer}>
            {APP_FEATURES.map(renderFeatureSection)}
          </View>
        </View>

        <View style={[styles.supportCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Ionicons name="headset-outline" size={32} color={colors.accent} style={styles.supportIcon} />
          <Text style={[styles.supportTitle, { color: colors.text }]}>Still need help?</Text>
          <Text style={[styles.supportText, { color: colors.subText }]}>
            If you can't find what you're looking for, our support team is ready to assist you.
          </Text>
          <TouchableOpacity 
            style={[styles.supportButton, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate('ContactUs')}  
          >
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoCardIcon: {
    marginRight: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 15,
    marginBottom: 16,
  },
  resourcesContainer: {
    marginBottom: 8,
  },
  resourceCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  resourceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  resourceContent: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  resourceLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resourceLink: {
    fontSize: 14,
    fontWeight: '500',
  },
  resourceLinkIcon: {
    marginLeft: 4,
  },
  featuresContainer: {
    marginBottom: 8,
  },
  featureSection: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureTitleContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
  },
  featureTipsContainer: {
    padding: 16,
  },
  tipRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  tipIcon: {
    marginRight: 8,
  },
  tipText: {
    fontSize: 14,
    flex: 1,
  },
  supportCard: {
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  supportIcon: {
    marginBottom: 12,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  supportText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 16,
  },
  supportButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  supportButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
}); 