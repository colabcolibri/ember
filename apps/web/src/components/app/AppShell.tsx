import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppBrand } from './AppBrand.js';
import { LanguageSwitcher } from '../LanguageSwitcher.js';
import { cn } from '@/lib/utils';

export type AppShellVariant = 'auth' | 'app' | 'facilitator' | 'catalog';

type AppShellProps = {
  variant?: AppShellVariant;
  authed?: boolean | null;
  eyebrow?: string;
  title?: string;
  lead?: string;
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
          'rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors sm:text-sm',
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
  eyebrow,
  title,
  lead,
  children,
}: AppShellProps) {
  const { t } = useTranslation();
  const showMemberNav = variant === 'app' && authed !== false;
  const showFacilitatorNav = variant === 'facilitator' && authed !== false;
  const showCatalogNav = variant === 'catalog';
  const isWide = variant === 'facilitator' || variant === 'catalog';

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

      <header className="fixed top-0 right-0 left-0 z-50 flex justify-center px-4 pt-4 sm:pt-6">
        <nav
          className={cn(
            'flex w-full items-center justify-between gap-3 rounded-full border border-outline-variant/30 bg-paper/90 px-4 py-2.5 shadow-md backdrop-blur-md sm:px-6 sm:py-3',
            isWide ? 'max-w-5xl' : 'max-w-2xl',
            variant === 'auth' && 'max-w-fit',
          )}
          aria-label="Navegação principal"
        >
          <Link to={homeTo} className="min-w-0 shrink-0">
            <AppBrand compact={variant === 'auth'} />
          </Link>

          <div className="flex min-w-0 flex-wrap items-center justify-end gap-0.5 sm:gap-1">
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
            <div className="ml-1 border-l border-outline-variant/40 pl-2 sm:ml-2 sm:pl-3">
              <LanguageSwitcher />
            </div>
          </div>
        </nav>
      </header>

      <div
        className={cn(
          'relative z-10 mx-auto w-full px-4 pt-28 pb-12 sm:px-6 sm:pt-32',
          variant === 'auth' && 'flex flex-1 flex-col justify-center',
          isWide ? 'max-w-7xl' : 'max-w-xl',
          variant === 'auth' && 'max-w-[390px]',
        )}
      >
        {title ? (
          <header className="mb-8 max-w-3xl space-y-2 text-center sm:text-left">
            {eyebrow ? (
              <p className="mx-auto inline-flex w-fit items-center rounded-full border border-primary bg-primary/5 px-3 py-1 text-[11px] font-bold tracking-[0.12em] text-primary uppercase sm:mx-0">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="font-serif text-[clamp(2rem,5vw,3rem)] leading-tight font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {lead ? (
              <p className="mx-auto max-w-prose text-base leading-relaxed text-muted-foreground sm:mx-0">
                {lead}
              </p>
            ) : null}
          </header>
        ) : null}

        <main>{children}</main>
      </div>
    </div>
  );
}
