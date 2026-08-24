import type { ensureDatabaseReady } from '@ember/db';
import {
  deleteMatchingRoundDraft,
  findMatchingRoundDraft,
  findTemplateById,
  insertMatchingAuditEvent,
  loadMatchingMembers,
  loadMetPairs,
  upsertMatchingRoundDraft,
  findRoundById,
} from '@ember/db';
import { runMatchingEngine, matchingOptionsFromCircleSize, type GroupProposal, type UnmatchedMember } from '@ember/domain';

type Db = ReturnType<typeof ensureDatabaseReady>;

export type AutoMatchResult = {
  groups: GroupProposal[];
  /** @deprecated use groups */
  trios: GroupProposal[];
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
  if (members.length < 2) {
    throw new Error('NOT_ENOUGH_MEMBERS');
  }

  const metPairs = loadMetPairs(db, input.communityId);
  const round = findRoundById(db, input.roundId);
  const template = round?.template_id ? findTemplateById(db, round.template_id) : null;
  const result = runMatchingEngine(
    members,
    metPairs,
    matchingOptionsFromCircleSize(template?.circle_size),
  );

  const draft = upsertMatchingRoundDraft(db, {
    roundId: input.roundId,
    groups: result.groups,
    unmatchedMembers: result.unmatchedMembers,
    triggeredBy: input.actorUserId,
  });

  const audit = insertMatchingAuditEvent(db, {
    roundId: input.roundId,
    actorUserId: input.actorUserId,
    action: 'auto_match',
    payload: {
      circleCount: result.groups.length,
      unmatched: result.unmatched,
    },
  });

  return {
    groups: result.groups,
    trios: result.groups,
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

export function updateAutoMatchDraftGroups(
  db: Db,
  input: {
    roundId: string;
    groups: GroupProposal[];
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
    groups: input.groups,
    unmatchedMembers: input.unmatchedMembers,
    triggeredBy: existing.triggeredBy,
  });

  insertMatchingAuditEvent(db, {
    roundId: input.roundId,
    actorUserId: input.actorUserId,
    action: 'auto_match',
    payload: { manualAdjust: true, circleCount: input.groups.length },
  });
}

/** @deprecated use updateAutoMatchDraftGroups */
export const updateAutoMatchDraftTrios = updateAutoMatchDraftGroups;
