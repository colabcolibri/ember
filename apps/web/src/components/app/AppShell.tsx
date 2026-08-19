import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppBrand } from './AppBrand.js';
import { AppLogoutButton } from './AppLogoutButton.js';
import { LanguageSwitcher } from '../LanguageSwitcher.js';
import { contentMaxWidth, navMaxWidth, type AppShellVariant } from '@/lib/layout';
import { cn } from '@/lib/utils';

type AppShellProps = {
  variant?: AppShellVariant;
  authed?: boolean | null;
  onLoggedOut?: () => void;
  children: ReactNode;
};

const memberLinks = [
  { to: '/presence', key: 'presence' },
  { to: '/circles', key: 'circles' },
  { to: '/profile', key: 'profile' },
] as const;

const catalogLinks = [
  { to: '/design', label: 'Overview' },
  { to: '/design/tokens', label: 'Tokens' },
  { to: '/design/components', label: 'Components' },
  { to: '/design/patterns', label: 'Patterns' },
] as const;

function NavPill({ to, children }: { to: string; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'rounded-full px-2.5 py-1.5 text-xs font-semibold tracking-wide whitespace-nowrap transition-colors sm:px-3 sm:text-sm',
          isActive
            ? 'bg-primary/10 font-bold text-primary'
            : 'text-muted-foreground hover:bg-primary/5 hover:text-primary',
        )
      }
    >
      {children}
    </NavLink>
  );
}

export function AppShell({
  variant = 'app',
  authed,
  onLoggedOut,
  children,
}: AppShellProps) {
  const { t } = useTranslation();
  const showMemberNav = variant === 'app' && authed === true;
  const showFacilitatorNav = variant === 'facilitator' && authed === true;
  const showCatalogNav = variant === 'catalog';
  const showLogout = authed === true && variant !== 'catalog' && onLoggedOut;

  const homeTo =
    variant === 'catalog' ? '/design' : authed ? '/presence' : '/login';

  return (
    <div
      className={cn(
        'relative min-h-dvh overflow-x-hidden bg-background ember-orbital-radial',
        variant === 'auth' && 'flex flex-col',
      )}
    >
      <div className="ember-orbit-bg" aria-hidden="true" />
      <div className="ember-orbit-dot-rust" aria-hidden="true" />
      <div className="ember-orbit-dot-sage" aria-hidden="true" />

      <header className="fixed top-0 right-0 left-0 z-50 flex justify-center px-page-x pt-4 sm:pt-6">
        <nav
          className={cn(
            'flex w-full items-center justify-between gap-2 rounded-full border border-outline-variant/30 bg-paper/90 py-2.5 shadow-md backdrop-blur-md sm:gap-3 sm:py-3',
            'px-3 sm:px-6',
            navMaxWidth(variant),
          )}
          aria-label="Navegação principal"
        >
          <Link to={homeTo} className="min-w-0 shrink-0">
            <AppBrand compact={variant === 'auth'} showWordmark={variant !== 'auth'} />
          </Link>

          <div className="flex min-w-0 items-center justify-end gap-0.5 overflow-x-auto sm:gap-1">
            {showMemberNav
              ? memberLinks.map((link) => (
                  <NavPill key={link.to} to={link.to}>
                    {t(`nav.${link.key}`)}
                  </NavPill>
                ))
              : null}
            {showMemberNav || showFacilitatorNav ? (
              <NavPill to="/facilitator">{t('nav.facilitator')}</NavPill>
            ) : null}
            {showCatalogNav
              ? catalogLinks.map((link) => (
                  <NavPill key={link.to} to={link.to}>
                    {link.label}
                  </NavPill>
                ))
              : null}
            {!showCatalogNav && authed === false ? (
              <NavPill to="/login">{t('nav.login')}</NavPill>
            ) : null}
            <div className="ml-1 flex shrink-0 items-center gap-1 border-l border-outline-variant/40 pl-2 sm:ml-2 sm:gap-2 sm:pl-3">
              {showLogout ? <AppLogoutButton onLoggedOut={onLoggedOut} /> : null}
              <LanguageSwitcher />
            </div>
          </div>
        </nav>
      </header>

      <div
        className={cn(
          'relative z-10 mx-auto w-full px-page-x pt-28 pb-12 sm:pt-32',
          variant === 'auth' && 'flex flex-1 flex-col justify-center',
          contentMaxWidth(variant),
        )}
      >
        <main className="w-full">{children}</main>
      </div>
    </div>
  );
}

export type { AppShellVariant };
