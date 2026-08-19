import { cn } from '@/lib/utils';

const LOGO_SRC = '/brand/ember-mark.png';

type AppBrandProps = {
  className?: string;
  /** Só o mark, sem wordmark — padrão no header */
  markOnly?: boolean;
  size?: 'sm' | 'md';
};

export function AppBrand({ className, markOnly = true, size = 'md' }: AppBrandProps) {
  const sizeClass = size === 'sm' ? 'size-7' : 'size-8';

  if (markOnly) {
    return (
      <img
        src={LOGO_SRC}
        alt="Ember"
        className={cn('shrink-0 object-contain', sizeClass, className)}
      />
    );
  }

  return (
    <div className={cn('flex items-center gap-2 font-serif text-primary italic', className)}>
      <img src={LOGO_SRC} alt="" aria-hidden className={cn('shrink-0 object-contain', sizeClass)} />
      <span className="text-2xl font-bold tracking-tight">Ember</span>
    </div>
  );
}
