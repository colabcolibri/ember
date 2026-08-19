import type { ReactNode } from 'react';
import { AppCard } from './AppCard.js';
import { AppBadge } from './AppBadge.js';

type CircleInviteCardProps = {
  communityName: string;
  question: string | null;
  when: ReactNode;
  status?: string;
};

export function CircleInviteCard({ communityName, question, when, status }: CircleInviteCardProps) {
  return (
    <AppCard className="overflow-hidden">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold tracking-[0.12em] text-primary uppercase">{communityName}</p>
          {status ? <AppBadge variant="rust">{status}</AppBadge> : null}
        </div>
        <h2 className="font-serif text-2xl leading-tight font-medium">{question}</h2>
        <p className="text-sm text-muted-foreground">{when}</p>
      </div>
    </AppCard>
  );
}
