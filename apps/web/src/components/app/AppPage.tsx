import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type AppPageProps = {
  header?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Template padrão de página de produto — header + conteúdo com espaçamento consistente */
export function AppPage({ header, children, className }: AppPageProps) {
  return (
    <div className={cn('grid w-full gap-8', className)}>
      {header}
      <div className="grid w-full gap-6">{children}</div>
    </div>
  );
}
