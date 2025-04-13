import { NativeModules, NativeEventEmitter } from 'react-native';

const { Superwall } = NativeModules;

const superwallEmitter = new NativeEventEmitter(Superwall);

let isListenerInitialized = false;

function initializeListeners() {
  if (isListenerInitialized) return;
  isListenerInitialized = true;

  try {
    superwallEmitter.addListener('subscriptionStatusChanged', (status) => {
      console.log('[Superwall] Subscription status changed:', status);
      // TODO: update global state or context if needed
    });

    superwallEmitter.addListener('paywallPresented', (info) => {
      console.log('[Superwall] Paywall presented:', info);
    });

    superwallEmitter.addListener('paywallDismissed', (info) => {
      console.log('[Superwall] Paywall dismissed:', info);
    });

    superwallEmitter.addListener('event', (event) => {
      console.log('[Superwall] Event received:', event);
    });
  } catch (error) {
    console.warn('[Superwall] Failed to initialize event listeners:', error);
  }
}

export function presentPaywall(identifier: string) {
  initializeListeners();

  if (Superwall && typeof Superwall.presentPaywall === 'function') {
    Superwall.presentPaywall(identifier);
  } else {
    console.warn('[Superwall] presentPaywall method not available');
  }
}