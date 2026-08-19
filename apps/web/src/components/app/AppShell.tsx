import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLogoutButton } from './AppLogoutButton.js';
import { AppNav } from './AppNav.js';
import { LanguageSwitcher } from '../LanguageSwitcher.js';
import { shellContainerClass } from '@/lib/layout';
import { cn } from '@/lib/utils';

export type AppShellMode = 'auth' | 'member' | 'catalog';

type AppShellProps = {
  mode?: AppShellMode;
  authed?: boolean | null;
  isFacilitator?: boolean;
  onLoggedOut?: () => void;
  children: ReactNode;
};

export function AppShell({
  mode = 'member',
  authed,
  isFacilitator = false,
  onLoggedOut,
  children,
}: AppShellProps) {
  const { t } = useTranslation();

  const homeTo =
    mode === 'catalog' ? '/design' : authed ? '/presence' : '/login';

  const memberItems =
    mode === 'member' && authed !== false
      ? [
          { to: '/presence', label: t('nav.presence') },
          { to: '/circles', label: t('nav.circles') },
          { to: '/profile', label: t('nav.profile') },
          ...(isFacilitator ? [{ to: '/facilitator', label: t('nav.facilitator') }] : []),
        ]
      : [];

  const catalogItems =
    mode === 'catalog'
      ? [
          { to: '/design', label: 'Overview' },
          { to: '/design/tokens', label: 'Tokens' },
          { to: '/design/components', label: 'Components' },
          { to: '/design/patterns', label: 'Patterns' },
        ]
      : [];

  const guestItems =
    mode === 'auth' && authed === false ? [{ to: '/login', label: t('nav.login') }] : [];

  const navItems = memberItems.length ? memberItems : catalogItems.length ? catalogItems : guestItems;

  const showLogout = authed === true && mode !== 'catalog' && onLoggedOut;

  const utilities = (
    <>
      {showLogout ? <AppLogoutButton onLoggedOut={onLoggedOut} /> : null}
      <LanguageSwitcher />
    </>
  );

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
          shellContainerClass(),
          'relative z-10 pt-4 pb-12 sm:pt-6',
          mode === 'auth' && 'flex min-h-dvh flex-1 flex-col',
        )}
      >
        <header className="mb-6 sm:mb-8">
          <AppNav homeTo={homeTo} items={navItems} utilities={utilities} />
        </header>

        <main
          className={cn(
            'w-full',
            mode === 'auth' && 'flex flex-1 flex-col justify-center',
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
