import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../lib/api.js';

export function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await apiFetch('/auth/magic-link', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setMessage(t('login.success'));
    } catch {
      setError(t('login.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h2>{t('login.title')}</h2>
      <form className="form" onSubmit={onSubmit}>
        <label className="field">
          <span>{t('login.email')}</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <button type="submit" className="btn" disabled={loading}>
          {loading ? t('common.loading') : t('login.submit')}
        </button>
      </form>
      {message ? <p className="ok">{message}</p> : null}
      {error ? <p className="err">{error}</p> : null}
    </section>
  );
}
