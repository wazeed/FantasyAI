import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface GreetingHeaderProps {
  userName?: string;
}

const GreetingHeader: React.FC<GreetingHeaderProps> = ({ userName }) => {
  const { isDarkMode } = React.useContext(ThemeContext);
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = userName || user?.email?.split('@')[0] || 'there';

  return (
    <View style={styles.container}>
      <View style={styles.greetingContainer}>
        <Text style={[styles.greetingText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
          {getGreeting()}, {displayName}!
        </Text>
        <Ionicons 
          name="notifications-outline" 
          size={24} 
          color={isDarkMode ? '#FFFFFF' : '#000000'} 
          style={styles.notificationIcon}
        />
      </View>
      <Text style={[styles.subtitle, { color: isDarkMode ? '#AAAAAA' : '#666666' }]}>
        What would you like to explore today?
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  greetingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  notificationIcon: {
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
});

export default GreetingHeader;