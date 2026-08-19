import { cn } from '@/lib/utils';

const LOGO_SRC = '/brand/ember-mark.png';

type AppBrandProps = {
  className?: string;
  compact?: boolean;
  showWordmark?: boolean;
};

export function AppBrand({ className, compact, showWordmark = true }: AppBrandProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 font-serif text-primary',
        showWordmark && 'italic',
        className,
      )}
    >
      <img
        src={LOGO_SRC}
        alt=""
        aria-hidden
        className={cn('shrink-0 rounded-full object-cover', compact ? 'size-7' : 'size-8')}
      />
      {showWordmark ? (
        <span className={cn('font-bold tracking-tight', compact ? 'text-xl' : 'text-2xl')}>
          Ember
        </span>
      ) : null}
    </div>
  );
}
