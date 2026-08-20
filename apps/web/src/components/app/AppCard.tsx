import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type AppCardProps = {
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  interactive?: boolean;
  sectionLabel?: ReactNode;
};

export function AppCard({
  title,
  description,
  children,
  footer,
  className,
  interactive,
  sectionLabel,
}: AppCardProps) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden rounded-(--radius-card) border-outline-variant/30 bg-paper shadow-sm',
        interactive && 'transition-colors hover:border-primary/30',
        className,
      )}
    >
      <div className="ember-card-gradient pointer-events-none absolute inset-0" aria-hidden="true" />
      {sectionLabel ? (
        <div className="relative z-10 border-b border-outline-variant/30 px-6 pt-6 pb-0 sm:px-8">
          <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            {sectionLabel}
          </p>
        </div>
      ) : null}
      {title || description ? (
        <CardHeader className={cn('relative z-10 gap-1', sectionLabel ? 'pt-4' : 'pb-0')}>
          {title ? (
            <CardTitle className="font-serif text-xl font-bold text-foreground">{title}</CardTitle>
          ) : null}
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
      ) : null}
      <CardContent
        className={cn(
          'relative z-10 px-6 py-6 sm:px-8 sm:py-8',
          !title && !description && !sectionLabel && 'pt-6 sm:pt-8',
          !children && 'hidden',
        )}
      >
        {children}
      </CardContent>
      {footer ? <CardFooter className="relative z-10">{footer}</CardFooter> : null}
    </Card>
  );
}
