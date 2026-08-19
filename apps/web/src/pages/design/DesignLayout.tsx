import { Navigate, Outlet } from 'react-router-dom';
import { AppShell } from '@/components/app';

export function DesignLayout() {
  if (!import.meta.env.DEV) {
    return <Navigate to="/" replace />;
  }

  return (
    <AppShell variant="catalog">
      <Outlet />
    </AppShell>
  );
}
