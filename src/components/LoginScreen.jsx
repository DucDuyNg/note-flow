import { useAuthStore } from '../store/useAuth';
import { useI18n } from '../i18n/useI18n';
import { isFirebaseConfigured } from '../lib/firebase';

export default function LoginScreen() {
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);
  const { t, lang, setLang } = useI18n();

  if (!isFirebaseConfigured) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-brand">
            <div className="login-brand__icon">N</div>
            <span>{t('app.brand')}</span>
          </div>
          <h1 className="login-title">{t('login.notConfiguredTitle')}</h1>
          <p className="login-desc">{t('login.notConfiguredDesc')}</p>
          <pre className="login-config">
            {
              `# .env (copy from .env.example)
              VITE_FIREBASE_API_KEY=...
              VITE_FIREBASE_AUTH_DOMAIN=...
              VITE_FIREBASE_PROJECT_ID=...
              VITE_FIREBASE_STORAGE_BUCKET=...
              VITE_FIREBASE_MESSAGING_SENDER_ID=...
              VITE_FIREBASE_APP_ID=...`
            }
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand__icon">N</div>
          <span>{t('app.brand')}</span>
        </div>
        <h1 className="login-title">{t('login.title')}</h1>
        <p className="login-desc">{t('login.desc')}</p>
        <button className="btn btn--primary btn--google" onClick={signInWithGoogle}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#fff" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4c-.2 1.2-.9 2.2-2 2.9v2.4h3.2c1.9-1.7 3-4.3 3-7.1z" />
            <path fill="#fff" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.4c-.9.6-2 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1H3.1v2.5C4.7 19.7 8.1 22 12 22z" opacity=".85" />
            <path fill="#fff" d="M6.4 14.1c-.2-.6-.3-1.3-.3-2.1 0-.7.1-1.4.3-2.1V7.4H3.1C2.4 8.8 2 10.4 2 12s.4 3.2 1.1 4.6l3.3-2.5z" opacity=".7" />
            <path fill="#fff" d="M12 6.4c1.5 0 2.8.5 3.8 1.5l2.9-2.9C16.9 3.5 14.7 2.5 12 2.5 8.1 2.5 4.7 4.8 3.1 8.1l3.3 2.5c.8-2.3 3-4.2 5.6-4.2z" opacity=".55" />
          </svg>
          {t('login.googleBtn')}
        </button>
        {error && (
          <div className="login-error">
            {error}
            <button className="btn btn--sm btn--ghost" onClick={clearError}>×</button>
          </div>
        )}
        <p className="login-foot">{t('login.privacy')}</p>
        <div className="login-lang">
          {['vi', 'en'].map((code) => (
            <button
              key={code}
              className={`chip ${lang === code ? 'is-active' : ''}`}
              onClick={() => setLang(code)}
            >
              {t(`settings.language.${code}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
