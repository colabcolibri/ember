import { Navigate, Outlet } from 'react-router-dom';
import { AppLoading, AppShell, type AppShellMode } from '@/components/app/index.js';

export type AppOutletContext = {
  onAuthenticated: () => void;
};

type AppLayoutProps = {
  authed: boolean | null;
  isFacilitator?: boolean;
  onLoggedOut: () => void;
  onAuthenticated: () => void;
  mode: AppShellMode;
  /** true = exige login; 'guest' = só visitante (login) */
  auth?: boolean | 'guest';
};

function AuthLoading({ mode, authed }: { mode: AppShellMode; authed: boolean | null }) {
  return (
    <AppShell mode={mode} authed={authed}>
      <AppLoading />
    </AppShell>
  );
}

export function AppLayout({
  authed,
  isFacilitator = false,
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
    <AppShell mode={mode} authed={authed} isFacilitator={isFacilitator} onLoggedOut={onLoggedOut}>
      <Outlet context={{ onAuthenticated } satisfies AppOutletContext} />
    </AppShell>
  );
}
