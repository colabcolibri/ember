import type { ensureDatabaseReady } from '@ember/db';
import {
  deleteMatchingRoundDraft,
  findMatchingRoundDraft,
  insertMatchingAuditEvent,
  loadMatchingMembers,
  loadMetPairs,
  upsertMatchingRoundDraft,
} from '@ember/db';
import { runMatchingEngine, type TrioProposal, type UnmatchedMember } from '@ember/domain';

type Db = ReturnType<typeof ensureDatabaseReady>;

export type AutoMatchResult = {
  trios: TrioProposal[];
  unmatched: number;
  unmatchedMembers: UnmatchedMember[];
  auditEventId: string;
  draftCreatedAt: string;
};

export function executeAutoMatch(
  db: Db,
  input: { communityId: string; roundId: string; actorUserId: string },
): AutoMatchResult {
  const members = loadMatchingMembers(db, input.communityId, input.roundId);
  if (members.length < 3) {
    throw new Error('NOT_ENOUGH_MEMBERS');
  }

  const metPairs = loadMetPairs(db, input.communityId);
  const result = runMatchingEngine(members, metPairs);

  const draft = upsertMatchingRoundDraft(db, {
    roundId: input.roundId,
    trios: result.trios,
    unmatchedMembers: result.unmatchedMembers,
    triggeredBy: input.actorUserId,
  });

  const audit = insertMatchingAuditEvent(db, {
    roundId: input.roundId,
    actorUserId: input.actorUserId,
    action: 'auto_match',
    payload: {
      circleCount: result.trios.length,
      unmatched: result.unmatched,
    },
  });

  return {
    trios: result.trios,
    unmatched: result.unmatched,
    unmatchedMembers: result.unmatchedMembers,
    auditEventId: audit.id,
    draftCreatedAt: draft.createdAt,
  };
}

export function undoAutoMatch(
  db: Db,
  input: { roundId: string; actorUserId: string },
): boolean {
  const removed = deleteMatchingRoundDraft(db, input.roundId);
  if (removed) {
    insertMatchingAuditEvent(db, {
      roundId: input.roundId,
      actorUserId: input.actorUserId,
      action: 'undo_auto_match',
      payload: {},
    });
  }
  return removed;
}

export function loadAutoMatchDraft(db: Db, roundId: string) {
  return findMatchingRoundDraft(db, roundId);
}

export function updateAutoMatchDraftTrios(
  db: Db,
  input: {
    roundId: string;
    trios: TrioProposal[];
    unmatchedMembers: UnmatchedMember[];
    actorUserId: string;
  },
): void {
  const existing = findMatchingRoundDraft(db, input.roundId);
  if (!existing) {
    throw new Error('DRAFT_NOT_FOUND');
  }

  upsertMatchingRoundDraft(db, {
    roundId: input.roundId,
    trios: input.trios,
    unmatchedMembers: input.unmatchedMembers,
    triggeredBy: existing.triggeredBy,
  });

  insertMatchingAuditEvent(db, {
    roundId: input.roundId,
    actorUserId: input.actorUserId,
    action: 'auto_match',
    payload: { manualAdjust: true, circleCount: input.trios.length },
  });
}
