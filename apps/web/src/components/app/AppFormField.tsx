import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type AppFormFieldProps = {
  label: ReactNode;
  htmlFor?: string;
  error?: string;
  children: ReactNode;
  className?: string;
};

export function AppFormField({ label, htmlFor, error, children, className }: AppFormFieldProps) {
  return (
    <div className={cn('grid gap-2', className)}>
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </Label>
      {children}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
