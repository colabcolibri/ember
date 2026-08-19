import type { ReactNode } from 'react';
import { AppBadge } from './AppBadge.js';
import { cn } from '@/lib/utils';

type CircleInviteCardProps = {
  communityName: string;
  question: string | null;
  when: ReactNode;
  status?: string;
};

export function CircleInviteCard({ communityName, question, when, status }: CircleInviteCardProps) {
  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-[28px] border border-outline-variant/20 bg-paper p-8 shadow-sm',
      )}
    >
      <div
        className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full border border-primary/10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full border border-primary/5"
        aria-hidden="true"
      />
      <div className="relative z-10 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">
            {communityName}
          </p>
          {status ? <AppBadge variant="rust">{status}</AppBadge> : null}
        </div>
        <h2 className="font-serif text-3xl leading-tight font-bold text-foreground sm:text-4xl">
          {question}
        </h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>
            schedule
          </span>
          <span>{when}</span>
        </div>
      </div>
    </article>
  );
}
