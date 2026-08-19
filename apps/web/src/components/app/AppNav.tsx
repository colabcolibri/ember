import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AppBrand } from './AppBrand.js';
import { cn } from '@/lib/utils';

type NavItem = {
  to: string;
  label: ReactNode;
  end?: boolean;
};

type AppNavProps = {
  homeTo: string;
  items: NavItem[];
  utilities: ReactNode;
};

function NavLinkItem({ to, end, children }: { to: string; end?: boolean; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'rounded-lg px-2.5 py-1 text-xs font-semibold tracking-wide transition-colors sm:px-3 sm:py-1.5 sm:text-sm',
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

export function AppNav({ homeTo, items, utilities }: AppNavProps) {
  return (
    <nav
      className="rounded-2xl border border-outline-variant/30 bg-paper/90 px-3 py-2 shadow-sm backdrop-blur-md sm:px-4 sm:py-2.5"
      aria-label="Navegação principal"
    >
      <div className="flex items-center gap-x-3">
        <Link to={homeTo} className="shrink-0" aria-label="Ember — início">
          <AppBrand markOnly size="sm" />
        </Link>

        {items.length > 0 ? (
          <div className="hidden min-w-0 flex-1 flex-wrap items-center gap-0.5 sm:flex sm:gap-1">
            {items.map((item) => (
              <NavLinkItem key={item.to} to={item.to} end={item.end}>
                {item.label}
              </NavLinkItem>
            ))}
          </div>
        ) : (
          <div className="hidden flex-1 sm:block" />
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">{utilities}</div>
      </div>

      {items.length > 0 ? (
        <div className="mt-2 flex flex-wrap items-center gap-0.5 border-t border-outline-variant/20 pt-2 sm:hidden">
          {items.map((item) => (
            <NavLinkItem key={item.to} to={item.to} end={item.end}>
              {item.label}
            </NavLinkItem>
          ))}
        </div>
      ) : null}
    </nav>
  );
}
