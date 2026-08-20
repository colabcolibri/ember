export type GatheringCycleStepId = 'registrations' | 'closed' | 'matching' | 'published';

export type StepVisualState = 'complete' | 'current' | 'upcoming';

export type GatheringMatchProgress = {
  hasDraft: boolean;
  groupCount: number;
};

export type GatheringCycleStep = {
  id: GatheringCycleStepId;
  state: StepVisualState;
};

const STEP_ORDER: GatheringCycleStepId[] = ['registrations', 'closed', 'matching', 'published'];

export function getCurrentCycleStepIndex(status: string, match: GatheringMatchProgress): number {
  if (status === 'published') return STEP_ORDER.length;
  if (status === 'closed') {
    if (match.groupCount > 0) return 3;
    return 2;
  }
  if (status === 'open') return 0;
  return 0;
}

export function deriveGatheringCycleSteps(
  status: string,
  match: GatheringMatchProgress,
): GatheringCycleStep[] {
  const currentIndex = getCurrentCycleStepIndex(status, match);

  return STEP_ORDER.map((id, index) => {
    if (currentIndex >= STEP_ORDER.length) {
      return { id, state: 'complete' as const };
    }
    if (index < currentIndex) return { id, state: 'complete' as const };
    if (index === currentIndex) return { id, state: 'current' as const };
    return { id, state: 'upcoming' as const };
  });
}

export function canRunMatching(status: string): boolean {
  return status === 'closed';
}

export function canCloseRegistrations(status: string): boolean {
  return status === 'open';
}

export function canReopenRegistrations(status: string, circleCount: number): boolean {
  return status === 'closed' && circleCount === 0;
}
