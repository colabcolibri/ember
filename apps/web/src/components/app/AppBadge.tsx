import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type AppBadgeVariant = 'default' | 'sage' | 'rust' | 'muted';

const variantClasses: Record<AppBadgeVariant, string> = {
  default: '',
  sage: 'border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]',
  rust: 'border-primary/30 bg-primary/10 text-primary',
  muted: 'bg-muted text-muted-foreground',
};

export function AppBadge({
  children,
  variant = 'default',
  title,
}: {
  children: ReactNode;
  variant?: AppBadgeVariant;
  title?: string;
}) {
  return (
    <Badge title={title} className={cn('rounded-full font-semibold', variantClasses[variant])}>
      {children}
    </Badge>
  );
}
