import { Link } from 'react-router-dom';
import { AppBadge } from './AppBadge.js';
import { cn } from '@/lib/utils';

type CircleListRowProps = {
  id: string;
  communityName: string;
  question: string;
  status?: string;
  className?: string;
};

export function CircleListRow({ id, communityName, question, status, className }: CircleListRowProps) {
  return (
    <Link
      to={`/circles/${id}`}
      className={cn(
        'block rounded-[var(--radius-card)] border border-border/80 bg-card p-5 transition-colors hover:border-primary/30',
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-bold tracking-[0.12em] text-primary uppercase">{communityName}</p>
          <p className="font-medium leading-snug">{question}</p>
        </div>
        {status ? <AppBadge variant="sage">{status}</AppBadge> : null}
      </div>
    </Link>
  );
}
