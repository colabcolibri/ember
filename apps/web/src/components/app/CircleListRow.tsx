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
        'group relative block overflow-hidden rounded-card border border-outline-variant/30 bg-paper p-6 shadow-sm transition-colors hover:border-primary/30',
        className,
      )}
    >
      <div className="ember-card-gradient pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <p className="text-[11px] font-extrabold tracking-[0.12em] text-primary uppercase">
            {communityName}
          </p>
          <p className="font-serif text-xl leading-snug font-medium text-foreground group-hover:text-primary">
            {question}
          </p>
        </div>
        {status ? <AppBadge variant="sage">{status}</AppBadge> : null}
        <span className="material-symbols-outlined ml-auto text-primary opacity-0 transition-opacity group-hover:opacity-100 sm:ml-0">
          arrow_forward
        </span>
      </div>
    </Link>
  );
}
