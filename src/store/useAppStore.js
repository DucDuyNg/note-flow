import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  onSnapshot,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from './useAuth';
import { workspaceCol, workspaceDoc, PERSONAL_WORKSPACE } from '../lib/firestorePaths';
import { newId } from '../lib/id';
import { todayIso } from '../lib/date';

const COLLECTIONS = ['tasks', 'ideas', 'projects', 'notes'];

const SEED_FACTORY = () => {
  const projectId = newId('prj');
  const now = todayIso();
  return {
    projects: [
      { id: projectId, name: 'Học React nâng cao', description: 'Hoàn thành khóa học và làm 1 dự án thực tế.', color: '#6366f1', category: 'work', createdAt: now },
    ],
    tasks: [
      { id: newId('tsk'), title: 'Đọc tài liệu React 18', description: 'Tập trung phần Suspense và Server Components.', status: 'doing', priority: 'medium', category: 'work', projectId, dueDate: null, createdAt: now, updatedAt: now },
      { id: newId('tsk'), title: 'Tập gym 3 buổi/tuần', description: '', status: 'todo', priority: 'high', category: 'personal', projectId: null, dueDate: null, createdAt: now, updatedAt: now },
    ],
    ideas: [
      { id: newId('idea'), title: 'App theo dõi thói quen', content: 'Một app gọn nhẹ chỉ làm streak + biểu đồ tuần, không gamify quá tay.', tags: ['mobile', 'habit'], category: 'personal', createdAt: now, updatedAt: now },
    ],
  };
};

const _uid = () => useAuthStore.getState().user?.uid;

