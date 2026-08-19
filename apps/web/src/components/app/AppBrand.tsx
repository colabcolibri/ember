import { cn } from '@/lib/utils';

export function AppBrand({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5 font-bold tracking-tight text-foreground', className)}>
      <span className="ember-mark" aria-hidden="true" />
      <span>Ember</span>
    </div>
  );
}
