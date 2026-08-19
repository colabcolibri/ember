import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type AppPageHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function AppPageHeader({ eyebrow, title, lead, actions, className }: AppPageHeaderProps) {
  return (
    <header className={cn('mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0 space-y-2">
        {eyebrow ? (
          <p className="inline-flex w-fit items-center rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[11px] font-extrabold tracking-[0.12em] text-primary uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-serif text-[clamp(1.75rem,5vw,2.5rem)] leading-tight font-medium tracking-tight">
          {title}
        </h1>
        {lead ? <p className="max-w-prose text-base leading-relaxed text-muted-foreground">{lead}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
