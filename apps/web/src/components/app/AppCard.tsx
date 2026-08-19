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
};

export function AppCard({ title, description, children, footer, className, interactive }: AppCardProps) {
  return (
    <Card
      className={cn(
        'rounded-[var(--radius-card)] border-border/80 bg-card shadow-none',
        interactive && 'transition-colors hover:border-primary/30',
        className,
      )}
    >
      {title || description ? (
        <CardHeader className="gap-1 pb-0">
          {title ? <CardTitle className="text-lg">{title}</CardTitle> : null}
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
      ) : null}
      <CardContent className={cn(!title && !description && 'pt-6', !children && 'hidden')}>
        {children}
      </CardContent>
      {footer ? <CardFooter>{footer}</CardFooter> : null}
    </Card>
  );
}
