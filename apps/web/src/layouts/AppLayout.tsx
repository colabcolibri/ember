import { Navigate, Outlet } from 'react-router-dom';
import { AppLoading, AppShell, type AppShellMode } from '@/components/app/index.js';
import { loginPath } from '@/lib/app-mode.js';
import { memberHomePath } from '@/lib/member-home.js';

export type AppOutletContext = {
  onAuthenticated: () => Promise<boolean | null>;
  refreshProfile: () => Promise<boolean | null>;
};

type AppLayoutProps = {
  authed: boolean | null;
  isFacilitator?: boolean;
  isOrgAdmin?: boolean;
  profileComplete?: boolean | null;
  onLoggedOut: () => void;
  onAuthenticated: () => Promise<boolean | null>;
  refreshProfile: () => Promise<boolean | null>;
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
  isOrgAdmin = false,
  profileComplete = null,
  onLoggedOut,
  onAuthenticated,
  refreshProfile,
  mode,
  auth,
}: AppLayoutProps) {
  if (auth === true && authed === false) {
    return <Navigate to={loginPath()} replace />;
  }

  if (auth === 'guest' && authed === true) {
    if (profileComplete === null) {
      return <AuthLoading mode={mode} authed={authed} />;
    }
    return <Navigate to={memberHomePath(profileComplete)} replace />;
  }

  if (authed === null && auth !== undefined) {
    return <AuthLoading mode={mode} authed={authed} />;
  }

  return (
    <AppShell
      mode={mode}
      authed={authed}
      isFacilitator={isFacilitator}
      isOrgAdmin={isOrgAdmin}
      profileComplete={profileComplete}
      onLoggedOut={onLoggedOut}
    >
      <Outlet context={{ onAuthenticated, refreshProfile } satisfies AppOutletContext} />
    </AppShell>
  );
}
