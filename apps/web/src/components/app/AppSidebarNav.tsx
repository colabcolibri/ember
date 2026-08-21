import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { resolveNavIcon } from '@/lib/app-nav-icons.js';
import { cn } from '@/lib/utils';

export type AppSidebarNavItem = {
  to: string;
  label: ReactNode;
  end?: boolean;
};

export type AppSidebarNavGroup = {
  id: string;
  label: string;
  items: AppSidebarNavItem[];
};

type AppSidebarNavProps = {
  items: AppSidebarNavItem[];
  collapsed?: boolean;
  onNavigate?: () => void;
};

type AppSidebarNavGroupsProps = {
  groups: AppSidebarNavGroup[];
  collapsed?: boolean;
  onNavigate?: () => void;
  className?: string;
};

export const sidebarNavLinkClass = (isActive: boolean, collapsed: boolean) =>
  cn(
    'flex min-h-10 w-full items-center gap-3 rounded-xl border border-transparent py-2 text-sm font-semibold tracking-wide transition-colors',
    collapsed ? 'justify-center gap-0 px-2' : 'px-3',
    isActive
      ? 'border-primary/15 bg-primary/10 text-primary'
      : 'text-muted-foreground hover:border-primary/10 hover:bg-primary/5 hover:text-primary',
  );

function sidebarTitle(label: ReactNode): string | undefined {
  return typeof label === 'string' ? label : undefined;
}

function SidebarNavLinks({
  items,
  collapsed = false,
  onNavigate,
}: AppSidebarNavProps) {
  return (
    <div className="flex w-full flex-col gap-1">
      {items.map((item) => {
        const Icon = resolveNavIcon(item.to);

        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            title={collapsed ? sidebarTitle(item.label) : undefined}
            className={({ isActive }) => sidebarNavLinkClass(isActive, collapsed)}
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            {!collapsed ? <span className="min-w-0 truncate">{item.label}</span> : null}
          </NavLink>
        );
      })}
    </div>
  );
}

export function AppSidebarNav({ items, collapsed = false, onNavigate }: AppSidebarNavProps) {
  if (items.length === 0) return null;

  return (
    <nav className="flex w-full flex-col gap-1" aria-label="Navegação principal">
      <SidebarNavLinks items={items} collapsed={collapsed} onNavigate={onNavigate} />
    </nav>
  );
}

export function AppSidebarNavGroups({
  groups,
  collapsed = false,
  onNavigate,
  className,
}: AppSidebarNavGroupsProps) {
  const visibleGroups = groups.filter((group) => group.items.length > 0);
  if (visibleGroups.length === 0) return null;

  return (
    <nav className={cn('flex w-full flex-col', className)} aria-label="Navegação principal">
      {visibleGroups.map((group, index) => (
        <section
          key={group.id}
          aria-labelledby={collapsed ? undefined : `sidebar-group-${group.id}`}
          className={cn(index > 0 && 'mt-5')}
        >
          {!collapsed ? (
            <h2
              id={`sidebar-group-${group.id}`}
              className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground/75"
            >
              {group.label}
            </h2>
          ) : index > 0 ? (
            <div className="mb-2 border-t border-outline-variant/20" aria-hidden />
          ) : null}

          <SidebarNavLinks items={group.items} collapsed={collapsed} onNavigate={onNavigate} />
        </section>
      ))}
    </nav>
  );
}

export function flattenSidebarGroups(groups: AppSidebarNavGroup[]): AppSidebarNavItem[] {
  return groups.flatMap((group) => group.items);
}
