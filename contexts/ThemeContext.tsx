import React, { createContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setDarkMode: (value: boolean) => void;
};

export const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: () => {},
  setDarkMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load theme preference from storage on initial load
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('@theme_preference');
        if (storedTheme !== null) {
          setIsDarkMode(storedTheme === 'dark');
        } else {
          // Use system preference as default if no stored preference
          setIsDarkMode(colorScheme === 'dark');
        }
      } catch (e) {
        // Fallback to system preference on error
        setIsDarkMode(colorScheme === 'dark');
      } finally {
        setIsLoaded(true);
      }
    };

    loadThemePreference();
  }, [colorScheme]);

  // Save theme preference to storage when it changes
  useEffect(() => {
    if (isLoaded) {
      const saveThemePreference = async () => {
        try {
          await AsyncStorage.setItem('@theme_preference', isDarkMode ? 'dark' : 'light');
        } catch (e) {
          console.error('Failed to save theme preference', e);
        }
      };

      saveThemePreference();
    }
  }, [isDarkMode, isLoaded]);

  const toggleTheme = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  const setDarkMode = (value: boolean) => {
    setIsDarkMode(value);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 