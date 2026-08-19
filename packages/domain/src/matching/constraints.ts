import type { MemberLanguage } from '../schemas/profile.js';
import type { PresenceIntention, RoundSlot } from '../schemas/auth.js';

/** Mapa membro → slot da rodada (facilitador). */
export const SLOT_COMPAT: Record<RoundSlot, string> = {
  'mon-evening': 'mon-19h',
  'wed-evening': 'wed-19h',
  'sat-morning': 'sat-10h',
};

export type MatchingMember = {
  userId: string;
  slots: RoundSlot[];
  languages: MemberLanguage[];
  intention: PresenceIntention;
};

export type TrioProposal = {
  memberIds: [string, string, string];
  slot: string;
  score: number;
};

export function hasCommonLanguage(a: MemberLanguage[], b: MemberLanguage[]): boolean {
  return a.some((lang) => b.includes(lang));
}

export function trioHasCommonLanguage(members: MatchingMember[]): boolean {
  if (members.length < 2) return false;
  let common = new Set(members[0]!.languages);
  for (const m of members.slice(1)) {
    common = new Set(m.languages.filter((l) => common.has(l)));
    if (common.size === 0) return false;
  }
  return true;
}

export function resolveCommonFacilitatorSlot(members: MatchingMember[]): string | null {
  const facilitatorSlots = members.map((m) =>
    m.slots.map((s) => SLOT_COMPAT[s]).filter(Boolean),
  );
  const [first, ...rest] = facilitatorSlots;
  if (!first?.length) return null;
  for (const slot of first) {
    if (rest.every((set) => set.includes(slot))) return slot;
  }
  return null;
}

export function isValidTrio(members: MatchingMember[]): boolean {
  if (members.length !== 3) return false;
  if (!trioHasCommonLanguage(members)) return false;
  return resolveCommonFacilitatorSlot(members) !== null;
}
