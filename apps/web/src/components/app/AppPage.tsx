import type { ReactNode } from 'react';
import { AppPageHeader } from './AppPageHeader.js';
import { cn } from '@/lib/utils';

type AppPageProps = {
  title?: ReactNode;
  lead?: ReactNode;
  centered?: boolean;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Template único de página de produto.
 * Usado dentro de AppLayout → AppShell; não define max-w (isso é do shell).
 */
export function AppPage({
  title,
  lead,
  centered,
  actions,
  children,
  className,
}: AppPageProps) {
  return (
    <div className={cn('grid w-full gap-8', className)}>
      {title ? (
        <AppPageHeader title={title} lead={lead} centered={centered} actions={actions} />
      ) : null}
      <div className="grid w-full gap-6">{children}</div>
    </div>
  );
}
