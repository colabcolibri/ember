import { useTranslation } from 'react-i18next';

export function AppLoading() {
  const { t } = useTranslation();
  return (
    <p className="text-center text-sm text-muted-foreground">{t('common.loading')}</p>
  );
}
