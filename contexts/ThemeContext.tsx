import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useContext, // Added useContext import
} from 'react';
import { useColorScheme, Appearance } from 'react-native'; // Appearance might be needed if useColorScheme isn't sufficient or for listeners
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define a constant for the storage key
const THEME_STORAGE_KEY = '@theme_preference';

// Define the shape of the context value using an interface
interface IThemeContextValue {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setDarkMode: (value: boolean) => void;
}

// Create the context with a default value (or undefined and handle in useTheme)
// Providing a default implementation helps with testing and avoids errors if used without a provider initially,
// although the useTheme hook should prevent that in practice.
export const ThemeContext = createContext<IThemeContextValue>({
  isDarkMode: false,
  toggleTheme: () => {
    console.warn('toggleTheme called outside of ThemeProvider');
  },
  setDarkMode: (_value: boolean) => {
    console.warn('setDarkMode called outside of ThemeProvider');
  },
});

// Define the provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme(); // Get the initial system theme
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isThemeLoaded, setIsThemeLoaded] = useState<boolean>(false); // Renamed for clarity

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
    // Depend only on systemColorScheme for initial load or system change *before* user sets preference
  }, [systemColorScheme]);

  // Effect to save the theme preference to storage when it changes *after* initial load
  useEffect(() => {
    // Only save after the initial theme has been loaded
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

  // Memoize the context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(
    () => ({
      isDarkMode,
      toggleTheme,
      setDarkMode,
    }),
    [isDarkMode, toggleTheme, setDarkMode]
  );

  // Render the provider with the memoized value
  // We add a check for isThemeLoaded to prevent rendering children with potentially incorrect theme briefly
  // A loading indicator could be shown here, or null returned, or just render children immediately if flicker is acceptable.
  // For now, rendering children immediately to maintain original behavior.
  return (
    <ThemeContext.Provider value={contextValue}>
      {/* Optionally add loading state handling here if needed */}
      {/* {!isThemeLoaded ? <LoadingIndicator /> : children} */}
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to consume the theme context
export const useTheme = (): IThemeContextValue => {
  const context = useContext(ThemeContext); // Use useContext directly
  if (context === undefined) {
    // This error signifies that the hook is used outside of the ThemeProvider context
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};