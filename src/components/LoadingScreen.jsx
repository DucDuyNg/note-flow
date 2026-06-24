import { useI18n } from '../i18n/useI18n';

export default function LoadingScreen({ message }) {
  const { t } = useI18n();
  return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <div>{message || t('common.loading')}</div>
    </div>
  );
}
