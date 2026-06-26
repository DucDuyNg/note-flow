import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { useAuthStore } from './store/useAuth';
import { useThemeStore } from './store/useTheme';
import { useTeamsStore } from './store/useTeams';
import { useI18n } from './i18n/useI18n';
import Sidebar from './components/Sidebar';
import LoginScreen from './components/LoginScreen';
import LoadingScreen from './components/LoadingScreen';
import UpdateBanner from './components/UpdateBanner';
import UserBadge from './components/UserBadge';
import TasksView from './features/tasks/TasksView';
import IdeasView from './features/ideas/IdeasView';
import ProjectsView from './features/projects/ProjectsView';
import NotesView from './features/notes/NotesView';
import SettingsView from './features/settings/SettingsView';
import TeamsView from './features/teams/TeamsView';

const VIEWS = {
  tasks: TasksView,
  ideas: IdeasView,
  projects: ProjectsView,
  notes: NotesView,
  settings: SettingsView,
  teams: TeamsView,
};

export default function App() {
  const activeView = useAppStore((s) => s.activeView);
  const startSync = useAppStore((s) => s.startSync);
  const stopSync = useAppStore((s) => s.stopSync);
  const workspaceId = useAppStore((s) => s.workspaceId);
  const startTeamsSync = useTeamsStore((s) => s.startSync);
  const stopTeamsSync = useTeamsStore((s) => s.stopSync);
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
      startTeamsSync(user.uid);
      return () => { stopSync(); stopTeamsSync(); };
    }
  }, [user?.uid, startSync, stopSync, startTeamsSync, stopTeamsSync]);

  // Restart data sync when workspace switches
  useEffect(() => {
    if (user?.uid) startSync(user.uid);
  }, [workspaceId, user?.uid, startSync]);

  if (authLoading) return <><UpdateBanner /><LoadingScreen /></>;
  if (!user) return <><UpdateBanner /><LoginScreen /></>;

  return (
    <>
      <UpdateBanner />
      <div className="app">
        <Sidebar />
        <main className="main">
          <ViewComponent />
        </main>
        <div className="user-menu-floating">
          <UserBadge />
        </div>
      </div>
    </>
  );
}
