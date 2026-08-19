import { Navigate, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppShell, type AppShellMode } from '@/components/app/AppShell.js';

type AppLayoutProps = {
  authed: boolean | null;
  onLoggedOut: () => void;
  mode: AppShellMode;
  /** true = exige login; 'guest' = só visitante (login) */
  auth?: boolean | 'guest';
};

export function AppLayout({
  authed,
  onLoggedOut,
  mode,
  auth,
}: AppLayoutProps) {
  const { t } = useTranslation();

  if (auth === true && authed === false) {
    return <Navigate to="/login" replace />;
  }

  if (auth === 'guest' && authed === true) {
    return <Navigate to="/presence" replace />;
  }

  if (auth === true && authed === null) {
    return (
      <AppShell mode={mode} authed={authed}>
        <p className="text-center text-sm text-muted-foreground">{t('common.loading')}</p>
      </AppShell>
    );
  }

  return (
    <AppShell mode={mode} authed={authed} onLoggedOut={onLoggedOut}>
      <Outlet />
    </AppShell>
  );
}
