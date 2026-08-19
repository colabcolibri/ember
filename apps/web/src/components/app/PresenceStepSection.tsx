import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PresenceStepSectionProps = {
  step: number;
  title: string;
  hint?: string;
  children: ReactNode;
  className?: string;
};

export function PresenceStepSection({
  step,
  title,
  hint,
  children,
  className,
}: PresenceStepSectionProps) {
  return (
    <section className={cn('grid gap-4', className)}>
      <header className="flex items-start gap-4">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary/10 font-serif text-lg font-bold text-primary"
          aria-hidden="true"
        >
          {step}
        </span>
        <div className="min-w-0 space-y-1 pt-0.5">
          <h3 className="font-serif text-xl font-bold text-foreground">{title}</h3>
          {hint ? <p className="text-sm leading-relaxed text-muted-foreground">{hint}</p> : null}
        </div>
      </header>
      <div className="pl-0 sm:pl-[3.25rem]">{children}</div>
    </section>
  );
}
