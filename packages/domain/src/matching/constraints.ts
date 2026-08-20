import type { MemberLanguage } from '../schemas/profile.js';
import type { PresenceIntention } from '../schemas/auth.js';
import { SLOT_COMPAT } from '../schemas/auth.js';

export type MatchingMember = {
  userId: string;
  slots: string[];
  languages: MemberLanguage[];
  intention: PresenceIntention;
};

export type GroupProposal = {
  memberIds: string[];
  slot: string;
  score: number;
};

/** @deprecated use GroupProposal with exactly three members */
export type TrioProposal = GroupProposal & {
  memberIds: [string, string, string];
};

export function hasCommonLanguage(a: MemberLanguage[], b: MemberLanguage[]): boolean {
  return a.some((lang) => b.includes(lang));
}

export function trioHasCommonLanguage(members: MatchingMember[]): boolean {
  return groupHasCommonLanguage(members);
}

export function groupHasCommonLanguage(members: MatchingMember[]): boolean {
  if (members.length < 2) return false;
  let common = new Set(members[0]!.languages);
  for (const member of members.slice(1)) {
    common = new Set(member.languages.filter((language) => common.has(language)));
    if (common.size === 0) return false;
  }
  return true;
}

export function resolveCommonFacilitatorSlot(members: MatchingMember[]): string | null {
  const normalized = members.map((member) =>
    member.slots.map((slot) => SLOT_COMPAT[slot as keyof typeof SLOT_COMPAT] ?? slot),
  );
  const [first, ...rest] = normalized;
  if (!first?.length) return null;
  for (const slot of first) {
    if (rest.every((set) => set.includes(slot))) return slot;
  }
  return null;
}

export function isValidGroup(members: MatchingMember[]): boolean {
  if (members.length < 2 || members.length > 4) return false;
  if (!groupHasCommonLanguage(members)) return false;
  return resolveCommonFacilitatorSlot(members) !== null;
}

export function isValidTrio(members: MatchingMember[]): boolean {
  return members.length === 3 && isValidGroup(members);
}