export const useAppStore = create(
  persist(
    (set, get) => ({
      tasks: [],
      ideas: [],
      projects: [],
      notes: [],
      activeView: 'tasks',
      filters: { category: 'all', projectId: 'all', search: '', status: 'all' },
      // Which workspace data we're looking at: 'personal' or a teamId.
      // Persisted to localStorage so it survives reloads.
      workspaceId: PERSONAL_WORKSPACE,
      ready: false,
      _unsubs: [],

      setActiveView: (view) => set({ activeView: view }),
      setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
      resetFilters: () => set({ filters: { category: 'all', projectId: 'all', search: '', status: 'all' } }),

      setWorkspace: (workspaceId) => {
        if (get().workspaceId === workspaceId) return;
        set({ workspaceId, filters: { category: 'all', projectId: 'all', search: '', status: 'all' } });
        const uid = _uid();
        if (uid) get().startSync(uid);
      },

      startSync: (uid) => {
        get().stopSync();
        const workspaceId = get().workspaceId;
        const unsubs = COLLECTIONS.map((col) => {
          const q = query(workspaceCol(uid, workspaceId, col), orderBy('createdAt', 'desc'));
          return onSnapshot(
            q,
            (snap) => {
              const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
              set({ [col]: items });
            },
            (err) => console.error(`Firestore listener (${col}) error:`, err),
          );
        });
        set({ _unsubs: unsubs, ready: true });
      },

      stopSync: () => {
        get()._unsubs.forEach((u) => { try { u(); } catch {} });
        set({ _unsubs: [], tasks: [], ideas: [], projects: [], notes: [], ready: false });
      },

      // ===== Tasks =====
      addTask: async (data) => {
        const uid = _uid();
        if (!uid) return;
        const wsId = get().workspaceId;
        const now = todayIso();
        const id = newId('tsk');
        await setDoc(workspaceDoc(uid, wsId, 'tasks', id), {
          title: data.title?.trim() || 'Untitled',
          description: data.description || '',
          status: data.status || 'todo',
          priority: data.priority || 'medium',
          category: data.category || 'work',
          projectId: data.projectId || null,
          dueDate: data.dueDate || null,
          createdBy: uid,
          createdAt: now,
          updatedAt: now,
        });
      },
      updateTask: async (id, patch) => {
        const uid = _uid();
        if (!uid) return;
        await setDoc(workspaceDoc(uid, get().workspaceId, 'tasks', id), { ...patch, updatedAt: todayIso() }, { merge: true });
      },
      deleteTask: async (id) => {
        const uid = _uid();
        if (!uid) return;
        await deleteDoc(workspaceDoc(uid, get().workspaceId, 'tasks', id));
      },
      setTaskStatus: (id, status) => get().updateTask(id, { status }),

      // ===== Ideas =====
      addIdea: async (data) => {
        const uid = _uid();
        if (!uid) return;
        const wsId = get().workspaceId;
        const now = todayIso();
        const id = newId('idea');
        await setDoc(workspaceDoc(uid, wsId, 'ideas', id), {
          title: data.title?.trim() || 'Untitled idea',
          content: data.content || '',
          tags: data.tags || [],
          category: data.category || 'personal',
          createdBy: uid,
          createdAt: now,
          updatedAt: now,
        });
      },
      updateIdea: async (id, patch) => {
        const uid = _uid();
        if (!uid) return;
        await setDoc(workspaceDoc(uid, get().workspaceId, 'ideas', id), { ...patch, updatedAt: todayIso() }, { merge: true });
      },
      deleteIdea: async (id) => {
        const uid = _uid();
        if (!uid) return;
        await deleteDoc(workspaceDoc(uid, get().workspaceId, 'ideas', id));
      },

      // ===== Projects =====
      addProject: async (data) => {
        const uid = _uid();
        if (!uid) return;
        const wsId = get().workspaceId;
        const id = newId('prj');
        await setDoc(workspaceDoc(uid, wsId, 'projects', id), {
          name: data.name?.trim() || 'Untitled project',
          description: data.description || '',
          color: data.color || '#6366f1',
          category: data.category || 'work',
          createdBy: uid,
          createdAt: todayIso(),
        });
      },
      updateProject: async (id, patch) => {
        const uid = _uid();
        if (!uid) return;
        await setDoc(workspaceDoc(uid, get().workspaceId, 'projects', id), patch, { merge: true });
      },
      deleteProject: async (id) => {
        const uid = _uid();
        if (!uid) return;
        const wsId = get().workspaceId;
        const tasksOfProject = get().tasks.filter((t) => t.projectId === id);
        const batch = writeBatch(db);
        tasksOfProject.forEach((t) => {
          batch.set(workspaceDoc(uid, wsId, 'tasks', t.id), { projectId: null, updatedAt: todayIso() }, { merge: true });
        });
        batch.delete(workspaceDoc(uid, wsId, 'projects', id));
        await batch.commit();
      },

      // ===== Notes (iOS-style freeform quick capture) =====
      addNote: async (data = {}) => {
        const uid = _uid();
        if (!uid) return null;
        const wsId = get().workspaceId;
        const now = todayIso();
        const id = newId('note');
        await setDoc(workspaceDoc(uid, wsId, 'notes', id), {
          title: data.title || '',
          content: data.content || '',
          pinned: false,
          createdBy: uid,
          createdAt: now,
          updatedAt: now,
        });
        return id;
      },
      updateNote: async (id, patch) => {
        const uid = _uid();
        if (!uid) return;
        await setDoc(
          workspaceDoc(uid, get().workspaceId, 'notes', id),
          { ...patch, updatedAt: todayIso() },
          { merge: true },
        );
      },
      deleteNote: async (id) => {
        const uid = _uid();
        if (!uid) return;
        await deleteDoc(workspaceDoc(uid, get().workspaceId, 'notes', id));
      },
      toggleNotePin: async (id, pinned) => {
        const uid = _uid();
        if (!uid) return;
        await setDoc(
          workspaceDoc(uid, get().workspaceId, 'notes', id),
          { pinned: !!pinned, updatedAt: todayIso() },
          { merge: true },
        );
      },

      // ===== Data import / export =====
      exportData: () => {
        const { tasks, ideas, projects, notes } = get();
        return JSON.stringify({ version: 3, exportedAt: todayIso(), tasks, ideas, projects, notes }, null, 2);
      },

      importData: async (payload) => {
        const uid = _uid();
        if (!uid) throw new Error('Not signed in');
        if (!payload || typeof payload !== 'object') throw new Error('Invalid payload');
        const wsId = get().workspaceId;
        const batch = writeBatch(db);
        COLLECTIONS.forEach((col) => {
          const arr = Array.isArray(payload[col]) ? payload[col] : [];
          arr.forEach((item) => {
            const { id, ...rest } = item;
            const docId = id || newId(col.slice(0, 3));
            batch.set(workspaceDoc(uid, wsId, col, docId), rest);
          });
        });
        await batch.commit();
      },

      clearAll: async () => {
        const uid = _uid();
        if (!uid) return;
        const wsId = get().workspaceId;
        for (const col of COLLECTIONS) {
          const snap = await getDocs(workspaceCol(uid, wsId, col));
          if (snap.empty) continue;
          const batch = writeBatch(db);
          snap.docs.forEach((d) => batch.delete(d.ref));
          await batch.commit();
        }
      },

      loadSeed: async () => {
        const uid = _uid();
        if (!uid) return;
        const wsId = get().workspaceId;
        const seed = SEED_FACTORY();
        const batch = writeBatch(db);
        COLLECTIONS.forEach((col) => {
          seed[col].forEach((item) => {
            const { id, ...rest } = item;
            batch.set(workspaceDoc(uid, wsId, col, id), rest);
          });
        });
        await batch.commit();
      },
    }),
    {
      name: 'noteflow:workspace',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ workspaceId: s.workspaceId }),
    },
  ),
);
