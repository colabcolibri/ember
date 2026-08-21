import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AppLoading } from './AppLoading.js';

type RequireCompleteProfileProps = {
  authed: boolean | null;
  profileComplete: boolean | null;
  children?: ReactNode;
};

export function RequireCompleteProfile({
  authed,
  profileComplete,
  children,
}: RequireCompleteProfileProps) {
  if (authed === null || profileComplete === null) {
    return <AppLoading />;
  }

  if (!profileComplete) {
    return <Navigate to="/profile" replace />;
  }

  return children ?? <Outlet />;
}
