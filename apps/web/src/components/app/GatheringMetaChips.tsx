import { cn } from '@/lib/utils';

type GatheringMetaChipsProps = {
  items: Array<{ icon: string; label: string }>;
  className?: string;
};

export function GatheringMetaChips({ items, className }: GatheringMetaChipsProps) {
  if (items.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {items.map((item) => (
        <span
          key={`${item.icon}-${item.label}`}
          className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-outline-variant/50 bg-background/70 px-3 py-1 text-xs text-muted-foreground"
        >
          <span className="material-symbols-outlined shrink-0 text-sm text-primary">{item.icon}</span>
          <span className="truncate">{item.label}</span>
        </span>
      ))}
    </div>
  );
}
