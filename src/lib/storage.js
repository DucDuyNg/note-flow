// Storage adapter: today uses localStorage; swap to a cloud-backed
// implementation later (Supabase, Firebase, REST) without touching callers.

const STORAGE_KEY = 'noteflow:v1';

export const storage = {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.error('storage.load failed', err);
      return null;
    }
  },
  save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error('storage.save failed', err);
    }
  },
  clear() {
    localStorage.removeItem(STORAGE_KEY);
  },
};
