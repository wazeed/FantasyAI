import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';

// Health resources data
const HEALTH_RESOURCES = [
  {
    id: '1',
    title: 'Mental Health Support',
    description: 'Access resources for anxiety, depression, and other mental health concerns.',
    link: 'https://www.nimh.nih.gov/health',
    icon: '🧠',
  },
  {
    id: '2',
    title: 'Digital Wellbeing',
    description: 'Find a healthy balance with technology and improve your digital habits.',
    link: 'https://wellbeing.google',
    icon: '📱',
  },
  {
    id: '3',
    title: 'Crisis Support',
    description: 'Immediate help for those in distress or experiencing suicidal thoughts.',
    link: 'https://988lifeline.org',
    icon: '🆘',
  },
  {
    id: '4',
    title: 'Healthy Relationships',
    description: 'Resources for maintaining positive and supportive relationships.',
    link: 'https://www.loveisrespect.org',
    icon: '💕',
  },
  {
    id: '5',
    title: 'Mindfulness & Meditation',
    description: 'Practices to reduce stress and improve focus and emotional well-being.',
    link: 'https://www.mindful.org',
    icon: '🧘',
  },
];

// Tips for healthy engagement
const HEALTHY_TIPS = [
  'Set time limits for app usage to avoid overconsumption',
  'Remember that AI characters are not real people',
  'Take breaks often to engage with the real world',
  'Be mindful of your emotional responses',
  'Use Fantasy AI as a creative outlet, not a replacement for real connections',
  'Practice critical thinking in all interactions',
];

const ResourceCard = ({ resource, isDarkMode, onPress }) => {
  return (
    <TouchableOpacity 
      style={[
        styles.resourceCard,
        { 
          backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
          borderColor: isDarkMode ? '#333333' : '#E0E0E0',
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.resourceIconContainer}>
        <Text style={styles.resourceIcon}>{resource.icon}</Text>
      </View>
      <View style={styles.resourceContent}>
        <Text style={[
          styles.resourceTitle,
          { color: isDarkMode ? '#FFFFFF' : '#000000' }
        ]}>
          {resource.title}
        </Text>
        <Text style={[
          styles.resourceDescription,
          { color: isDarkMode ? '#AAAAAA' : '#666666' }
        ]}>
          {resource.description}
        </Text>
      </View>
      <Text style={[
        styles.resourceArrow,
        { color: isDarkMode ? '#FFFFFF' : '#000000' }
      ]}>›</Text>
    </TouchableOpacity>
  );
};

const ContactCard = ({ contact, isDarkMode, onPress }) => {
  return (
    <TouchableOpacity 
      style={[
        styles.contactCard,
        { 
          backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
          borderColor: isDarkMode ? '#333333' : '#E0E0E0',
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.contactIconContainer,
        { backgroundColor: isDarkMode ? '#333333' : '#F0F0F0' }
      ]}>
        <Text style={styles.contactIcon}>{contact.isTextLine ? '✉️' : '📞'}</Text>
      </View>
      <View style={styles.contactContent}>
        <Text style={[
          styles.contactName,
          { color: isDarkMode ? '#FFFFFF' : '#000000' }
        ]}>
          {contact.name}
        </Text>
        <Text style={[
          styles.contactDescription,
          { color: isDarkMode ? '#AAAAAA' : '#666666' }
        ]}>
          {contact.description}
        </Text>
        <Text style={[
          styles.contactPhone,
          { color: isDarkMode ? '#0070F3' : '#0070F3' }
        ]}>
          {contact.phone}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function HealthCenterScreen() {
  const { isDarkMode } = React.useContext(ThemeContext);

  const handleResourcePress = (resource) => {
    // In a real app, this would open the resource link
    Linking.openURL(resource.link).catch((err) => {
      console.error('Failed to open URL:', err);
    });
  };

  const handleContactPress = (contact) => {
    // In a real app, this would open the phone dialer or messaging app
    const prefix = contact.isTextLine ? 'sms:' : 'tel:';
    Linking.openURL(`${prefix}${contact.phone}`).catch((err) => {
      console.error('Failed to open URL:', err);
    });
  };

  // Dynamic colors based on theme
  const colors = {
    background: isDarkMode ? '#121212' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    subText: isDarkMode ? '#AAAAAA' : '#666666',
    card: isDarkMode ? '#1E1E1E' : '#F5F5F5',
    cardBorder: isDarkMode ? '#333333' : '#E0E0E0',
    accent: isDarkMode ? '#00C4B4' : '#008577',
    link: '#3D8CFF',
  };

  const renderResourceCard = (resource) => (
    <ResourceCard 
      key={resource.id}
      resource={resource}
      isDarkMode={isDarkMode}
      onPress={() => handleResourcePress(resource)}
    />
  );

  const renderTip = (tip, index) => (
    <View key={index} style={[styles.tipItem, { borderColor: colors.cardBorder }]}>
      <Text style={[styles.tipNumber, { backgroundColor: colors.accent }]}>{index + 1}</Text>
      <Text style={[styles.tipText, { color: colors.text }]}>{tip}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Health & Wellbeing</Text>
          <Text style={[styles.headerSubtitle, { color: colors.subText }]}>
            Resources to help you maintain balance and wellness
          </Text>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.accent }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>Your wellbeing matters</Text>
          <Text style={[styles.infoText, { color: colors.subText }]}>
            While Fantasy AI aims to provide entertainment and creative expression, 
            it's important to maintain a healthy balance between digital experiences 
            and real-life connections.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Helpful Resources</Text>
          <Text style={[styles.sectionDescription, { color: colors.subText }]}>
            External resources for support and information
          </Text>
          
          <View style={styles.resourcesContainer}>
            {HEALTH_RESOURCES.map(renderResourceCard)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tips for Healthy Engagement</Text>
          <Text style={[styles.sectionDescription, { color: colors.subText }]}>
            Best practices for a positive experience
          </Text>
          
          <View style={styles.tipsContainer}>
            {HEALTHY_TIPS.map(renderTip)}
          </View>
        </View>

        <View style={[styles.supportCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.supportTitle, { color: colors.text }]}>Need Help?</Text>
          <Text style={[styles.supportText, { color: colors.subText }]}>
            If you're experiencing difficulties or have concerns about your usage patterns, 
            we encourage you to reach out for support.
          </Text>
          <TouchableOpacity 
            style={[styles.supportButton, { backgroundColor: colors.accent }]}
            onPress={() => handleResourcePress('https://988lifeline.org')}  
          >
            <Text style={styles.supportButtonText}>Get Support</Text>
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
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
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
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  resourceIcon: {
    fontSize: 24,
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
  resourceArrow: {
    fontSize: 20,
    marginLeft: 8,
  },
  tipsContainer: {
    marginBottom: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  tipNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  supportCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 40,
    alignItems: 'center',
    borderWidth: 1,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  contactCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactIcon: {
    fontSize: 20,
  },
  contactContent: {
    
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  contactDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  contactPhone: {
    fontSize: 16,
    fontWeight: '500',
  },
}); 