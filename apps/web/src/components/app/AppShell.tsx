import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppBrand } from './AppBrand.js';
import { LanguageSwitcher } from '../LanguageSwitcher.js';
import { cn } from '@/lib/utils';

export type AppShellVariant = 'auth' | 'app' | 'catalog';

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
          'rounded-full px-3 py-2 text-sm font-semibold transition-colors',
          isActive ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground',
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
  const showCatalogNav = variant === 'catalog';

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <div className="mx-auto w-full max-w-5xl px-4 pt-5 pb-10 sm:px-6 sm:pt-8">
        <nav className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-full border border-border/80 bg-background/90 px-4 py-2.5 shadow-sm backdrop-blur-md">
          <Link to={variant === 'catalog' ? '/design' : authed ? '/presence' : '/login'} className="min-w-0">
            <AppBrand />
          </Link>
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            {showMemberNav
              ? memberLinks.map((link) => (
                  <NavPill key={link.to} to={link.to}>
                    {t(`nav.${link.key}`)}
                  </NavPill>
                ))
              : null}
            {showMemberNav ? (
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
            <LanguageSwitcher />
          </div>
        </nav>

        {title ? (
          <header className="mb-8 max-w-3xl space-y-2">
            {eyebrow ? (
              <p className="inline-flex w-fit items-center rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[11px] font-extrabold tracking-[0.12em] text-primary uppercase">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="font-serif text-[clamp(1.75rem,5vw,2.5rem)] leading-tight font-medium tracking-tight">
              {title}
            </h1>
            {lead ? <p className="text-base leading-relaxed text-muted-foreground">{lead}</p> : null}
          </header>
        ) : null}

        <main
          className={cn(
            variant === 'auth' && 'mx-auto max-w-lg',
            (variant === 'app' || variant === 'catalog') && 'max-w-4xl',
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
