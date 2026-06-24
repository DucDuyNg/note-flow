import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId);

// Lazy/guarded init: if .env is missing or incomplete, `app/auth/db` stay null
// and the LoginScreen shows a friendly "not configured" panel instead of a
// blank page from a thrown Firebase error.
export let app = null;
export let auth = null;
export let db = null;
export let googleProvider = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(config);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch (err) {
    console.error('[NoteFlow] Firebase init failed:', err);
  }
} else {
  console.warn(
    '[NoteFlow] Firebase is not configured. Create a .env file (see .env.example) ' +
    'with values from Firebase Console > Project settings > General > Your apps > Web app > Config.',
  );
}
