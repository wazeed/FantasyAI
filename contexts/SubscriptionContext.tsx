import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initializeSubscriptionListener, getInitialSubscriptionStatus } from '../services/superwallService';

export interface SubscriptionContextValue {
  isSubscribed: boolean | null; // null = loading/unknown
  isLoading: boolean;
  error: string | null;
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  isSubscribed: null,
  isLoading: true,
  error: null,
});

export function useSubscription() {
  return useContext(SubscriptionContext);
}

interface Props {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: Props) {
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // Optionally, get initial status from Superwall if available
    async function fetchInitialStatus() {
      setIsLoading(true);
      setError(null);
      try {
        if (getInitialSubscriptionStatus) {
          const status = await getInitialSubscriptionStatus();
          if (mounted) setIsSubscribed(status === 'active');
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to get subscription status');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchInitialStatus();

    // Register listener for subscription changes
    const unsubscribe = initializeSubscriptionListener((status: string) => {
      setIsSubscribed(status === 'active');
    });

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <SubscriptionContext.Provider value={{ isSubscribed, isLoading, error }}>
      {children}
    </SubscriptionContext.Provider>
  );
}