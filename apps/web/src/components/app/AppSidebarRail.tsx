import { useTranslation } from 'react-i18next';
import { AppLogoutButton } from './AppLogoutButton.js';
import {
  AppSidebarNavGroups,
  type AppSidebarNavGroup,
} from './AppSidebarNav.js';
import { ScrollArea, scrollAreaFillClass } from '@/components/ui/scroll-area.js';
import { cn } from '@/lib/utils';

export const SIDEBAR_WIDTH_EXPANDED = 'w-60';
export const SIDEBAR_WIDTH_COLLAPSED = 'w-[4.5rem]';

export const SIDEBAR_WIDTH_EXPANDED_CLASS = {
  width: SIDEBAR_WIDTH_EXPANDED,
  pl: 'md:pl-60',
} as const;

export const SIDEBAR_WIDTH_COLLAPSED_CLASS = {
  width: SIDEBAR_WIDTH_COLLAPSED,
  pl: 'md:pl-[4.5rem]',
} as const;

type AppSidebarRailProps = {
  groups: AppSidebarNavGroup[];
  footerGroups?: AppSidebarNavGroup[];
  collapsed: boolean;
  showLogout?: boolean;
  onLoggedOut?: () => void;
  onNavigate?: () => void;
  className?: string;
};

export function AppSidebarRail({
  groups,
  footerGroups = [],
  collapsed,
  showLogout,
  onLoggedOut,
  onNavigate,
  className,
}: AppSidebarRailProps) {
  const { t } = useTranslation();
  const visibleFooterGroups = footerGroups.filter((group) => group.items.length > 0);
  const hasFooter = visibleFooterGroups.length > 0 || (showLogout && onLoggedOut);

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col border-r border-outline-variant/30 bg-paper/95 backdrop-blur-md transition-[width] duration-300 ease-in-out',
        collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
        className ?? 'h-dvh',
      )}
      aria-label={t('sidebar.navigation')}
    >
      <ScrollArea className={cn(scrollAreaFillClass, 'flex-1')}>
        <div className={cn('py-4', collapsed ? 'px-1' : 'px-3')}>
          <AppSidebarNavGroups groups={groups} collapsed={collapsed} onNavigate={onNavigate} />
        </div>
      </ScrollArea>

      {hasFooter ? (
        <div
          className={cn(
            'shrink-0 border-t border-outline-variant/20 py-4',
            collapsed ? 'px-1' : 'px-3',
          )}
        >
          {visibleFooterGroups.length > 0 ? (
            <AppSidebarNavGroups
              groups={visibleFooterGroups}
              collapsed={collapsed}
              onNavigate={onNavigate}
              className="mb-1"
            />
          ) : null}

          {showLogout && onLoggedOut ? (
            <AppLogoutButton
              onLoggedOut={onLoggedOut}
              showLabel={!collapsed}
              className={cn(
                'w-full min-h-10 rounded-xl px-3 py-2 text-sm',
                collapsed ? 'justify-center gap-0' : 'justify-start',
              )}
            />
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
