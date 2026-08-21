import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLogoutButton } from './AppLogoutButton.js';
import { AppNav } from './AppNav.js';
import { AppSidebarLayout } from './AppSidebarLayout.js';
import { DemoResetButton } from './DemoResetButton.js';
import { LanguageSwitcher } from '../LanguageSwitcher.js';
import { emberWidthClass, EMBER_PAGE_X } from '@/lib/layout';
import { isMockMode } from '@/lib/mock-mode.js';
import { loginPath } from '@/lib/app-mode.js';
import { memberHomePath } from '@/lib/member-home.js';
import { buildCatalogSidebarNav, buildMemberSidebarNav } from '@/lib/app-sidebar-nav.js';
import { flattenSidebarGroups } from './AppSidebarNav.js';
import { cn } from '@/lib/utils';

export type AppShellMode = 'auth' | 'member' | 'catalog';

type AppShellProps = {
  mode?: AppShellMode;
  authed?: boolean | null;
  isFacilitator?: boolean;
  isOrgAdmin?: boolean;
  profileComplete?: boolean | null;
  onLoggedOut?: () => void;
  children: ReactNode;
};

export function AppShell({
  mode = 'member',
  authed,
  isFacilitator = false,
  isOrgAdmin = false,
  profileComplete = null,
  onLoggedOut,
  children,
}: AppShellProps) {
  const { t } = useTranslation();

  const homeTo =
    mode === 'catalog'
      ? '/design'
      : authed
        ? memberHomePath(profileComplete)
        : '/';

  const memberNav =
    mode === 'member' && authed !== false
      ? buildMemberSidebarNav({
          t,
          profileComplete,
          isFacilitator,
          isOrgAdmin,
        })
      : { groups: [], footerGroups: [] };

  const catalogGroups = mode === 'catalog' ? buildCatalogSidebarNav(t) : [];

  const guestItems =
    mode === 'auth' && authed === false
      ? [{ to: loginPath(), label: t('nav.login') }]
      : [];

  const sidebarGroups =
    memberNav.groups.length > 0
      ? memberNav.groups
      : catalogGroups.length > 0
        ? catalogGroups
        : guestItems.length > 0
          ? [{ id: 'guest', label: t('sidebar.navigation'), items: guestItems }]
          : [];

  const sidebarFooterGroups = memberNav.footerGroups;
  const flatNavItems = [
    ...flattenSidebarGroups(sidebarGroups),
    ...flattenSidebarGroups(sidebarFooterGroups),
  ];

  const showLogout = authed === true && mode !== 'catalog' && onLoggedOut;
  const useSidebar =
    mode !== 'auth' && (sidebarGroups.length > 0 || sidebarFooterGroups.length > 0);

  const utilities = (
    <>
      {showLogout ? <AppLogoutButton onLoggedOut={onLoggedOut} showLabel /> : null}
      <LanguageSwitcher />
    </>
  );

  const demoBanner = isMockMode ? (
    <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-center text-sm text-foreground">
      {t('app.demoBanner')}
    </div>
  ) : null;

  if (useSidebar) {
    return (
      <div className="relative min-h-dvh bg-background ember-orbital-radial">
        <div className="ember-orbit-bg" aria-hidden="true" />
        <div className="ember-orbit-dot-rust" aria-hidden="true" />
        <div className="ember-orbit-dot-sage" aria-hidden="true" />

        <div className="relative z-10 min-h-dvh w-full">
          <AppSidebarLayout
            homeTo={homeTo}
            groups={sidebarGroups}
            footerGroups={sidebarFooterGroups}
            showLogout={Boolean(showLogout)}
            onLoggedOut={onLoggedOut}
            demoBanner={demoBanner}
            mainClassName={cn('w-full max-w-none', isMockMode && 'pb-20')}
          >
            {children}
          </AppSidebarLayout>
        </div>

        {isMockMode ? <DemoResetButton /> : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative min-h-dvh overflow-x-hidden bg-background ember-orbital-radial',
        mode === 'auth' && 'flex flex-col',
      )}
    >
      <div className="ember-orbit-bg" aria-hidden="true" />
      <div className="ember-orbit-dot-rust" aria-hidden="true" />
      <div className="ember-orbit-dot-sage" aria-hidden="true" />

      <div
        className={cn(
          'relative z-10 mx-auto w-full pb-12 pt-4 sm:pt-6',
          EMBER_PAGE_X,
          emberWidthClass(),
          mode === 'auth' && 'flex min-h-dvh flex-1 flex-col',
        )}
      >
        <header className="mb-6 sm:mb-8">
          {demoBanner}
          <AppNav homeTo={homeTo} items={flatNavItems.length ? flatNavItems : guestItems} utilities={utilities} />
        </header>

        <main
          className={cn(
            'w-full',
            mode === 'auth' && 'flex flex-1 flex-col justify-center',
            isMockMode && 'pb-20',
          )}
        >
          {children}
        </main>

        {isMockMode ? <DemoResetButton /> : null}
      </div>
    </div>
  );
}
