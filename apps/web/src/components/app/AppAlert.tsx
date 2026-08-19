import type { ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

type AppAlertVariant = 'default' | 'success' | 'error' | 'info';

const variantClasses: Record<AppAlertVariant, string> = {
  default: '',
  success: 'border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/5 text-[hsl(var(--success))]',
  error: '',
  info: 'border-border bg-muted/40',
};

type AppAlertProps = {
  variant?: AppAlertVariant;
  title?: ReactNode;
  children: ReactNode;
};

export function AppAlert({ variant = 'default', title, children }: AppAlertProps) {
  return (
    <Alert
      variant={variant === 'error' ? 'destructive' : 'default'}
      className={cn(variantClasses[variant])}
    >
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}
