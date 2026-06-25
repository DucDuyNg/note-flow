import { create } from 'zustand';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db, isFirebaseConfigured } from '../lib/firebase';

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  error: null,
  signInWithGoogle: async () => {
    set({ error: null });
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        set({ error: err.message || String(err) });
      }
    }
  },
  signOut: async () => {
    await fbSignOut(auth);
  },
  clearError: () => set({ error: null }),
}));

// On sign-in, upsert userLookup/{emailLower} so teams can invite by email.
async function ensureUserLookup(user) {
  if (!user?.email) return;
  try {
    const emailKey = user.email.toLowerCase();
    await setDoc(
      doc(db, 'userLookup', emailKey),
      {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  } catch (err) {
    console.warn('Failed to update userLookup:', err?.message);
  }
}

if (isFirebaseConfigured) {
  onAuthStateChanged(auth, (user) => {
    useAuthStore.setState({ user, loading: false });
    if (user) ensureUserLookup(user);
  });
} else {
  useAuthStore.setState({ loading: false });
}
