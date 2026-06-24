import { useAuthStore } from '../store/useAuth';
import { useI18n } from '../i18n/useI18n';

export default function UserBadge() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const { t } = useI18n();
  if (!user) return null;

  const name = user.displayName || user.email || 'User';
  const initial = name.trim()[0]?.toUpperCase() || '?';

  return (
    <div className="user-badge">
      {user.photoURL ? (
        <img className="user-badge__avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" />
      ) : (
        <div className="user-badge__avatar user-badge__avatar--fallback">{initial}</div>
      )}
      <div className="user-badge__info">
        <div className="user-badge__name" title={name}>{name}</div>
        <button className="user-badge__signout" onClick={signOut}>{t('login.signOut')}</button>
      </div>
    </div>
  );
}
