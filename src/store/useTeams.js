import { create } from 'zustand';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from './useAuth';
import { newId } from '../lib/id';
import { todayIso } from '../lib/date';

const _uid = () => useAuthStore.getState().user?.uid;
const _user = () => useAuthStore.getState().user;

export const useTeamsStore = create((set, get) => ({
  teams: [],          // teams the current user belongs to
  loading: false,
  _unsub: null,

  startSync: (uid) => {
    get().stopSync();
    if (!uid) return;
    set({ loading: true });
    const q = query(collection(db, 'teams'), where('memberIds', 'array-contains', uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const teams = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
        set({ teams, loading: false });
      },
      (err) => {
        console.error('Teams listener error:', err);
        set({ loading: false });
      },
    );
    set({ _unsub: unsub });
  },

  stopSync: () => {
    const unsub = get()._unsub;
    if (unsub) { try { unsub(); } catch {} }
    set({ _unsub: null, teams: [] });
  },

  createTeam: async (name) => {
    const user = _user();
    if (!user) throw new Error('Not signed in');
    const trimmed = name?.trim();
    if (!trimmed) throw new Error('Team name required');
    const teamId = newId('team');
    const memberInfo = {
      [user.uid]: {
        displayName: user.displayName || '',
        email: user.email || '',
        photoURL: user.photoURL || '',
      },
    };
    await setDoc(doc(db, 'teams', teamId), {
      name: trimmed,
      ownerId: user.uid,
      memberIds: [user.uid],
      memberInfo,
      createdAt: todayIso(),
    });
    return teamId;
  },

  /**
   * Add a member by email. The invitee must already have signed in to the app
   * (so userLookup/{email} exists). If not found, throws.
   * Returns the added user's info.
   */
  inviteByEmail: async (teamId, email) => {
    const uid = _uid();
    if (!uid) throw new Error('Not signed in');
    const emailKey = email?.trim().toLowerCase();
    if (!emailKey) throw new Error('Email required');

    // Look up the user by email
    const lookupSnap = await getDoc(doc(db, 'userLookup', emailKey));
    if (!lookupSnap.exists()) {
      const err = new Error('USER_NOT_FOUND');
      err.code = 'USER_NOT_FOUND';
      throw err;
    }
    const lookup = lookupSnap.data();
    if (lookup.uid === uid) {
      const err = new Error('SELF_INVITE');
      err.code = 'SELF_INVITE';
      throw err;
    }

    // Check team membership
    const teamSnap = await getDoc(doc(db, 'teams', teamId));
    if (!teamSnap.exists()) throw new Error('Team not found');
    const team = teamSnap.data();
    if (team.memberIds.includes(lookup.uid)) {
      const err = new Error('ALREADY_MEMBER');
      err.code = 'ALREADY_MEMBER';
      throw err;
    }

    // Add to team
    await updateDoc(doc(db, 'teams', teamId), {
      memberIds: arrayUnion(lookup.uid),
      [`memberInfo.${lookup.uid}`]: {
        displayName: lookup.displayName || '',
        email: lookup.email || '',
        photoURL: lookup.photoURL || '',
      },
    });
    return { uid: lookup.uid, ...lookup };
  },

  removeMember: async (teamId, memberUid) => {
    const uid = _uid();
    if (!uid) throw new Error('Not signed in');
    const updates = {
      memberIds: arrayRemove(memberUid),
    };
    // arrayRemove only works on top-level arrays; for nested fields we set to null via dot notation
    // and Firestore treats this as removing the field if we use FieldValue.delete()
    // Simpler: just leave memberInfo entry; UI uses memberIds as source of truth.
    await updateDoc(doc(db, 'teams', teamId), updates);
  },

  leaveTeam: async (teamId) => {
    const uid = _uid();
    if (!uid) throw new Error('Not signed in');
    await updateDoc(doc(db, 'teams', teamId), {
      memberIds: arrayRemove(uid),
    });
  },

  deleteTeam: async (teamId) => {
    const uid = _uid();
    if (!uid) throw new Error('Not signed in');
    await deleteDoc(doc(db, 'teams', teamId));
  },

  renameTeam: async (teamId, name) => {
    const trimmed = name?.trim();
    if (!trimmed) return;
    await updateDoc(doc(db, 'teams', teamId), { name: trimmed });
  },
}));
