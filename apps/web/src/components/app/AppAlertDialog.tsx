import type { ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AppButton } from './AppButton.js';
import { cn } from '@/lib/utils';

type AppAlertDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  body?: ReactNode;
  cancelLabel: ReactNode;
  confirmLabel: ReactNode;
  onConfirm: () => void;
  loading?: boolean;
  variant?: 'default' | 'destructive';
};

export function AppAlertDialog({
  open,
  onOpenChange,
  title,
  description,
  body,
  cancelLabel,
  confirmLabel,
  onConfirm,
  loading = false,
  variant = 'default',
}: AppAlertDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle
            className={cn(variant === 'destructive' && 'text-destructive')}
          >
            {title}
          </AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>
        {body ? <div className="text-sm text-muted-foreground">{body}</div> : null}
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <AppButton type="button" variant="outline" disabled={loading}>
              {cancelLabel}
            </AppButton>
          </AlertDialogCancel>
          <AppButton
            type="button"
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AppButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
