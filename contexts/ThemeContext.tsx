import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useContext,
} from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define a constant for the storage key
const THEME_STORAGE_KEY = '@theme_preference';

// Define theme colors for consistent usage throughout the app
export const lightThemeColors = {
  background: '#FFFFFF',
  card: '#FFFFFF',
  text: '#000000',
  secondaryText: '#666666',
  border: '#E0E0E0',
  primary: '#3498DB',
  primaryDark: '#2980B9',
  accent: '#FF6B6B',
  success: '#2ECC71',
  error: '#E74C3C',
  warning: '#F39C12',
  info: '#3498DB',
  gradientStart: '#3498DB',
  gradientEnd: '#2ED9C3',
  tileBg: '#F8F9FA',
  tileBorder: '#EAEAEA',
  inputBackground: '#F5F5F5',
  buttonText: '#FFFFFF',
  icon: '#333333',
  shadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  tabBar: '#FFFFFF',
  tabBarActive: '#3498DB',
  tabBarInactive: '#888888',
  cardBg: '#FFFFFF',
};

export const darkThemeColors = {
  background: '#121212',
  card: '#1E1E1E',
  text: '#FFFFFF',
  secondaryText: '#AAAAAA',
  border: '#333333',
  primary: '#3498DB',
  primaryDark: '#2980B9',
  accent: '#FF6B6B',
  success: '#2ECC71',
  error: '#E74C3C',
  warning: '#F39C12',
  info: '#3498DB',
  gradientStart: '#2A63D4',
  gradientEnd: '#7F58D3',
  tileBg: '#252525',
  tileBorder: '#333333',
  inputBackground: '#2A2A2A',
  buttonText: '#FFFFFF',
  icon: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  tabBar: '#1A1A1A',
  tabBarActive: '#3498DB',
  tabBarInactive: '#888888',
  cardBg: '#252525',
};

// Define common styles that can be used across components
export const getCommonStyles = (isDark: boolean) => {
  const colors = isDark ? darkThemeColors : lightThemeColors;
  
  // Define font styles to be used throughout the app
  const fonts = {
    regular: 'System', // Default system font
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
    // Font weight mappings for consistent usage
    weights: {
      regular: '400',
      medium: '500',
      semiBold: '600',
      bold: '700'
    }
  };
  
  return {
    colors,
    fonts, // Add fonts to the style object
    // Common text styles
    headerText: {
      fontSize: 34,
      fontWeight: '700' as const, // Use 'as const' for type safety
      color: colors.text,
      fontFamily: fonts.regular,
    },
    subheadingText: {
      fontSize: 18,
      color: colors.secondaryText,
      fontWeight: 'normal' as const, // Reverted from '400' back to 'normal'
    },
    bodyText: {
      fontSize: 16,
      color: colors.text,
    },
    // Common container styles
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginVertical: 8,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    // Button styles
    primaryButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 20,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    primaryButtonText: {
      color: colors.buttonText,
      fontSize: 16,
      fontWeight: '600' as const, // Use 'as const' for type safety
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.primary,
      paddingVertical: 14,
      paddingHorizontal: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '600' as const, // Use 'as const' for type safety
    },
    // Input styles
    input: {
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
      color: colors.text,
      fontSize: 16,
    },
    // Other common styles
    shadow: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
  };
};

// Define the shape of the context value using an interface
interface IThemeContextValue {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setDarkMode: (value: boolean) => void;
  colors: typeof darkThemeColors;
  styles: ReturnType<typeof getCommonStyles>;
}

// Create the context with a default value
export const ThemeContext = createContext<IThemeContextValue>({
  isDarkMode: false,
  toggleTheme: () => {
    console.warn('toggleTheme called outside of ThemeProvider');
  },
  setDarkMode: (_value: boolean) => {
    console.warn('setDarkMode called outside of ThemeProvider');
  },
  colors: lightThemeColors,
  styles: getCommonStyles(false),
});

// Define the provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme(); // Get the initial system theme
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isThemeLoaded, setIsThemeLoaded] = useState<boolean>(false);

  // Effect to load the theme preference from storage or use system default
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (storedTheme !== null) {
          setIsDarkMode(storedTheme === 'dark');
        } else {
          // Use system preference if no stored preference exists
          setIsDarkMode(systemColorScheme === 'dark');
        }
      } catch (error) {
        console.error('Failed to load theme preference, using system default.', error);
        // Fallback to system preference on error
        setIsDarkMode(systemColorScheme === 'dark');
      } finally {
        setIsThemeLoaded(true);
      }
    };

    loadTheme();
  }, [systemColorScheme]);

  // Effect to save the theme preference to storage when it changes
  useEffect(() => {
    if (isThemeLoaded) {
      const saveTheme = async () => {
        try {
          await AsyncStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? 'dark' : 'light');
        } catch (error) {
          console.error('Failed to save theme preference', error);
        }
      };
      saveTheme();
    }
  }, [isDarkMode, isThemeLoaded]);

  // Memoize toggleTheme function
  const toggleTheme = useCallback(() => {
    setIsDarkMode(prevMode => !prevMode);
  }, []);

  // Memoize setDarkMode function
  const setDarkMode = useCallback((value: boolean) => {
    setIsDarkMode(value);
  }, []);

  // Get current theme colors
  const colors = useMemo(() => 
    isDarkMode ? darkThemeColors : lightThemeColors, 
    [isDarkMode]
  );

  // Get common styles
  const styles = useMemo(() => 
    getCommonStyles(isDarkMode),
    [isDarkMode]
  );

  // Memoize the context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(
    () => ({
      isDarkMode,
      toggleTheme,
      setDarkMode,
      colors,
      styles,
    }),
    [isDarkMode, toggleTheme, setDarkMode, colors, styles]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to consume the theme context
export const useTheme = (): IThemeContextValue => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};