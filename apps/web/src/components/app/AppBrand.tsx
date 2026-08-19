import { cn } from '@/lib/utils';

type AppBrandProps = {
  className?: string;
  compact?: boolean;
};

export function AppBrand({ className, compact }: AppBrandProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 font-serif text-primary italic',
        compact ? 'text-xl' : 'text-2xl',
        className,
      )}
    >
      <span className="ember-mark" aria-hidden="true" />
      <span className="font-bold tracking-tight">Ember</span>
    </div>
  );
}
