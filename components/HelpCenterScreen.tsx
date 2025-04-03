import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  // Linking, // Unused
  // Platform, // Unused
} from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import type { StackNavigationProp } from '@react-navigation/stack'; // Assuming Stack Navigator
import type { RootStackParamList } from '../types/navigation'; // Adjust path as needed

// --- Interfaces ---

// Define a more specific type for screens navigable from Help Center that expect no params
type HelpCenterNavigableScreens = Extract<keyof RootStackParamList,
  'FAQs' | 'ReportProblem' | 'ContactUs'
>;

interface HelpResource {
  id: string;
  title: string;
  description: string;
  screen: HelpCenterNavigableScreens; // Use the specific type
  icon: keyof typeof Ionicons.glyphMap;
}

interface AppFeature {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  tips: string[];
}

// --- Static Data ---

const HELP_RESOURCES: HelpResource[] = [
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

const APP_FEATURES: AppFeature[] = [
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

// --- Helper Components ---

interface ResourceCardProps {
  resource: HelpResource;
  colors: Record<string, string>;
  onPress: (resource: HelpResource) => void;
}

function ResourceCard({ resource, colors, onPress }: ResourceCardProps) {
  return (
    <TouchableOpacity
      key={resource.id}
      style={[styles.resourceCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      onPress={() => onPress(resource)}
      activeOpacity={0.7}
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
}

interface FeatureSectionProps {
  feature: AppFeature;
  colors: Record<string, string>;
}

function FeatureSection({ feature, colors }: FeatureSectionProps) {
  return (
    <View style={[styles.featureSection, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
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
}

// --- Main Component ---

type HelpCenterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'HelpCenter'>;

interface HelpCenterScreenProps {
  navigation: HelpCenterScreenNavigationProp;
}

export default function HelpCenterScreen({ navigation }: HelpCenterScreenProps) {
  const { isDarkMode } = useContext(ThemeContext);

  // Dynamic colors based on theme
  // Consider moving to a dedicated theme/colors utility if used widely
  const colors = {
    background: isDarkMode ? '#121212' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    subText: isDarkMode ? '#AAAAAA' : '#666666',
    card: isDarkMode ? '#1E1E1E' : '#F5F5F5',
    cardBorder: isDarkMode ? '#333333' : '#E0E0E0',
    accent: isDarkMode ? '#3D8CFF' : '#4F46E5', // Example accent colors
    link: isDarkMode ? '#3D8CFF' : '#4F46E5',
    iconBackground: isDarkMode ? 'rgba(61, 140, 255, 0.2)' : 'rgba(79, 70, 229, 0.1)', // Adjusted alpha
  };

  const handleResourcePress = (resource: HelpResource) => {
    if (resource.screen) {
      // Explicitly pass undefined for params to satisfy type checker for screens without required params
      navigation.navigate(resource.screen, undefined);
    }
    // Potentially handle external links here if needed in the future
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Help Center</Text>
          <Text style={[styles.headerSubtitle, { color: colors.subText }]}>
            Find answers and support for using Fantasy AI
          </Text>
        </View>

        {/* Info Card */}
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

        {/* Support Resources Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Support Resources</Text>
          <Text style={[styles.sectionDescription, { color: colors.subText }]}>
            Choose an option below to get the help you need
          </Text>
          <View style={styles.resourcesContainer}>
            {HELP_RESOURCES.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                colors={colors}
                onPress={handleResourcePress}
              />
            ))}
          </View>
        </View>

        {/* App Features Guide Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>App Features Guide</Text>
          <Text style={[styles.sectionDescription, { color: colors.subText }]}>
            Learn how to use the main features of Fantasy AI
          </Text>
          <View style={styles.featuresContainer}>
            {APP_FEATURES.map((feature, index) => (
              <FeatureSection
                key={index} // Using index as key is acceptable for static list
                feature={feature}
                colors={colors}
              />
            ))}
          </View>
        </View>

        {/* Still Need Help Card */}
        <View style={[styles.supportCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Ionicons name="headset-outline" size={32} color={colors.accent} style={styles.supportIcon} />
          <Text style={[styles.supportTitle, { color: colors.text }]}>Still need help?</Text>
          <Text style={[styles.supportText, { color: colors.subText }]}>
            If you can't find what you're looking for, our support team is ready to assist you.
          </Text>
          <TouchableOpacity
            style={[styles.supportButton, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate('ContactUs')}
            activeOpacity={0.8}
          >
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
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
    padding: 16,
    paddingBottom: 40, // Ensure space at the bottom
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 26, // Slightly larger
    fontWeight: 'bold', // Bolder
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
    marginRight: 10, // Increased spacing
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
    lineHeight: 21, // Added line height
  },
  resourcesContainer: {
    // No specific styles needed here now
  },
  resourceCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    alignItems: 'center', // Align items vertically
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
    marginTop: 4, // Added margin top
  },
  resourceLink: {
    fontSize: 14,
    fontWeight: '500',
  },
  resourceLinkIcon: {
    marginLeft: 4,
  },
  featuresContainer: {
    // No specific styles needed here now
  },
  featureSection: {
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden', // Keep overflow hidden
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    // Use dynamic border color from colors object if needed, or keep consistent
    // borderBottomColor: colors.cardBorder, // Example if needed
    borderBottomColor: '#E0E0E0', // Keeping consistent for now
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
    lineHeight: 18, // Added line height
  },
  featureTipsContainer: {
    paddingTop: 12, // Adjusted padding
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  tipRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start', // Align items to start for potentially longer text
  },
  tipIcon: {
    marginRight: 8,
    marginTop: 2, // Align icon better with text line
  },
  tipText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20, // Added line height
  },
  supportCard: {
    borderRadius: 12,
    padding: 20,
    marginTop: 16, // Increased margin top
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
    marginBottom: 20, // Increased margin bottom
  },
  supportButton: {
    paddingVertical: 12,
    paddingHorizontal: 32, // Increased padding
    borderRadius: 25, // More rounded
  },
  supportButtonText: {
    fontSize: 16,
    fontWeight: '600', // Bolder text
    color: '#FFFFFF',
  },
});