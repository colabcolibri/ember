import { FormEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { profileCompleteness, type ProfileCompletenessInput } from '@ember/domain/profile/completeness';
import type { PlaceRef } from '../lib/place.js';
import {
  AppButton,
  AppCard,
  AppFormField,
  AppInput,
  AppLoading,
  AppPage,
  LanguageChipPicker,
  PlaceAutocomplete,
  ProfileOnboardingBanner,
  TimezoneCombobox,
} from '../components/app/index.js';
import { apiFetch } from '../lib/api.js';
import { formatApiError } from '../lib/api-errors.js';
import { showError, showSuccess } from '../lib/app-toast.js';
import { useInitialLoad } from '../lib/useInitialLoad.js';

type Profile = {
  displayName: string;
  editionYear: number | null;
  timezone: string;
  languages: string[];
  originPlace: PlaceRef | null;
  residencePlace: PlaceRef | null;
};

const LANGUAGE_OPTIONS = ['pt', 'en'] as const;

export function ProfilePage() {
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState('');
  const [editionYear, setEditionYear] = useState('');
  const [timezone, setTimezone] = useState('America/Sao_Paulo');
  const [languages, setLanguages] = useState<string[]>(['pt']);
  const [originPlace, setOriginPlace] = useState<PlaceRef | null>(null);
  const [residencePlace, setResidencePlace] = useState<PlaceRef | null>(null);
  const [loading, setLoading] = useState(false);

  const { initialLoading } = useInitialLoad(async () => {
    try {
      const profile = await apiFetch<Profile>('/me/profile');
      setDisplayName(profile.displayName);
      setEditionYear(profile.editionYear ? String(profile.editionYear) : '');
      setTimezone(profile.timezone);
      setLanguages(profile.languages);
      setOriginPlace(profile.originPlace);
      setResidencePlace(profile.residencePlace);
    } catch (err) {
      showError(formatApiError(err, t));
    }
  }, [t]);

  const missingFields = useMemo(
    () =>
      profileCompleteness({
        displayName,
        editionYear: editionYear ? Number(editionYear) : null,
        timezone,
        languages,
        originPlace,
        residencePlace,
      } as ProfileCompletenessInput).missing,
    [displayName, editionYear, timezone, languages, originPlace, residencePlace],
  );

  function toggleLanguage(code: string) {
    setLanguages((prev) =>
      prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code],
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!originPlace || !residencePlace) {
      showError(t('profile.placesRequired'));
      return;
    }
    setLoading(true);
    try {
      const year = Number(editionYear);
      await apiFetch('/me/profile', {
        method: 'PUT',
        body: JSON.stringify({
          displayName: displayName.trim(),
          editionYear: year,
          timezone,
          languages,
          originPlace,
          residencePlace,
        }),
      });
      showSuccess(t('profile.saved'));
    } catch (err) {
      showError(formatApiError(err, t));
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading) {
    return (
      <AppPage title={t('profile.title')}>
        <AppLoading />
      </AppPage>
    );
  }

  return (
    <AppPage title={t('profile.title')}>
      {missingFields.length > 0 ? <ProfileOnboardingBanner missing={missingFields} /> : null}
      <AppCard>
        <form className="relative z-10 grid gap-6" onSubmit={onSubmit}>
          <div className="grid gap-6 sm:grid-cols-2 sm:gap-x-5">
            <AppFormField label={t('profile.displayName')} htmlFor="displayName">
              <AppInput
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                minLength={2}
                autoComplete="name"
              />
            </AppFormField>

            <AppFormField label={t('profile.editionYear')} htmlFor="editionYear">
              <AppInput
                id="editionYear"
                type="number"
                inputMode="numeric"
                min={1990}
                max={new Date().getFullYear()}
                value={editionYear}
                onChange={(e) => setEditionYear(e.target.value)}
                required
              />
            </AppFormField>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 sm:gap-x-5">
            <AppFormField label={t('profile.originPlace')} htmlFor="origin-place">
              <PlaceAutocomplete
                id="origin-place"
                value={originPlace}
                onChange={setOriginPlace}
                placeholder={t('profile.originPlaceholder')}
                searchPlaceholder={t('profile.placeSearch')}
                emptyMessage={t('profile.placeEmpty')}
              />
            </AppFormField>

            <AppFormField label={t('profile.residencePlace')} htmlFor="residence-place">
              <PlaceAutocomplete
                id="residence-place"
                value={residencePlace}
                onChange={setResidencePlace}
                placeholder={t('profile.residencePlaceholder')}
                searchPlaceholder={t('profile.placeSearch')}
                emptyMessage={t('profile.placeEmpty')}
              />
            </AppFormField>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 sm:items-start sm:gap-x-5">
            <AppFormField label={t('profile.timezone')} htmlFor="timezone">
              <TimezoneCombobox
                id="timezone"
                value={timezone}
                onChange={setTimezone}
                placeholder={t('profile.timezonePlaceholder')}
                searchPlaceholder={t('profile.timezoneSearch')}
                emptyMessage={t('profile.timezoneEmpty')}
                browseHint={t('profile.timezoneBrowseHint')}
              />
            </AppFormField>

            <AppFormField label={t('profile.languages')}>
              <LanguageChipPicker
                options={LANGUAGE_OPTIONS}
                selected={languages}
                onToggle={toggleLanguage}
              />
            </AppFormField>
          </div>

          <AppButton type="submit" size="lg" loading={loading} className="w-full sm:w-auto">
            {t('profile.save')}
          </AppButton>
        </form>
      </AppCard>
    </AppPage>
  );
}
