import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type AppEmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function AppEmptyState({ title, description, action, className }: AppEmptyStateProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[var(--radius-card)] border border-dashed border-border/80 bg-card/60 px-6 py-10 text-center',
        className,
      )}
    >
      <div className="pointer-events-none absolute -top-8 -right-8 size-32 rounded-full border border-border/60 opacity-40" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 size-24 rounded-full border border-primary/20 opacity-30" />
      <div className="relative space-y-3">
        <h3 className="font-serif text-xl font-medium">{title}</h3>
        {description ? <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p> : null}
        {action ? <div className="pt-2">{action}</div> : null}
      </div>
    </div>
  );
}
