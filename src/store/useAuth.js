import { create } from 'zustand';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase';

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  error: null,
  signInWithGoogle: async () => {
    set({ error: null });
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      // popup-closed-by-user is benign, don't surface it
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

if (isFirebaseConfigured) {
  onAuthStateChanged(auth, (user) => {
    useAuthStore.setState({ user, loading: false });
  });
} else {
  useAuthStore.setState({ loading: false });
}
