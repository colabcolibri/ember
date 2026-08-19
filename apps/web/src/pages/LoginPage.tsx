import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  AppAlert,
  AppButton,
  AppCard,
  AppFormField,
  AppInput,
  AppPageHeader,
} from '../components/app/index.js';
import { apiFetch } from '../lib/api.js';

type Step = 'email' | 'code';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function requestCode(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await apiFetch('/auth/code', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setStep('code');
      setMessage(t('login.codeSent'));
    } catch {
      setError(t('login.error'));
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch('/auth/code/verify', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      });
      navigate('/presence', { replace: true });
    } catch {
      setError(t('login.codeError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <AppPageHeader title={t('login.title')} />

      <AppCard>
        {step === 'email' ? (
          <form className="grid gap-4" onSubmit={requestCode}>
            <AppFormField label={t('login.email')} htmlFor="email">
              <AppInput
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </AppFormField>
            <AppButton type="submit" loading={loading} className="w-full sm:w-auto">
              {t('login.submit')}
            </AppButton>
          </form>
        ) : (
          <form className="grid gap-4" onSubmit={verifyCode}>
            <p className="text-sm text-muted-foreground">{t('login.codeHint', { email })}</p>
            <AppFormField label={t('login.code')} htmlFor="code">
              <AppInput
                id="code"
                type="text"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                required
                otp
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </AppFormField>
            <div className="flex flex-col gap-2 sm:flex-row">
              <AppButton type="submit" loading={loading} disabled={code.length !== 6} className="w-full sm:w-auto">
                {t('login.verify')}
              </AppButton>
              <AppButton
                type="button"
                variant="outline"
                disabled={loading}
                className="w-full sm:w-auto"
                onClick={() => {
                  setStep('email');
                  setCode('');
                  setMessage(null);
                  setError(null);
                }}
              >
                {t('login.changeEmail')}
              </AppButton>
            </div>
          </form>
        )}
      </AppCard>

      {message ? <AppAlert variant="success">{message}</AppAlert> : null}
      {error ? <AppAlert variant="error">{error}</AppAlert> : null}
    </div>
  );
}
