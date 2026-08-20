import { describe, expect, it } from 'vitest';
import { deriveGatheringCycleSteps, getCurrentCycleStepIndex } from './gathering-cycle.js';

describe('gathering cycle', () => {
  it('marks registrations as current while open', () => {
    const steps = deriveGatheringCycleSteps('open', { hasDraft: false, groupCount: 0 });
    expect(steps[0]?.state).toBe('current');
    expect(steps[1]?.state).toBe('upcoming');
  });

  it('moves to matching after close', () => {
    expect(getCurrentCycleStepIndex('closed', { hasDraft: false, groupCount: 0 })).toBe(2);
    const steps = deriveGatheringCycleSteps('closed', { hasDraft: false, groupCount: 0 });
    expect(steps[0]?.state).toBe('complete');
    expect(steps[1]?.state).toBe('complete');
    expect(steps[2]?.state).toBe('current');
  });

  it('moves to publish when groups are ready', () => {
    const steps = deriveGatheringCycleSteps('closed', { hasDraft: true, groupCount: 2 });
    expect(steps[2]?.state).toBe('complete');
    expect(steps[3]?.state).toBe('current');
  });

  it('marks all steps complete when published', () => {
    const steps = deriveGatheringCycleSteps('published', { hasDraft: false, groupCount: 3 });
    expect(steps.every((step) => step.state === 'complete')).toBe(true);
  });
});
