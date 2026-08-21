import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area.js';
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

/** Altura máxima do corpo rolável — desconta header, footer e margem da viewport. */
const dialogBodyScrollClass = 'max-h-[min(calc(100dvh-12rem),720px)]';

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
      <DialogContent
        className={cn(
          'flex max-h-[min(calc(100dvh-2rem),900px)] flex-col gap-0 overflow-hidden rounded-card p-0',
          sizeClasses[size],
        )}
      >
        <DialogHeader className="shrink-0 gap-2 border-b border-outline-variant/20 px-6 py-5 text-left">
          <DialogTitle className={variant === 'destructive' ? 'text-destructive' : undefined}>
            {title}
          </DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <ScrollArea className={cn('min-h-0', dialogBodyScrollClass)}>
          <div className="px-6 py-4">{body}</div>
        </ScrollArea>

        {footer ? (
          <DialogFooter className="mt-auto shrink-0 gap-2 border-t border-outline-variant/20 px-6 py-4 sm:justify-end">
            {footer}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
