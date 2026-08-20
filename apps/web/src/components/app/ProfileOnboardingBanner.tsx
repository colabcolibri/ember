import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ProfileCompletenessField } from '@ember/domain/profile/completeness';
import { profileMissingFieldLabel } from '@ember/domain/profile/completeness';
import { AppAlert } from './AppAlert.js';

type ProfileOnboardingBannerProps = {
  missing: ProfileCompletenessField[];
};

export function ProfileOnboardingBanner({ missing }: ProfileOnboardingBannerProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith('en') ? 'en' : 'pt';

  if (missing.length === 0) return null;

  return (
    <AppAlert variant="info">
      <p className="font-medium">{t('onboarding.bannerTitle')}</p>
      <ul className="mt-2 list-disc pl-5 text-sm">
        {missing.map((field) => (
          <li key={field}>{profileMissingFieldLabel(field, locale)}</li>
        ))}
      </ul>
      <Link to="/profile" className="mt-3 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline">
        {t('onboarding.goToProfile')}
      </Link>
    </AppAlert>
  );
}
