import { useUpdateCheck } from '../lib/useUpdateCheck';
import { useI18n } from '../i18n/useI18n';

export default function UpdateBanner() {
  const { updateAvailable, latestVersion, currentVersion, reload, dismiss } = useUpdateCheck();
  const { t } = useI18n();

  if (!updateAvailable) return null;

  return (
    <div className="update-banner" role="alert" aria-live="polite">
      <span className="update-banner__icon" aria-hidden="true">🔄</span>
      <div className="update-banner__text">
        <strong>{t('update.title')}</strong>
        <span className="update-banner__versions">v{currentVersion} → v{latestVersion}</span>
      </div>
      <button className="btn btn--sm btn--primary" onClick={reload}>
        {t('update.refresh')}
      </button>
      <button
        className="update-banner__close"
        onClick={dismiss}
        aria-label={t('common.close')}
      >
        ×
      </button>
    </div>
  );
}
