import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const BottomNavBar = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const [activeTab, setActiveTab] = useState('Home');
  
  // Update active tab based on current route
  useEffect(() => {
    // Extract screen name from route to set active tab
    const currentRouteName = route.name;
    
    if (currentRouteName.includes('Home')) {
      setActiveTab('Home');
    } else if (currentRouteName.includes('Chat')) {
      setActiveTab('Inbox');
    } else if (currentRouteName.includes('Profile')) {
      setActiveTab('Profile');
    } else if (currentRouteName.includes('Settings')) {
      setActiveTab('Settings');
    } else if (currentRouteName.includes('Discover')) {
      setActiveTab('Discover');
    }
  }, [route]);

  const navItems = [
    {
      name: 'Home',
      icon: 'home-outline',
      activeIcon: 'home',
      screen: 'MainTabs',
      params: { screen: 'HomeTab' },
    },
    {
      name: 'Discover',
      icon: 'compass-outline',
      activeIcon: 'compass',
      screen: 'MainTabs', 
      params: { screen: 'HomeTab' }, // Assuming we'll redirect to home for now until Discover tab is available
    },
    {
      name: 'Inbox',
      icon: 'mail-outline',
      activeIcon: 'mail',
      screen: 'MainTabs',
      params: { screen: 'ChatTab' },
    },
    {
      name: 'Profile',
      icon: 'person-outline',
      activeIcon: 'person',
      screen: 'MainTabs',
      params: { screen: 'ProfileTab' },
    },
    {
      name: 'Settings',
      icon: 'settings-outline',
      activeIcon: 'settings',
      screen: 'Settings',
      params: undefined,
    }
  ];

  const handlePress = (tabName: string, screen: string, params: any) => {
    setActiveTab(tabName);
    navigation.navigate(screen as any, params);
  };

  return (
    <View style={styles.container}>
      {navItems.map((item) => {
        const isActive = activeTab === item.name;
        return (
          <TouchableOpacity
            key={item.name}
            style={styles.navItem}
            onPress={() => handlePress(item.name, item.screen, item.params)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isActive ? item.activeIcon : item.icon}
              size={24} 
              color={isActive ? '#0088ff' : '#888888'} 
            />
            <Text style={[
              styles.navLabel, 
              { color: isActive ? '#0088ff' : '#888888' }
            ]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60,
    backgroundColor: '#121212',
    borderTopWidth: 0.5,
    borderTopColor: '#333333',
    paddingBottom: 8,
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  navLabel: {
    fontSize: 12,
    marginTop: 4,
  }
});

export default BottomNavBar;