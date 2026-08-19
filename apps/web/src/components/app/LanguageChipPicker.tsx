import { cn } from '@/lib/utils';

type LanguageChipPickerProps = {
  options: readonly string[];
  selected: string[];
  onToggle: (code: string) => void;
};

export function LanguageChipPicker({ options, selected, onToggle }: LanguageChipPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((code) => {
        const active = selected.includes(code);
        return (
          <button
            key={code}
            type="button"
            onClick={() => onToggle(code)}
            className={cn(
              'min-h-11 rounded-full border px-4 py-2 text-sm font-semibold uppercase transition-colors',
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background hover:border-primary/30',
            )}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
