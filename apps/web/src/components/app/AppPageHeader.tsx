import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type AppPageHeaderProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  className?: string;
  centered?: boolean;
};

export function AppPageHeader({
  eyebrow,
  title,
  lead,
  actions,
  className,
  centered = false,
}: AppPageHeaderProps) {
  return (
    <header
      className={cn(
        'flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between',
        centered && 'text-center sm:text-center',
        className,
      )}
    >
      <div className={cn('min-w-0 flex-1 space-y-3', centered && 'mx-auto')}>
        {eyebrow ? (
          <p className="inline-flex w-fit items-center rounded-full border border-primary bg-primary/5 px-3 py-1 text-[11px] font-bold tracking-[0.12em] text-primary uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-serif text-[clamp(2rem,5vw,3rem)] leading-tight font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {lead ? (
          <p className="max-w-prose text-base leading-relaxed text-muted-foreground">{lead}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full min-w-0 shrink-0 flex-wrap justify-start gap-2 sm:w-auto sm:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
