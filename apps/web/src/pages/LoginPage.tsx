import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useOutletContext } from 'react-router-dom';
import type { AppOutletContext } from '../layouts/AppLayout.js';
import { AppAlert, AppButton, AppCard, AppFormField, AppInput, AppPage } from '../components/app/index.js';
import { apiFetch } from '../lib/api.js';

type Step = 'email' | 'code';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { onAuthenticated } = useOutletContext<AppOutletContext>();
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
      onAuthenticated();
      navigate('/presence', { replace: true });
    } catch {
      setError(t('login.codeError'));
    } finally {
      setLoading(false);
    }
  }

  if (step === 'email') {
    return (
      <AppPage centered title={t('login.title')} lead={t('login.subtitle')}>
        <AppCard>
          <form className="relative z-10 grid gap-6" onSubmit={requestCode}>
            <AppFormField label={t('login.email')} htmlFor="email">
              <AppInput
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="nome@exemplo.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </AppFormField>
            <AppButton type="submit" variant="ink" size="lg" loading={loading} className="w-full">
              {t('login.submit')}
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </AppButton>
          </form>
          <div className="relative z-10 mt-8 border-t border-outline-variant/60 pt-6 text-center">
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t('login.termsPrefix')}{' '}
              <a href="#" className="font-medium text-primary hover:underline">
                {t('login.terms')}
              </a>{' '}
              {t('login.termsAnd')}{' '}
              <a href="#" className="font-medium text-primary hover:underline">
                {t('login.privacy')}
              </a>
              .
            </p>
          </div>
        </AppCard>
        {message ? <AppAlert variant="success">{message}</AppAlert> : null}
        {error ? <AppAlert variant="error">{error}</AppAlert> : null}
      </AppPage>
    );
  }

  return (
    <AppPage
      centered
      title={t('login.verifyTitle')}
      lead={
        <>
          {t('login.codeHintPrefix')}{' '}
          <span className="font-medium text-foreground">{email}</span>
        </>
      }
    >
      <AppCard>
        <form className="relative z-10 grid gap-8" onSubmit={verifyCode}>
          <AppFormField label={t('login.code')} htmlFor="code">
            <AppInput
              id="code"
              type="text"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              placeholder="000000"
              required
              otp
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </AppFormField>
          <div className="grid gap-4">
            <AppButton
              type="submit"
              size="lg"
              loading={loading}
              disabled={code.length !== 6}
              className="w-full"
            >
              {t('login.verify')}
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </AppButton>
            <AppButton
              type="button"
              variant="outline"
              size="lg"
              disabled={loading}
              className="w-full"
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
      </AppCard>
      {message ? <AppAlert variant="success">{message}</AppAlert> : null}
      {error ? <AppAlert variant="error">{error}</AppAlert> : null}
    </AppPage>
  );
}
