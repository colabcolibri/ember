import type { ReactNode } from 'react';
import { AppSidebarShell } from './AppSidebarShell.js';
import type { AppSidebarNavGroup } from './AppSidebarNav.js';

type AppSidebarLayoutProps = {
  homeTo: string;
  groups: AppSidebarNavGroup[];
  footerGroups?: AppSidebarNavGroup[];
  showLogout?: boolean;
  onLoggedOut?: () => void;
  demoBanner?: ReactNode;
  children: ReactNode;
  mainClassName?: string;
};

/** @deprecated Prefer `AppSidebarShell` — mantido como alias de compatibilidade. */
export function AppSidebarLayout(props: AppSidebarLayoutProps) {
  return <AppSidebarShell {...props} />;
}
