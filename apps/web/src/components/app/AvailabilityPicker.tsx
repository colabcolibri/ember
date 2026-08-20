import { cn } from '@/lib/utils';

type AvailabilityPickerProps = {
  slots: string[];
  selected: string[];
  onToggle: (slot: string) => void;
  label: (slot: string) => string;
};

export function AvailabilityPicker({ slots, selected, onToggle, label }: AvailabilityPickerProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {slots.map((slot) => {
        const active = selected.includes(slot);
        return (
          <button
            key={slot}
            type="button"
            onClick={() => onToggle(slot)}
            aria-pressed={active}
            className={cn(
              'group relative rounded-xl border px-4 py-3.5 text-left text-sm font-semibold transition-all',
              active
                ? 'border-2 border-primary bg-primary/10 text-primary shadow-sm'
                : 'border border-outline-variant bg-background text-foreground hover:border-primary/30',
            )}
          >
            <span
              className={cn(
                'absolute top-3 right-3 flex size-5 items-center justify-center rounded-full border transition-colors',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-outline-variant bg-background text-transparent group-hover:border-primary/40',
              )}
              aria-hidden="true"
            >
              <span className="material-symbols-outlined text-[11px] leading-none">check</span>
            </span>
            <span className="block pr-8">{label(slot)}</span>
          </button>
        );
      })}
    </div>
  );
}
