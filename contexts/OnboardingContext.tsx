import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Removed incorrect loggingService import

// Key used to store onboarding completion in AsyncStorage
const ONBOARDING_COMPLETED_KEY = 'onboarding_completed';

/**
 * Defines the shape of the Onboarding context value.
 */
interface OnboardingContextInterface {
  /** Whether the user has completed the onboarding flow. */
  hasCompletedOnboarding: boolean;
  /** Marks the onboarding process as completed. */
  completeOnboarding: () => Promise<void>;
  /** Resets the onboarding status (primarily for development/testing). */
  resetOnboarding: () => Promise<void>;
  /** Indicates if the initial onboarding status is still being loaded. */
  isLoading: boolean;
}

const OnboardingContext = createContext<OnboardingContextInterface | undefined>(
  undefined
);

interface OnboardingProviderProps {
  children: ReactNode;
}

/**
 * Provides onboarding state and actions to its children.
 * It checks AsyncStorage on mount to determine the initial onboarding status.
 */
export const OnboardingProvider = ({ children }: OnboardingProviderProps) => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] =
    useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check initial onboarding status from storage on component mount
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
        setHasCompletedOnboarding(value === 'true');
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // Keep default state (false) in case of error
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  // Mark onboarding as completed and save to storage
  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      // Optionally: handle the error more gracefully in the UI if needed
    }
  };

  // Reset onboarding status in storage (for development/testing)
  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
      setHasCompletedOnboarding(false);
    } catch (error) {
      console.error('Error resetting onboarding status:', error);
    }
  };

  const contextValue: OnboardingContextInterface = {
    hasCompletedOnboarding,
    completeOnboarding,
    resetOnboarding,
    isLoading,
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {/* Render children only after initial loading is complete */}
      {!isLoading ? children : null}
      {/* Consider adding a loading indicator here if needed */}
    </OnboardingContext.Provider>
  );
};

/**
 * Custom hook to access the Onboarding context.
 * Throws an error if used outside of an OnboardingProvider.
 * @returns {OnboardingContextInterface} The onboarding context value.
 */
export const useOnboarding = (): OnboardingContextInterface => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};