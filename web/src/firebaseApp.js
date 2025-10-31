import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';

export function createFirebaseApp() {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };

  if (!config.apiKey) {
    throw new Error('Missing Firebase configuration. Did you set the Vite env variables?');
  }

  const existing = getApps();
  const app = existing.length ? existing[0] : initializeApp(config);
  const auth = getAuth(app);

  if (!auth.currentUser) {
    signInAnonymously(auth).catch((error) => {
      console.error('Failed to sign in anonymously', error);
    });
  }

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      signInAnonymously(auth).catch((error) => {
        console.error('Failed to re-authenticate anonymously', error);
      });
    }
  });

  return { app, auth };
}
