import { cn } from '@/lib/utils';

type GatheringDateLineProps = {
  label: string;
  className?: string;
};

export function GatheringDateLine({ label, className }: GatheringDateLineProps) {
  return (
    <p className={cn('flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground', className)}>
      <span
        className="material-symbols-outlined shrink-0 text-base leading-none text-primary"
        aria-hidden="true"
      >
        calendar_today
      </span>
      <span className="min-w-0 leading-snug">{label}</span>
    </p>
  );
}
