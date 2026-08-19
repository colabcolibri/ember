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
    <AppPage title={t('profile.title')}>
      <AppCard>
        <form className="relative z-10 grid gap-8" onSubmit={onSubmit}>
          <AppFormField label={t('profile.timezone')} htmlFor="timezone">
            <div className="relative">
              <span
                className="material-symbols-outlined absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground"
                style={{ fontSize: 20 }}
              >
                schedule
              </span>
              <AppInput
                id="timezone"
                className="pl-12"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                required
              />
            </div>
          </AppFormField>
          <hr className="border-outline-variant/50" />
          <AppFormField label={t('profile.languages')}>
            <LanguageChipPicker
              options={LANGUAGE_OPTIONS}
              selected={languages}
              onToggle={toggleLanguage}
            />
          </AppFormField>
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
