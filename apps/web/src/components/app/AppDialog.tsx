import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type AppDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  body: ReactNode;
  footer?: ReactNode;
  variant?: 'default' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
};

const sizeClasses = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
};

export function AppDialog({
  open,
  onOpenChange,
  title,
  description,
  body,
  footer,
  variant = 'default',
  size = 'md',
}: AppDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('rounded-[var(--radius-card)]', sizeClasses[size])}>
        <DialogHeader>
          <DialogTitle className={variant === 'destructive' ? 'text-destructive' : undefined}>
            {title}
          </DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="py-2">{body}</div>
        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
}
