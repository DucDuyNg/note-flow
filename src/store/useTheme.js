import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Each entry maps to a `data-theme` value on <html>.
// Add new themes by:
//   1. adding an entry here
//   2. adding the CSS variable overrides in src/styles/theme.css
//   3. (optional) adding a label in src/i18n/locales/*.json under `settings.theme`
export const AVAILABLE_THEMES = ['default', 'blue-on-white'];
const DEFAULT_THEME = 'default';

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: DEFAULT_THEME,
      setTheme: (theme) => {
        if (AVAILABLE_THEMES.includes(theme)) set({ theme });
      },
    }),
    {
      name: 'noteflow:theme',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
