import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { useAuthStore } from './store/useAuth';
import { useThemeStore } from './store/useTheme';
import { useI18n } from './i18n/useI18n';
import Sidebar from './components/Sidebar';
import LoginScreen from './components/LoginScreen';
import LoadingScreen from './components/LoadingScreen';
import TasksView from './features/tasks/TasksView';
import IdeasView from './features/ideas/IdeasView';
import ProjectsView from './features/projects/ProjectsView';
import SettingsView from './features/settings/SettingsView';

const VIEWS = {
  tasks: TasksView,
  ideas: IdeasView,
  projects: ProjectsView,
  settings: SettingsView,
};

export default function App() {
  const activeView = useAppStore((s) => s.activeView);
  const startSync = useAppStore((s) => s.startSync);
  const stopSync = useAppStore((s) => s.stopSync);
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const theme = useThemeStore((s) => s.theme);
  const { t, lang } = useI18n();
  const ViewComponent = VIEWS[activeView] || TasksView;

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = `${t('app.brand')} — ${t(`nav.${activeView}`)}`;
  }, [activeView, lang, t]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (user?.uid) {
      startSync(user.uid);
      return () => stopSync();
    }
  }, [user?.uid, startSync, stopSync]);

  if (authLoading) return <LoadingScreen />;
  if (!user) return <LoginScreen />;

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <ViewComponent />
      </main>
    </div>
  );
}
