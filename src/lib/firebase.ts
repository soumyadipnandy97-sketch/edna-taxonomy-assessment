import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics, isSupported, logEvent, type Analytics } from 'firebase/analytics';
import firebaseConfig from '../../firebase-applet-config.json';

const mergedConfig = {
  ...firebaseConfig,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  measurementId:
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfig.measurementId || undefined,
};

export const firebaseApp = getApps().length ? getApps()[0] : initializeApp(mergedConfig);
export const auth = getAuth(firebaseApp);
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({ prompt: 'select_account' });

let analyticsInstance: Analytics | null = null;
let analyticsInitialized = false;

export const firebaseStatus = {
  configured: Boolean(mergedConfig.projectId && mergedConfig.apiKey),
  projectId: mergedConfig.projectId || '',
  hasAnalytics: Boolean(mergedConfig.measurementId),
  hasMessagingSender: Boolean(mergedConfig.messagingSenderId),
};

export async function initFirebaseAnalytics(): Promise<Analytics | null> {
  if (analyticsInitialized) return analyticsInstance;
  analyticsInitialized = true;
  if (!mergedConfig.measurementId) {
    return null;
  }
  try {
    const supported = await isSupported();
    if (supported) {
      analyticsInstance = getAnalytics(firebaseApp);
      return analyticsInstance;
    }
  } catch {
    // Analytics gracefully disabled if blocked or unavailable in sandboxed iframe
  }
  return null;
}

export function trackScientificEvent(eventName: string, params?: Record<string, string | number>) {
  if (analyticsInstance) {
    try {
      logEvent(analyticsInstance, eventName, params);
    } catch {
      // Non-blocking telemetry
    }
  }
}
