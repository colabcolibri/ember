import { cn } from '@/lib/utils';

type Intention = 'surprise' | 'frontier' | 'ease';

type IntentionPickerProps = {
  value: Intention;
  onChange: (value: Intention) => void;
  options: readonly Intention[];
  label: (value: Intention) => string;
  hint?: (value: Intention) => string;
};

export function IntentionPicker({ value, onChange, options, label, hint }: IntentionPickerProps) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="radiogroup">
      {options.map((option) => {
        const active = value === option;
        return (
          <label
            key={option}
            className={cn(
              'flex min-h-[5.5rem] cursor-pointer flex-col justify-center rounded-xl border px-3 py-3 text-center transition-colors sm:min-h-[6.5rem] sm:px-4',
              active
                ? 'border-2 border-primary bg-primary/10 shadow-sm'
                : 'border border-outline-variant/60 bg-background/50 hover:border-primary/40',
            )}
          >
            <input
              type="radio"
              name="intention"
              value={option}
              checked={active}
              onChange={() => onChange(option)}
              className="sr-only"
            />
            <span
              className={cn(
                'block text-sm font-semibold sm:text-base',
                active ? 'text-primary' : 'text-foreground',
              )}
            >
              {label(option)}
            </span>
            {hint ? (
              <span
                className={cn(
                  'mt-1 block text-xs leading-snug',
                  active ? 'text-primary/80' : 'text-muted-foreground',
                )}
              >
                {hint(option)}
              </span>
            ) : null}
          </label>
        );
      })}
    </div>
  );
}
