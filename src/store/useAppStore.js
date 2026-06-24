import { create } from 'zustand';
import {
  collection,
  doc,
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
import { newId } from '../lib/id';
import { todayIso } from '../lib/date';

// ===== Firestore layout =====
// users/{uid}/tasks/{taskId}
// users/{uid}/ideas/{ideaId}
// users/{uid}/projects/{projectId}
const COLLECTIONS = ['tasks', 'ideas', 'projects'];

const userCol = (uid, col) => collection(db, 'users', uid, col);
const userDoc = (uid, col, id) => doc(db, 'users', uid, col, id);

const SEED_FACTORY = () => {
  const projectId = newId('prj');
  const now = todayIso();
  return {
    projects: [
      {
        id: projectId,
        name: 'Học React nâng cao',
        description: 'Hoàn thành khóa học và làm 1 dự án thực tế.',
        color: '#6366f1',
        category: 'work',
        createdAt: now,
      },
    ],
    tasks: [
      {
        id: newId('tsk'),
        title: 'Đọc tài liệu React 18',
        description: 'Tập trung phần Suspense và Server Components.',
        status: 'doing',
        priority: 'medium',
        category: 'work',
        projectId,
        dueDate: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: newId('tsk'),
        title: 'Tập gym 3 buổi/tuần',
        description: '',
        status: 'todo',
        priority: 'high',
        category: 'personal',
        projectId: null,
        dueDate: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    ideas: [
      {
        id: newId('idea'),
        title: 'App theo dõi thói quen',
        content: 'Một app gọn nhẹ chỉ làm streak + biểu đồ tuần, không gamify quá tay.',
        tags: ['mobile', 'habit'],
        category: 'personal',
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
};

const _uid = () => useAuthStore.getState().user?.uid;

export const useAppStore = create((set, get) => ({
  tasks: [],
  ideas: [],
  projects: [],
  activeView: 'tasks',
  filters: { category: 'all', projectId: 'all', search: '' },
  ready: false,
  _unsubs: [],

  setActiveView: (view) => set({ activeView: view }),
  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
  resetFilters: () => set({ filters: { category: 'all', projectId: 'all', search: '' } }),

  startSync: (uid) => {
    get().stopSync();
    const unsubs = COLLECTIONS.map((col) => {
      const q = query(userCol(uid, col), orderBy('createdAt', 'desc'));
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
    set({ _unsubs: [], tasks: [], ideas: [], projects: [], ready: false });
  },

  // ===== Tasks =====
  addTask: async (data) => {
    const uid = _uid();
    if (!uid) return;
    const now = todayIso();
    const id = newId('tsk');
    await setDoc(userDoc(uid, 'tasks', id), {
      title: data.title?.trim() || 'Untitled',
      description: data.description || '',
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      category: data.category || 'work',
      projectId: data.projectId || null,
      dueDate: data.dueDate || null,
      createdAt: now,
      updatedAt: now,
    });
  },
  updateTask: async (id, patch) => {
    const uid = _uid();
    if (!uid) return;
    await setDoc(userDoc(uid, 'tasks', id), { ...patch, updatedAt: todayIso() }, { merge: true });
  },
  deleteTask: async (id) => {
    const uid = _uid();
    if (!uid) return;
    await deleteDoc(userDoc(uid, 'tasks', id));
  },
  setTaskStatus: (id, status) => get().updateTask(id, { status }),

  // ===== Ideas =====
  addIdea: async (data) => {
    const uid = _uid();
    if (!uid) return;
    const now = todayIso();
    const id = newId('idea');
    await setDoc(userDoc(uid, 'ideas', id), {
      title: data.title?.trim() || 'Untitled idea',
      content: data.content || '',
      tags: data.tags || [],
      category: data.category || 'personal',
      createdAt: now,
      updatedAt: now,
    });
  },
  updateIdea: async (id, patch) => {
    const uid = _uid();
    if (!uid) return;
    await setDoc(userDoc(uid, 'ideas', id), { ...patch, updatedAt: todayIso() }, { merge: true });
  },
  deleteIdea: async (id) => {
    const uid = _uid();
    if (!uid) return;
    await deleteDoc(userDoc(uid, 'ideas', id));
  },

  // ===== Projects =====
  addProject: async (data) => {
    const uid = _uid();
    if (!uid) return;
    const id = newId('prj');
    await setDoc(userDoc(uid, 'projects', id), {
      name: data.name?.trim() || 'Untitled project',
      description: data.description || '',
      color: data.color || '#6366f1',
      category: data.category || 'work',
      createdAt: todayIso(),
    });
  },
  updateProject: async (id, patch) => {
    const uid = _uid();
    if (!uid) return;
    await setDoc(userDoc(uid, 'projects', id), patch, { merge: true });
  },
  deleteProject: async (id) => {
    const uid = _uid();
    if (!uid) return;
    // Detach tasks belonging to this project (set projectId = null) before deleting.
    const tasksOfProject = get().tasks.filter((t) => t.projectId === id);
    const batch = writeBatch(db);
    tasksOfProject.forEach((t) => {
      batch.set(userDoc(uid, 'tasks', t.id), { projectId: null, updatedAt: todayIso() }, { merge: true });
    });
    batch.delete(userDoc(uid, 'projects', id));
    await batch.commit();
  },

  // ===== Data import / export =====
  exportData: () => {
    const { tasks, ideas, projects } = get();
    return JSON.stringify({ version: 2, exportedAt: todayIso(), tasks, ideas, projects }, null, 2);
  },

  importData: async (payload) => {
    const uid = _uid();
    if (!uid) throw new Error('Not signed in');
    if (!payload || typeof payload !== 'object') throw new Error('Invalid payload');
    const batch = writeBatch(db);
    COLLECTIONS.forEach((col) => {
      const arr = Array.isArray(payload[col]) ? payload[col] : [];
      arr.forEach((item) => {
        const { id, ...rest } = item;
        const docId = id || newId(col.slice(0, 3));
        batch.set(userDoc(uid, col, docId), rest);
      });
    });
    await batch.commit();
  },

  clearAll: async () => {
    const uid = _uid();
    if (!uid) return;
    for (const col of COLLECTIONS) {
      const snap = await getDocs(userCol(uid, col));
      if (snap.empty) continue;
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  },

  loadSeed: async () => {
    const uid = _uid();
    if (!uid) return;
    const seed = SEED_FACTORY();
    const batch = writeBatch(db);
    COLLECTIONS.forEach((col) => {
      seed[col].forEach((item) => {
        const { id, ...rest } = item;
        batch.set(userDoc(uid, col, id), rest);
      });
    });
    await batch.commit();
  },
}));
