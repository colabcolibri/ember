import { Navigate, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppShell, type AppShellMode } from '@/components/app/AppShell.js';

export type AppOutletContext = {
  onAuthenticated: () => void;
};

type AppLayoutProps = {
  authed: boolean | null;
  onLoggedOut: () => void;
  onAuthenticated: () => void;
  mode: AppShellMode;
  /** true = exige login; 'guest' = só visitante (login) */
  auth?: boolean | 'guest';
};

function AuthLoading({ mode, authed }: { mode: AppShellMode; authed: boolean | null }) {
  const { t } = useTranslation();
  return (
    <AppShell mode={mode} authed={authed}>
      <p className="text-center text-sm text-muted-foreground">{t('common.loading')}</p>
    </AppShell>
  );
}

export function AppLayout({
  authed,
  onLoggedOut,
  onAuthenticated,
  mode,
  auth,
}: AppLayoutProps) {
  if (auth === true && authed === false) {
    return <Navigate to="/login" replace />;
  }

  if (auth === 'guest' && authed === true) {
    return <Navigate to="/presence" replace />;
  }

  if (authed === null && auth !== undefined) {
    return <AuthLoading mode={mode} authed={authed} />;
  }

  return (
    <AppShell mode={mode} authed={authed} onLoggedOut={onLoggedOut}>
      <Outlet context={{ onAuthenticated } satisfies AppOutletContext} />
    </AppShell>
  );
}
