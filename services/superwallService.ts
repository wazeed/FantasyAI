import { NativeModules, NativeEventEmitter } from 'react-native';

const { Superwall } = NativeModules;

const superwallEmitter = new NativeEventEmitter(Superwall);

/**
 * Registers a callback for subscription status changes.
 * Returns an unsubscribe function.
 */
export function initializeSubscriptionListener(
  onStatusChange: (status: string) => void
): () => void {
  const subscription = superwallEmitter.addListener(
    'subscriptionStatusChanged',
    (status) => {
      console.log('[Superwall] Subscription status changed:', status);
      onStatusChange?.(status);
    }
  );
  // Optionally, add more listeners here if needed

  return () => {
    subscription.remove();
  };
}

/**
 * Optionally, provide a stub for getting initial subscription status.
 * If the SDK supports this, implement accordingly.
 * For now, returns null (unknown).
 */
export async function getInitialSubscriptionStatus(): Promise<string | null> {
  // If Superwall exposes a method to get current status, use it here.
  // For now, return null to indicate unknown/loading.
  return null;
}

export function presentPaywall(identifier: string) {
  if (Superwall && typeof Superwall.presentPaywall === 'function') {
    Superwall.presentPaywall(identifier);
  } else {
    console.warn('[Superwall] presentPaywall method not available');
  }
}