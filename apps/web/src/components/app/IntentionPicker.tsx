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
    <div className="grid gap-3">
      {options.map((option) => {
        const active = value === option;
        return (
          <label
            key={option}
            className={cn(
              'flex min-h-11 cursor-pointer items-start gap-4 rounded-xl border p-4 transition-colors',
              active
                ? 'border-2 border-primary bg-primary/10'
                : 'border border-outline-variant/60 bg-background/50 hover:border-primary/40',
            )}
          >
            <input
              type="radio"
              name="intention"
              value={option}
              checked={active}
              onChange={() => onChange(option)}
              className="mt-1 h-4 w-4 border-outline-variant text-primary focus:ring-primary"
            />
            <div className="min-w-0 flex-1">
              <span
                className={cn(
                  'block text-base font-medium',
                  active ? 'text-primary' : 'text-foreground',
                )}
              >
                {label(option)}
              </span>
              {hint ? (
                <span
                  className={cn(
                    'mt-1 block text-sm',
                    active ? 'text-primary/80' : 'text-muted-foreground',
                  )}
                >
                  {hint(option)}
                </span>
              ) : null}
            </div>
          </label>
        );
      })}
    </div>
  );
}
