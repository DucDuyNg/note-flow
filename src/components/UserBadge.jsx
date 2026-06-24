import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/useAuth';
import { useAppStore } from '../store/useAppStore';
import { useI18n } from '../i18n/useI18n';

export default function UserBadge() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  const name = user.displayName || user.email || 'User';
  const initial = name.trim()[0]?.toUpperCase() || '?';

  const goSettings = () => { setActiveView('settings'); setOpen(false); };
  const handleSignOut = () => { setOpen(false); signOut(); };

  const renderAvatar = (size) => user.photoURL ? (
    <img
      className="user-menu__avatar"
      style={{ width: size, height: size }}
      src={user.photoURL}
      alt=""
      referrerPolicy="no-referrer"
    />
  ) : (
    <div
      className="user-menu__avatar user-menu__avatar--fallback"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {initial}
    </div>
  );

  return (
    <div className="user-menu" ref={wrapRef}>
      <button
        className={`user-menu__trigger ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={name}
      >
        {renderAvatar(32)}
        <span className="user-menu__trigger-name">{name}</span>
        <span className="user-menu__chevron" aria-hidden="true">›</span>
      </button>

      {open && (
        <div className="user-menu__panel" role="menu">
          <div className="user-menu__header">
            {renderAvatar(44)}
            <div className="user-menu__info">
              <div className="user-menu__name">{name}</div>
              {user.email && <div className="user-menu__email" title={user.email}>{user.email}</div>}
            </div>
          </div>

          <div className="user-menu__divider" />

          <button className="user-menu__item" role="menuitem" onClick={goSettings}>
            <span className="user-menu__item-icon" aria-hidden="true">⚙</span>
            <span>{t('nav.settings')}</span>
          </button>

          <div className="user-menu__divider" />

          <button className="user-menu__item user-menu__item--danger" role="menuitem" onClick={handleSignOut}>
            <span className="user-menu__item-icon" aria-hidden="true">↩</span>
            <span>{t('login.signOut')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
