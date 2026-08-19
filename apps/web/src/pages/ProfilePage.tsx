import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AppAlert,
  AppButton,
  AppCard,
  AppFormField,
  AppInput,
  AppPageHeader,
  LanguageChipPicker,
} from '../components/app/index.js';
import { apiFetch } from '../lib/api.js';

type Profile = {
  timezone: string;
  languages: string[];
};

const LANGUAGE_OPTIONS = ['pt', 'en'] as const;

export function ProfilePage() {
  const { t } = useTranslation();
  const [timezone, setTimezone] = useState('America/Sao_Paulo');
  const [languages, setLanguages] = useState<string[]>(['pt']);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch<Profile>('/me/profile')
      .then((profile) => {
        setTimezone(profile.timezone);
        setLanguages(profile.languages);
      })
      .catch(() => setError(t('common.apiOffline')));
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
      await apiFetch('/me/profile', {
        method: 'PUT',
        body: JSON.stringify({ timezone, languages }),
      });
      setMessage(t('profile.saved'));
    } catch {
      setError(t('common.apiOffline'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <AppPageHeader title={t('profile.title')} />

      <AppCard>
        <form className="grid gap-6" onSubmit={onSubmit}>
          <AppFormField label={t('profile.timezone')} htmlFor="timezone">
            <AppInput
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              required
            />
          </AppFormField>

          <AppFormField label={t('profile.languages')}>
            <LanguageChipPicker
              options={LANGUAGE_OPTIONS}
              selected={languages}
              onToggle={toggleLanguage}
            />
          </AppFormField>

          <AppButton type="submit" loading={loading} className="w-full sm:w-auto">
            {t('profile.save')}
          </AppButton>
        </form>
      </AppCard>

      {message ? <AppAlert variant="success">{message}</AppAlert> : null}
      {error ? <AppAlert variant="error">{error}</AppAlert> : null}
    </div>
  );
}
