import { useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useI18n, AVAILABLE_LANGS } from '../../i18n/useI18n';
import { useThemeStore, AVAILABLE_THEMES } from '../../store/useTheme';

export default function SettingsView() {
  const exportData = useAppStore((s) => s.exportData);
  const importData = useAppStore((s) => s.importData);
  const clearAll = useAppStore((s) => s.clearAll);
  const loadSeed = useAppStore((s) => s.loadSeed);
  const { t, lang, setLang } = useI18n();
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const fileRef = useRef(null);

  const tasks = useAppStore((s) => s.tasks.length);
  const ideas = useAppStore((s) => s.ideas.length);
  const projects = useAppStore((s) => s.projects.length);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `noteflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      importData(json);
      alert(t('settings.backup.importSuccess'));
    } catch (err) {
      alert(t('settings.backup.importError', { message: err.message }));
    } finally {
      e.target.value = '';
    }
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-header__title">{t('settings.title')}</h1>
          <div className="page-header__subtitle">{t('settings.subtitle')}</div>
        </div>
      </header>

      <section className="settings-section">
        <div className="settings-section__title">{t('settings.language.title')}</div>
        <div className="settings-section__desc">{t('settings.language.desc')}</div>
        <div className="settings-actions">
          {AVAILABLE_LANGS.map((code) => (
            <button
              key={code}
              className={`chip ${lang === code ? 'is-active' : ''}`}
              onClick={() => setLang(code)}
              aria-pressed={lang === code}
            >
              {t(`settings.language.${code}`)}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section__title">{t('settings.theme.title')}</div>
        <div className="settings-section__desc">{t('settings.theme.desc')}</div>
        <div className="theme-grid">
          {AVAILABLE_THEMES.map((id) => (
            <button
              key={id}
              className={`theme-card ${theme === id ? 'is-active' : ''}`}
              onClick={() => setTheme(id)}
              aria-pressed={theme === id}
            >
              <div className={`theme-card__preview theme-card__preview--${id}`}>
                <span className="theme-card__bar" />
                <span className="theme-card__bar theme-card__bar--accent" />
                <span className="theme-card__bar theme-card__bar--short" />
              </div>
              <div className="theme-card__label">{t(`settings.theme.${id}`)}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section__title">{t('settings.overview.title')}</div>
        <div
          className="settings-section__desc"
          dangerouslySetInnerHTML={{ __html: t('settings.overview.summary', { tasks, ideas, projects }) }}
        />
      </section>

      <section className="settings-section">
        <div className="settings-section__title">{t('settings.backup.title')}</div>
        <div
          className="settings-section__desc"
          dangerouslySetInnerHTML={{ __html: t('settings.backup.desc') }}
        />
        <div className="settings-actions">
          <button className="btn btn--primary" onClick={handleExport}>{t('settings.backup.exportBtn')}</button>
          <button className="btn" onClick={() => fileRef.current?.click()}>{t('settings.backup.importBtn')}</button>
          <input ref={fileRef} type="file" accept="application/json" onChange={handleImport} style={{ display: 'none' }} />
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section__title">{t('settings.seed.title')}</div>
        <div
          className="settings-section__desc"
          dangerouslySetInnerHTML={{ __html: t('settings.seed.desc') }}
        />
        <div className="settings-actions">
          <button
            className="btn"
            onClick={() => { if (confirm(t('settings.seed.confirm'))) loadSeed(); }}
          >
            {t('settings.seed.loadBtn')}
          </button>
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section__title" style={{ color: 'var(--color-danger)' }}>{t('settings.danger.title')}</div>
        <div className="settings-section__desc">{t('settings.danger.desc')}</div>
        <div className="settings-actions">
          <button
            className="btn btn--danger"
            onClick={() => { if (confirm(t('settings.danger.confirm'))) clearAll(); }}
          >
            {t('settings.danger.clearBtn')}
          </button>
        </div>
      </section>
    </>
  );
}
