import { useAppStore } from '../store/useAppStore';
import { useI18n } from '../i18n/useI18n';
import { getCurrentVersion } from '../lib/useUpdateCheck';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import {
  PiCheckSquareFill,
  PiNotePencilFill,
  PiLightbulbFill,
  PiFolderFill,
} from 'react-icons/pi';

const NAV = [
  { key: 'tasks',    icon: PiCheckSquareFill, count: (s) => s.tasks.filter((t) => t.status !== 'done').length },
  { key: 'notes',    icon: PiNotePencilFill,  count: (s) => s.notes.length },
  { key: 'ideas',    icon: PiLightbulbFill,   count: (s) => s.ideas.length },
  { key: 'projects', icon: PiFolderFill,      count: (s) => s.projects.length },
];

export default function Sidebar() {
  const activeView = useAppStore((s) => s.activeView);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const state = useAppStore();
  const { t } = useI18n();

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__brand-icon">N</div>
        <span>{t('app.brand')}</span>
      </div>
      <WorkspaceSwitcher />
      <nav className="sidebar__nav">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              className={`nav-item ${activeView === item.key ? 'is-active' : ''}`}
              onClick={() => setActiveView(item.key)}
            >
              <span className="nav-item__icon" aria-hidden="true"><Icon /></span>
              <span>{t(`nav.${item.key}`)}</span>
              {item.count && <span className="nav-item__count">{item.count(state)}</span>}
            </button>
          );
        })}
      </nav>
      <div className="sidebar__footer">{t('app.footer', { version: getCurrentVersion() })}</div>
    </aside>
  );
}
