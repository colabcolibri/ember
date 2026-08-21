import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { AppButton } from './AppButton.js';

type AppBackLinkProps = {
  to: string;
  children: ReactNode;
  className?: string;
};

export function AppBackLink({ to, children, className }: AppBackLinkProps) {
  return (
    <AppButton asChild variant="ghost" size="sm" className={cn('w-fit justify-start', className)}>
      <Link to={to}>
        <span className="material-symbols-outlined text-base leading-none" aria-hidden="true">
          arrow_back
        </span>
        {children}
      </Link>
    </AppButton>
  );
}
