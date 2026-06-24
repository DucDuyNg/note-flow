import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import vi from './locales/vi.json';
import en from './locales/en.json';

export const LOCALES = { vi, en };
export const AVAILABLE_LANGS = ['vi', 'en'];
const DEFAULT_LANG = 'vi';

function resolvePath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

function interpolate(str, vars) {
  if (typeof str !== 'string' || !vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, key) => (vars[key] !== undefined ? String(vars[key]) : `{${key}}`));
}

export const useI18nStore = create(
  persist(
    (set) => ({
      lang: DEFAULT_LANG,
      setLang: (lang) => {
        if (AVAILABLE_LANGS.includes(lang)) set({ lang });
      },
    }),
    {
      name: 'noteflow:i18n',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/**
 * useI18n — translation hook
 * Usage:
 *   const { t, lang, setLang } = useI18n();
 *   t('nav.tasks')                            → "Tasks"
 *   t('projects.card.taskCount', { done:2, total:5 }) → "2/5 tasks"
 *   Missing key falls back to the key itself.
 */
export function useI18n() {
  const lang = useI18nStore((s) => s.lang);
  const setLang = useI18nStore((s) => s.setLang);
  const dict = LOCALES[lang] || LOCALES[DEFAULT_LANG];

  const t = (key, vars) => {
    const value = resolvePath(dict, key);
    if (value === undefined) {
      const fallback = resolvePath(LOCALES[DEFAULT_LANG], key);
      return interpolate(fallback ?? key, vars);
    }
    return interpolate(value, vars);
  };

  return { t, lang, setLang };
}
