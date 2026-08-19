import { cn } from '@/lib/utils';

type AvailabilityPickerProps = {
  slots: string[];
  selected: string[];
  onToggle: (slot: string) => void;
  label: (slot: string) => string;
};

export function AvailabilityPicker({ slots, selected, onToggle, label }: AvailabilityPickerProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {slots.map((slot) => {
        const active = selected.includes(slot);
        return (
          <button
            key={slot}
            type="button"
            onClick={() => onToggle(slot)}
            className={cn(
              'rounded-full border px-5 py-2.5 text-sm font-medium transition-all',
              active
                ? 'border-2 border-primary bg-primary/10 text-primary'
                : 'border border-outline-variant bg-transparent text-foreground hover:bg-background',
            )}
          >
            {label(slot)}
          </button>
        );
      })}
    </div>
  );
}
