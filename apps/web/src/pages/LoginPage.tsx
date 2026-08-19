import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useOutletContext } from 'react-router-dom';
import type { AppOutletContext } from '../layouts/AppLayout.js';
import {
  AppButton,
  AppCard,
  AppFormField,
  AppInput,
  AppPage,
  LoginIntro,
} from '../components/app/index.js';
import { apiFetch } from '../lib/api.js';
import { showError, showSuccess } from '../lib/app-toast.js';
import {
  isMockMode,
  MOCK_DEMO_CODE,
  MOCK_DEMO_EMAIL,
  MOCK_FACILITATOR_DEMO_EMAIL,
} from '../lib/mock-mode.js';

type Step = 'email' | 'code';

const loginFormClass = 'mx-auto w-full max-w-xl';

function MockLoginForm({
  onAuthenticated,
}: {
  onAuthenticated: AppOutletContext['onAuthenticated'];
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(MOCK_DEMO_EMAIL);
  const [code, setCode] = useState(MOCK_DEMO_CODE);
  const [loading, setLoading] = useState(false);

  async function verifyCode(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/auth/code/verify', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      });
      onAuthenticated();
      navigate('/presence', { replace: true });
    } catch {
      showError(t('login.codeError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppPage className="w-full gap-8">
      <LoginIntro demo />
      <AppCard className={loginFormClass}>
        <form className="relative z-10 grid gap-6" onSubmit={verifyCode}>
          <p className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
            {t('login.demoPrefilledHint', { code: MOCK_DEMO_CODE })}
          </p>

          <div className="flex flex-wrap gap-2">
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEmail(MOCK_DEMO_EMAIL)}
            >
              {t('login.demoMember')}
            </AppButton>
            <AppButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEmail(MOCK_FACILITATOR_DEMO_EMAIL)}
            >
              {t('login.demoFacilitator')}
            </AppButton>
          </div>

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

          <AppButton type="submit" variant="ink" size="lg" loading={loading} className="w-full">
            {t('login.demoSubmit')}
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </AppButton>
        </form>
      </AppCard>
    </AppPage>
  );
}

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { onAuthenticated } = useOutletContext<AppOutletContext>();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  if (isMockMode) {
    return <MockLoginForm onAuthenticated={onAuthenticated} />;
  }

  async function requestCode(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/auth/code', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setStep('code');
      showSuccess(t('login.codeSent'));
    } catch {
      showError(t('login.error'));
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/auth/code/verify', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      });
      onAuthenticated();
      navigate('/presence', { replace: true });
    } catch {
      showError(t('login.codeError'));
    } finally {
      setLoading(false);
    }
  }

  if (step === 'email') {
    return (
      <AppPage className="w-full gap-8">
        <LoginIntro />
        <AppCard className={loginFormClass}>
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
      </AppPage>
    );
  }

  return (
    <AppPage className="w-full gap-8">
      <LoginIntro compact />
      <AppCard
        className={loginFormClass}
        title={t('login.verifyTitle')}
        description={
          <>
            {t('login.codeHintPrefix')}{' '}
            <span className="font-medium text-foreground">{email}</span>
          </>
        }
      >
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
              }}
            >
              {t('login.changeEmail')}
            </AppButton>
          </div>
        </form>
      </AppCard>
    </AppPage>
  );
}
