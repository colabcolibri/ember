import { cn } from '@/lib/utils';

type GatheringMetaChipsProps = {
  items: Array<{ icon: string; label: string; key?: string }>;
  className?: string;
};

export function GatheringMetaChips({ items, className }: GatheringMetaChipsProps) {
  if (items.length === 0) return null;

  return (
    <div className={cn('flex min-w-0 w-full flex-wrap gap-2', className)}>
      {items.map((item, index) => (
        <span
          key={item.key ?? `${item.icon}-${index}-${item.label}`}
          className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full border border-outline-variant/50 bg-background/70 px-3 py-1.5 text-xs leading-snug text-muted-foreground"
        >
          <span
            className="material-symbols-outlined shrink-0 text-base leading-none text-primary"
            aria-hidden="true"
          >
            {item.icon}
          </span>
          <span className="min-w-0 break-words whitespace-normal">{item.label}</span>
        </span>
      ))}
    </div>
  );
}
