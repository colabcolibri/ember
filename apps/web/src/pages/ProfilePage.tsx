import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AppAlert,
  AppButton,
  AppCard,
  AppFormField,
  AppInput,
  AppPage,
  LanguageChipPicker,
  TimezoneCombobox,
} from '../components/app/index.js';
import { apiFetch } from '../lib/api.js';
import { formatApiError } from '../lib/api-errors.js';

type Profile = {
  displayName: string;
  editionYear: number | null;
  timezone: string;
  languages: string[];
};

const LANGUAGE_OPTIONS = ['pt', 'en'] as const;

export function ProfilePage() {
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState('');
  const [editionYear, setEditionYear] = useState('');
  const [timezone, setTimezone] = useState('America/Sao_Paulo');
  const [languages, setLanguages] = useState<string[]>(['pt']);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch<Profile>('/me/profile')
      .then((profile) => {
        setDisplayName(profile.displayName);
        setEditionYear(profile.editionYear ? String(profile.editionYear) : '');
        setTimezone(profile.timezone);
        setLanguages(profile.languages);
      })
      .catch((err) => setError(formatApiError(err, t)));
  }, [t]);

  function toggleLanguage(code: string) {
    setLanguages((prev) =>
      prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code],
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const year = Number(editionYear);
      await apiFetch('/me/profile', {
        method: 'PUT',
        body: JSON.stringify({
          displayName: displayName.trim(),
          editionYear: year,
          timezone,
          languages,
        }),
      });
      setMessage(t('profile.saved'));
    } catch (err) {
      setError(formatApiError(err, t));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppPage title={t('profile.title')}>
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
      {message ? <AppAlert variant="success">{message}</AppAlert> : null}
      {error ? <AppAlert variant="error">{error}</AppAlert> : null}
    </AppPage>
  );
}
