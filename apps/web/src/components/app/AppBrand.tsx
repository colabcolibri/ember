import { cn } from '@/lib/utils';

const MARK_SRC = '/brand/ember-mark.svg';
const LOGO_SRC = '/brand/ember-logo.svg';

type AppBrandProps = {
  className?: string;
  /** Só o mark, sem wordmark — padrão no header */
  markOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

const sizeClasses = {
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
  lg: 'h-10 w-auto max-w-[7.5rem]',
} as const;

export function AppBrand({ className, markOnly = true, size = 'md' }: AppBrandProps) {
  const sizeClass = sizeClasses[size];
  const src = markOnly ? MARK_SRC : LOGO_SRC;

  return (
    <img
      src={src}
      alt="Ember"
      className={cn('shrink-0 object-contain', sizeClass, className)}
    />
  );
}
