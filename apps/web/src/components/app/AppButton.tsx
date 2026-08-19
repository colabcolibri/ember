import type { ComponentProps, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { Button, type buttonVariants } from '@/components/ui/button';
import type { VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

type AppButtonProps = ComponentProps<typeof Button> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
    children: ReactNode;
  };

export function AppButton({
  loading = false,
  disabled,
  children,
  className,
  ...props
}: AppButtonProps) {
  return (
    <Button disabled={disabled || loading} className={cn('min-h-11', className)} {...props}>
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </Button>
  );
}
