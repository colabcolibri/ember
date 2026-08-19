import { cn } from '@/lib/utils';

type Intention = 'surprise' | 'frontier' | 'ease';

type IntentionPickerProps = {
  value: Intention;
  onChange: (value: Intention) => void;
  options: readonly Intention[];
  label: (value: Intention) => string;
};

export function IntentionPicker({ value, onChange, options, label }: IntentionPickerProps) {
  return (
    <div className="grid gap-3">
      {options.map((option) => (
        <label
          key={option}
          className={cn(
            'flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors',
            value === option ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/20',
          )}
        >
          <input
            type="radio"
            name="intention"
            value={option}
            checked={value === option}
            onChange={() => onChange(option)}
            className="mt-1"
          />
          <span className="text-sm leading-relaxed">{label(option)}</span>
        </label>
      ))}
    </div>
  );
}
