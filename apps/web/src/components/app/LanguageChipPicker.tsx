import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type LanguageChipPickerProps = {
  options: readonly string[];
  selected: string[];
  onToggle: (code: string) => void;
};

export function LanguageChipPicker({ options, selected, onToggle }: LanguageChipPickerProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((code) => {
        const active = selected.includes(code);
        return (
          <button
            key={code}
            type="button"
            onClick={() => onToggle(code)}
            className={cn(
              'flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-semibold uppercase transition-all sm:flex-none',
              active
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'border-outline-variant bg-background/50 text-foreground hover:border-primary/40',
            )}
          >
            {active ? <Check className="size-4" aria-hidden /> : null}
            {code}
          </button>
        );
      })}
    </div>
  );
}
