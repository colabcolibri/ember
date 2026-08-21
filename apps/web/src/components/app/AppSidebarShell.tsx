import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet.js';
import { useIsMobile } from '@/hooks/use-mobile.js';
import { readSidebarCollapsed, writeSidebarCollapsed } from '@/lib/app-sidebar-storage.js';
import { cn } from '@/lib/utils';
import { AppShellHeader } from './AppShellHeader.js';
import { AppSidebarRail } from './AppSidebarRail.js';
import type { AppSidebarNavGroup } from './AppSidebarNav.js';

type AppSidebarShellProps = {
  homeTo: string;
  groups: AppSidebarNavGroup[];
  footerGroups?: AppSidebarNavGroup[];
  showLogout?: boolean;
  onLoggedOut?: () => void;
  demoBanner?: ReactNode;
  children: ReactNode;
  mainClassName?: string;
};

export function AppSidebarShell({
  homeTo,
  groups,
  footerGroups = [],
  showLogout,
  onLoggedOut,
  demoBanner,
  children,
  mainClassName,
}: AppSidebarShellProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setCollapsed(readSidebarCollapsed());
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      writeSidebarCollapsed(next);
      return next;
    });
  }

  function handleToggleSidebar() {
    if (isMobile) {
      setMobileOpen(true);
      return;
    }
    toggleCollapsed();
  }

  function handleNavigate() {
    if (isMobile) {
      setMobileOpen(false);
    }
  }

  const railProps = {
    groups,
    footerGroups,
    showLogout,
    onLoggedOut,
    onNavigate: handleNavigate,
  };

  return (
    <div className="flex h-dvh min-h-0 w-full overflow-hidden bg-transparent">
      {!isMobile ? (
        <AppSidebarRail {...railProps} collapsed={collapsed} />
      ) : (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="w-72 max-w-[85vw] border-outline-variant/30 bg-paper/95 p-0 backdrop-blur-md [&>button]:hidden"
          >
            <SheetTitle className="sr-only">{t('sidebar.navigation')}</SheetTitle>
            <AppSidebarRail
              {...railProps}
              collapsed={false}
              className="h-full w-full max-w-none border-0 px-3"
            />
          </SheetContent>
        </Sheet>
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AppShellHeader homeTo={homeTo} onToggleSidebar={handleToggleSidebar} />

        <div
          className={cn(
            'min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-12 pt-4 sm:px-6 sm:pt-6',
            mainClassName,
          )}
        >
          {demoBanner}
          {children}
        </div>
      </div>
    </div>
  );
}
