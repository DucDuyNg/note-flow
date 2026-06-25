import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useTeamsStore } from '../store/useTeams';
import { useI18n } from '../i18n/useI18n';
import { PERSONAL_WORKSPACE } from '../lib/firestorePaths';

/**
 * Workspace switcher displayed at the top of the sidebar (desktop).
 * Shows the current workspace prominently and opens a panel with all
 * available workspaces + a link to manage teams. Hidden on mobile —
 * mobile users switch via the user menu in the bottom tab bar.
 */
export default function WorkspaceSwitcher() {
  const workspaceId = useAppStore((s) => s.workspaceId);
  const setWorkspace = useAppStore((s) => s.setWorkspace);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const teams = useTeamsStore((s) => s.teams);
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const isPersonal = workspaceId === PERSONAL_WORKSPACE;
  const activeTeam = teams.find((tm) => tm.id === workspaceId);
  const currentName = isPersonal ? t('teams.personal') : (activeTeam?.name || t('teams.unknownWorkspace'));
  const currentIcon = isPersonal ? '👤' : '👥';

  const pick = (id) => { setWorkspace(id); setOpen(false); };
  const goManage = () => { setActiveView('teams'); setOpen(false); };

  return (
    <div className="ws-switcher" ref={wrapRef}>
      <button
        className={`ws-switcher__trigger ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="ws-switcher__icon" aria-hidden="true">{currentIcon}</span>
        <div className="ws-switcher__info">
          <div className="ws-switcher__label">{t('teams.currentWorkspace')}</div>
          <div className="ws-switcher__name">{currentName}</div>
        </div>
        <span className="ws-switcher__chevron" aria-hidden="true">⌄</span>
      </button>

      {open && (
        <div className="ws-switcher__panel" role="menu">
          <div className="ws-switcher__section-label">{t('teams.switchTo')}</div>

          <button
            className={`ws-switcher__option ${isPersonal ? 'is-active' : ''}`}
            onClick={() => pick(PERSONAL_WORKSPACE)}
            role="menuitem"
          >
            <span className="ws-switcher__option-icon" aria-hidden="true">👤</span>
            <div className="ws-switcher__option-text">
              <div className="ws-switcher__option-name">{t('teams.personal')}</div>
              <div className="ws-switcher__option-desc">{t('teams.personalDesc')}</div>
            </div>
            {isPersonal && <span className="ws-switcher__check" aria-hidden="true">✓</span>}
          </button>

          {teams.map((tm) => (
            <button
              key={tm.id}
              className={`ws-switcher__option ${workspaceId === tm.id ? 'is-active' : ''}`}
              onClick={() => pick(tm.id)}
              role="menuitem"
            >
              <span className="ws-switcher__option-icon" aria-hidden="true">👥</span>
              <div className="ws-switcher__option-text">
                <div className="ws-switcher__option-name">{tm.name}</div>
                <div className="ws-switcher__option-desc">
                  {t('teams.memberCount', { count: tm.memberIds.length })}
                </div>
              </div>
              {workspaceId === tm.id && <span className="ws-switcher__check" aria-hidden="true">✓</span>}
            </button>
          ))}

          <div className="ws-switcher__divider" />

          <button className="ws-switcher__option ws-switcher__option--action" onClick={goManage} role="menuitem">
            <span className="ws-switcher__option-icon" aria-hidden="true">＋</span>
            <div className="ws-switcher__option-text">
              <div className="ws-switcher__option-name">{t('teams.manage')}</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
