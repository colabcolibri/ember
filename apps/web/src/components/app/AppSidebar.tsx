import { useTranslation } from 'react-i18next';
import { ScrollArea, scrollAreaFillClass } from '@/components/ui/scroll-area.js';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar.js';
import { AppLogoutButton } from './AppLogoutButton.js';
import {
  AppSidebarNavGroups,
  type AppSidebarNavGroup,
} from './AppSidebarNav.js';
import { cn } from '@/lib/utils';

type AppSidebarProps = {
  groups: AppSidebarNavGroup[];
  footerGroups?: AppSidebarNavGroup[];
  showLogout?: boolean;
  onLoggedOut?: () => void;
};

export function AppSidebar({
  groups,
  footerGroups = [],
  showLogout,
  onLoggedOut,
}: AppSidebarProps) {
  const { t } = useTranslation();
  const { isMobile, setOpenMobile, state } = useSidebar();
  const collapsed = !isMobile && state === 'collapsed';

  const visibleFooterGroups = footerGroups.filter((group) => group.items.length > 0);
  const hasFooter = visibleFooterGroups.length > 0 || (showLogout && onLoggedOut);
  const onNavigate = isMobile ? () => setOpenMobile(false) : undefined;

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      className="border-outline-variant/30 bg-paper/95 backdrop-blur-md"
    >
      <SidebarContent className="gap-0 overflow-hidden p-0">
        <ScrollArea className={scrollAreaFillClass}>
          <div className={cn('py-4', collapsed ? 'px-1' : 'px-2')}>
            <AppSidebarNavGroups
              groups={groups}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          </div>
        </ScrollArea>
      </SidebarContent>

      {hasFooter ? (
        <SidebarFooter
          className={cn(
            'shrink-0 gap-0 border-t border-outline-variant/20 py-4',
            collapsed ? 'px-1' : 'px-2',
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
                'w-full min-h-10 rounded-xl py-2 text-sm',
                collapsed ? 'justify-center gap-0 px-0' : 'justify-start px-3',
              )}
            />
          ) : null}
        </SidebarFooter>
      ) : null}

      <span className="sr-only">{t('sidebar.navigation')}</span>
    </Sidebar>
  );
}
