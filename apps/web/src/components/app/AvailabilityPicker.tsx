import { cn } from '@/lib/utils';

type AvailabilityPickerProps = {
  slots: string[];
  selected: string[];
  onToggle: (slot: string) => void;
  label: (slot: string) => string;
};

export function AvailabilityPicker({ slots, selected, onToggle, label }: AvailabilityPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {slots.map((slot) => {
        const active = selected.includes(slot);
        return (
          <button
            key={slot}
            type="button"
            onClick={() => onToggle(slot)}
            className={cn(
              'min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
              active
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background text-foreground hover:border-primary/30',
            )}
          >
            {label(slot)}
          </button>
        );
      })}
    </div>
  );
}
