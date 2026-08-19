import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
    setError(null);
    try {
      await apiFetch('/me/profile', {
        method: 'PUT',
        body: JSON.stringify({ timezone, languages }),
      });
      setMessage(t('profile.saved'));
    } catch {
      setError(t('common.apiOffline'));
    }
  }

  return (
    <section className="card">
      <h2>{t('profile.title')}</h2>
      <form className="form" onSubmit={onSubmit}>
        <label className="field">
          <span>{t('profile.timezone')}</span>
          <input
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            required
          />
        </label>
        <fieldset className="fieldset">
          <legend>{t('profile.languages')}</legend>
          <div className="chip-row">
            {LANGUAGE_OPTIONS.map((code) => (
              <label key={code} className="chip">
                <input
                  type="checkbox"
                  checked={languages.includes(code)}
                  onChange={() => toggleLanguage(code)}
                />
                <span>{code.toUpperCase()}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <button type="submit" className="btn">
          {t('profile.save')}
        </button>
      </form>
      {message ? <p className="ok">{message}</p> : null}
      {error ? <p className="err">{error}</p> : null}
    </section>
  );
}
