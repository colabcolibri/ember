import type { PlaceRef } from '../lib/place.js';
import { profileCompleteness } from '@ember/domain/profile/completeness';
import {
  isFacilitatorDemoEmail,
  isNewMemberDemoEmail,
  isOrgAdminDemoEmail,
} from '../lib/mock-mode.js';
import { buildJitsiRoomUrl } from '../lib/jitsi-room-url.js';
import {
  DEFAULT_COMMUNITY_PUBLIC_SETTINGS,
  mergeCommunityPublicSettings,
  type CommunityBrandingInput,
  type CommunityPublicSettings,
} from '@ember/domain/schemas/community-branding';
import {
  MOCK_COMMUNITY_NAME,
  MOCK_PLACES,
  MOCK_QUESTIONS,
  MOCK_REGIONAL_SLOTS,
  MOCK_TEMPLATES,
} from './data.js';
import {
  MOCK_ROUND_SEEDS,
  MOCK_USERS,
  MOCK_USER_BY_ID,
  buildMatchDraftFromDeclarations,
  buildPopulationMemberRecords,
  buildRoundDeclarations,
  type MockPopulationDeclaration,
  type MockTrio,
  type MockUnmatchedMember,
} from './population.js';

const STORAGE_KEY = 'ember-mock-v5';

type MockSession = {
  email: string;
  isFacilitator: boolean;
};

type MockProfile = {
  displayName: string;
  editionYear: number | null;
  timezone: string;
  languages: string[];
  originPlace: PlaceRef | null;
  residencePlace: PlaceRef | null;
  isFacilitator: boolean;
  isOrgAdmin: boolean;
};

type MockMemberRecord = {
  userId: string;
  email: string;
  role: string;
  invitedAt: string | null;
  profileComplete: boolean;
  displayName: string | null;
};

type MockDeclaration = {
  slots: string[];
  intention: 'surprise' | 'frontier' | 'ease';
};

type MockDeclarationRow = {
  userId: string;
  memberLabel: string;
  emailMasked: string;
  slots: string[];
  intention: 'surprise' | 'frontier' | 'ease' | 'declined';
  languages: string[];
  timezone: string | null;
  response: 'attending' | 'declined';
};

function attendingDeclarationCount(round: MockRound): number {
  return round.declarations.filter((item) => item.response === 'attending').length;
}

type MockCircle = {
  id: string;
  status: string;
  question: string | null;
  communityName: string;
  scheduledSlot: string | null;
  scheduledAt: string | null;
  jitsiUrl: string | null;
  durationMinutes: number;
  canRecordAttendance: boolean;
  myStatus: string;
  myAttendance: string | null;
  members: Array<{ userId: string; label: string; status: string; attendance: string | null }>;
};

type MockTemplate = {
  id: string;
  name: string;
  circleSize: number;
  durationMinutes: number;
};

type MockRound = {
  id: string;
  status: 'open' | 'closed' | 'published';
  theme: string;
  questions: string[];
  createdAt: string;
  templateId: string;
  circleCount: number;
  declarations: MockDeclarationRow[];
  autoMatchDraft: {
    trios: MockTrio[];
    unmatchedMembers: MockUnmatchedMember[];
  } | null;
  lastUnmatchedMembers: MockUnmatchedMember[];
  publishedCircleIds: string[];
};

function mockTemplateFor(round: MockRound) {
  return MOCK_TEMPLATES.find((template) => template.id === round.templateId) ?? MOCK_TEMPLATES[0]!;
}

function mapMockGatheringSummary(round: MockRound) {
  const template = mockTemplateFor(round);
  const slotPreview = MOCK_REGIONAL_SLOTS.map((slot) => slot.officialLabel);

  return {
    id: round.id,
    status: round.status,
    theme: round.theme,
    questions: [...round.questions],
    createdAt: round.createdAt,
    declarationCount: attendingDeclarationCount(round),
    templateName: template.name,
    circleSize: template.circleSize,
    durationMinutes: template.durationMinutes,
    slotCount: MOCK_REGIONAL_SLOTS.length,
    slotPreview,
    circleCount: round.circleCount,
  };
}

function mapMockGatheringDetail(round: MockRound) {
  return {
    ...mapMockGatheringSummary(round),
    slotLabels: SLOT_LABELS,
    slots: MOCK_REGIONAL_SLOTS,
    templateId: round.templateId,
  };
}

type PersistedState = {
  session: MockSession | null;
  profile: MockProfile;
  declaration: MockDeclaration | null;
  rounds: MockRound[];
  circles: MockCircle[];
  templates: MockTemplate[];
  publicSettings: CommunityPublicSettings;
  members: MockMemberRecord[];
};

function asPopulationDeclarations(rows: MockDeclarationRow[]): MockPopulationDeclaration[] {
  return rows
    .filter((row) => row.response === 'attending')
    .map((row) => ({
      userId: row.userId,
      memberLabel: row.memberLabel,
      emailMasked: row.emailMasked,
      slots: [...row.slots],
      intention: row.intention as 'surprise' | 'frontier' | 'ease',
      languages: [...row.languages],
      timezone: row.timezone ?? 'UTC',
      response: 'attending' as const,
    }));
}

function cloneMatchGroups(groups: MockTrio[]): MockTrio[] {
  return groups.map((group) => ({
    slot: group.slot,
    score: group.score,
    memberIds: [...group.memberIds] as MockTrio['memberIds'],
  }));
}

function resolveSessionUserId(email: string): string {
  const populationUser = MOCK_USERS.find((user) => user.email === email.trim().toLowerCase());
  return populationUser?.userId ?? `user-${email.trim().toLowerCase()}`;
}

function seedRounds(): MockRound[] {
  return MOCK_ROUND_SEEDS.map((seed) => {
    const declarations = buildRoundDeclarations(seed);
    const numericSeed = seed.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const autoMatchDraft =
      seed.withAutoMatchDraft && seed.status === 'closed'
        ? buildMatchDraftFromDeclarations(declarations, seed.templateId, numericSeed)
        : null;

    return {
      id: seed.id,
      status: seed.status,
      theme: seed.theme,
      questions: [...seed.questions],
      createdAt: seed.createdAt,
      templateId: seed.templateId,
      circleCount: seed.circleCount ?? 0,
      declarations,
      autoMatchDraft: autoMatchDraft
        ? {
            trios: autoMatchDraft.trios,
            unmatchedMembers: autoMatchDraft.unmatchedMembers,
          }
        : null,
      lastUnmatchedMembers: [],
      publishedCircleIds: [],
    };
  });
}

function normalizePublishGroups(groups: MockTrio[]): MockTrio[] {
  return groups.map((group) => ({
    slot: group.slot,
    score: group.score ?? 0,
    memberIds: [...group.memberIds] as MockTrio['memberIds'],
  }));
}

function buildMockCircleFromGroup(
  round: MockRound,
  group: MockTrio,
  index: number,
  sessionUserId: string | null,
): MockCircle {
  const circleId = `${round.id}-circle-${index + 1}`;
  const template = mockTemplateFor(round);
  const question = round.questions[0] ?? null;
  const includesSessionUser = sessionUserId ? group.memberIds.includes(sessionUserId) : false;

  return {
    id: circleId,
    status: 'scheduled',
    question,
    communityName: MOCK_COMMUNITY_NAME,
    scheduledSlot: group.slot,
    scheduledAt: SLOT_LABELS[group.slot] ?? group.slot,
    jitsiUrl: buildJitsiRoomUrl(circleId),
    durationMinutes: template.durationMinutes,
    canRecordAttendance: false,
    myStatus: includesSessionUser ? 'invited' : 'confirmed',
    myAttendance: null,
    members: group.memberIds.map((userId) => ({
      userId,
      label: userId === sessionUserId ? 'Você · You' : memberLabel(userId),
      status: 'invited',
      attendance: null,
    })),
  };
}

const UNMATCHED_CSV_LABELS: Record<
  MockUnmatchedMember['reasons'][number],
  { pt: string; en: string }
> = {
  INCOMPLETE_PROFILE: { pt: 'Perfil incompleto', en: 'Incomplete profile' },
  NO_COMMON_SLOT: { pt: 'Sem horário em comum', en: 'No common slot' },
  ODD_POOL: { pt: 'Grupo ímpar', en: 'Odd pool size' },
};

function listOpenRounds(state: PersistedState): MockRound[] {
  return state.rounds.filter((round) => round.status === 'open');
}

function findOpenRound(state: PersistedState): MockRound | null {
  return listOpenRounds(state)[0] ?? null;
}

function findRound(state: PersistedState, roundId: string): MockRound | null {
  return state.rounds.find((round) => round.id === roundId) ?? null;
}

const SLOT_LABELS = Object.fromEntries(
  MOCK_REGIONAL_SLOTS.map((slot) => [slot.ref, slot.officialLabel]),
);

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const visible = local.length <= 1 ? '*' : `${local[0]}***`;
  return `${visible}@${domain}`;
}

function defaultProfile(email?: string): MockProfile {
  const normalized = email?.trim().toLowerCase();
  const populationUser = normalized
    ? MOCK_USERS.find((user) => user.email === normalized)
    : undefined;
  const localPart = normalized?.split('@')[0]?.replace(/[._-]/g, ' ') ?? 'Alex Demo';
  const displayName =
    populationUser?.displayName ??
    (localPart.charAt(0).toUpperCase() + localPart.slice(1));
  const incomplete = normalized ? isNewMemberDemoEmail(normalized) : false;

  return {
    displayName: incomplete ? '' : displayName,
    editionYear: incomplete ? null : (populationUser?.editionYear ?? 2024),
    timezone: populationUser?.timezone ?? 'America/Sao_Paulo',
    languages: incomplete ? [] : [...(populationUser?.languages ?? ['pt', 'en'])],
    originPlace: incomplete
      ? null
      : (MOCK_PLACES[populationUser?.originPlaceIndex ?? 0] ?? MOCK_PLACES[0] ?? null),
    residencePlace: incomplete
      ? null
      : (MOCK_PLACES[populationUser?.residencePlaceIndex ?? 2] ?? MOCK_PLACES[2] ?? null),
    isFacilitator: normalized ? isFacilitatorDemoEmail(normalized) : false,
    isOrgAdmin: normalized ? isOrgAdminDemoEmail(normalized) : false,
  };
}

function defaultMembers(): MockMemberRecord[] {
  return buildPopulationMemberRecords();
}

function memberLabel(userId: string): string {
  return MOCK_USER_BY_ID.get(userId)?.memberLabel ?? userId;
}

function defaultCircles(): MockCircle[] {
  const q1 = MOCK_QUESTIONS.open[0]!;
  const q2 = MOCK_ROUND_SEEDS[2]!.questions[0]!;
  const q3 = MOCK_ROUND_SEEDS[4]!.questions[0]!;

  return [
    {
      id: 'circle-invited',
      status: 'scheduled',
      question: q1,
      communityName: MOCK_COMMUNITY_NAME,
      scheduledSlot: 'Qua 19:00 (BRT)',
      scheduledAt: 'Quarta, 28 de ago · 19:00 / Wed, Aug 28 · 7:00 PM',
      jitsiUrl: 'https://meet.jit.si/ember-demo-circle-1',
      durationMinutes: 60,
      canRecordAttendance: false,
      myStatus: 'invited',
      myAttendance: null,
      members: [
        { userId: 'm-you', label: 'Você · You', status: 'invited', attendance: null },
        { userId: 'u-001', label: memberLabel('u-001'), status: 'confirmed', attendance: null },
        { userId: 'u-012', label: memberLabel('u-012'), status: 'confirmed', attendance: null },
      ],
    },
    {
      id: 'circle-upcoming',
      status: 'scheduled',
      question: q2,
      communityName: MOCK_COMMUNITY_NAME,
      scheduledSlot: 'Dom 13:00 (CET)',
      scheduledAt: 'Domingo, 31 de ago · 13:00 / Sun, Aug 31 · 1:00 PM',
      jitsiUrl: 'https://meet.jit.si/ember-demo-circle-2',
      durationMinutes: 60,
      canRecordAttendance: false,
      myStatus: 'confirmed',
      myAttendance: null,
      members: [
        { userId: 'm-you', label: 'Você · You', status: 'confirmed', attendance: null },
        { userId: 'u-005', label: memberLabel('u-005'), status: 'confirmed', attendance: null },
        { userId: 'u-006', label: memberLabel('u-006'), status: 'confirmed', attendance: null },
      ],
    },
    {
      id: 'circle-attendance',
      status: 'completed',
      question: q2,
      communityName: MOCK_COMMUNITY_NAME,
      scheduledSlot: 'Seg 19:00 (BRT)',
      scheduledAt: 'Segunda, 12 de ago · 19:00 / Mon, Aug 12 · 7:00 PM',
      jitsiUrl: null,
      durationMinutes: 60,
      canRecordAttendance: true,
      myStatus: 'confirmed',
      myAttendance: null,
      members: [
        { userId: 'm-you', label: 'Você · You', status: 'confirmed', attendance: null },
        { userId: 'u-003', label: memberLabel('u-003'), status: 'confirmed', attendance: null },
        { userId: 'u-004', label: memberLabel('u-004'), status: 'confirmed', attendance: null },
      ],
    },
    {
      id: 'circle-past',
      status: 'completed',
      question: q3,
      communityName: MOCK_COMMUNITY_NAME,
      scheduledSlot: 'Ter 20:00 (CET)',
      scheduledAt: 'Terça, 5 de ago · 20:00 / Tue, Aug 5 · 8:00 PM',
      jitsiUrl: null,
      durationMinutes: 45,
      canRecordAttendance: false,
      myStatus: 'confirmed',
      myAttendance: 'yes',
      members: [
        { userId: 'm-you', label: 'Você · You', status: 'confirmed', attendance: 'yes' },
        { userId: 'u-007', label: memberLabel('u-007'), status: 'confirmed', attendance: 'yes' },
        { userId: 'u-008', label: memberLabel('u-008'), status: 'confirmed', attendance: 'yes' },
      ],
    },
  ];
}

function createDefaultState(): PersistedState {
  return {
    session: null,
    profile: defaultProfile(),
    declaration: null,
    rounds: seedRounds(),
    circles: defaultCircles(),
    templates: MOCK_TEMPLATES.map((template) => ({ ...template })),
    publicSettings: { ...DEFAULT_COMMUNITY_PUBLIC_SETTINGS },
    members: defaultMembers(),
  };
}

function readState(): PersistedState {
  if (typeof window === 'undefined') return createDefaultState();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw) as PersistedState;
    return {
      ...createDefaultState(),
      ...parsed,
      templates: parsed.templates?.length ? parsed.templates : MOCK_TEMPLATES.map((t) => ({ ...t })),
      circles: parsed.circles?.length ? parsed.circles : defaultCircles(),
      rounds: parsed.rounds?.length === 12 ? parsed.rounds : seedRounds(),
      publicSettings: mergeCommunityPublicSettings(parsed.publicSettings),
      members: parsed.members?.length === 100 ? parsed.members : defaultMembers(),
    };
  } catch {
    return createDefaultState();
  }
}

let state = readState();

if (state.session && state.profile) {
  state.session.isFacilitator = state.profile.isFacilitator || state.profile.isOrgAdmin;
}

function persist() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function requireSession(): MockSession {
  if (!state.session) {
    throw new Error('unauthorized');
  }
  return state.session;
}

function canUseFacilitatorPanel(): boolean {
  return state.profile.isFacilitator || state.profile.isOrgAdmin;
}

function requireFacilitator() {
  requireSession();
  assertProfileComplete();
  if (!canUseFacilitatorPanel()) {
    throw new Error('forbidden');
  }
}

function requireOrgAdmin() {
  requireSession();
  assertProfileComplete();
  if (!state.profile.isOrgAdmin) {
    throw new Error('forbidden');
  }
}

function assertProfileComplete() {
  const profile = state.profile;
  if (
    !profileCompleteness({
      displayName: profile.displayName,
      editionYear: profile.editionYear,
      timezone: profile.timezone,
      languages: profile.languages,
      originPlace: profile.originPlace,
      residencePlace: profile.residencePlace,
    }).complete
  ) {
    throw new Error('profile_incomplete');
  }
}

export const mockStore = {
  reset() {
    state = createDefaultState();
    persist();
  },

  isAuthed() {
    return Boolean(state.session);
  },

  isProfileComplete() {
    if (!state.session) return false;
    const profile = state.profile;
    return profileCompleteness({
      displayName: profile.displayName,
      editionYear: profile.editionYear,
      timezone: profile.timezone,
      languages: profile.languages,
      originPlace: profile.originPlace,
      residencePlace: profile.residencePlace,
    }).complete;
  },

  login(email: string) {
    const normalized = email.trim().toLowerCase();
    const isFacilitator = isFacilitatorDemoEmail(normalized);
    const isOrgAdmin = isOrgAdminDemoEmail(normalized);
    state.session = { email: normalized, isFacilitator: isFacilitator || isOrgAdmin };
    state.profile = {
      ...defaultProfile(normalized),
      isFacilitator,
      isOrgAdmin,
    };
    persist();
  },

  logout() {
    state.session = null;
    persist();
  },

  getProfile(): MockProfile {
    requireSession();
    return { ...state.profile };
  },

  getSession() {
    if (!state.session) {
      return { authenticated: false as const };
    }

    const { isFacilitator, isOrgAdmin } = state.profile;
    const role = isOrgAdmin ? 'org_admin' : isFacilitator ? 'facilitator' : 'member';

    return {
      authenticated: true as const,
      role,
      isFacilitator: isFacilitator || isOrgAdmin,
      isOrgAdmin,
    };
  },

  updateProfile(input: Partial<MockProfile>) {
    requireSession();
    state.profile = {
      ...state.profile,
      ...input,
      isFacilitator: state.profile.isFacilitator,
      isOrgAdmin: state.profile.isOrgAdmin,
    };
    persist();
    return mockStore.getProfile();
  },

  getPublicCommunity() {
    return {
      slug: 'demo-community',
      name: MOCK_COMMUNITY_NAME,
      settings: mergeCommunityPublicSettings(state.publicSettings),
    };
  },

  getCommunityBranding() {
    requireOrgAdmin();
    return mockStore.getPublicCommunity();
  },

  updateCommunityBranding(input: CommunityBrandingInput) {
    requireOrgAdmin();
    const current = mergeCommunityPublicSettings(state.publicSettings);
    state.publicSettings = mergeCommunityPublicSettings({
      hero: { ...current.hero, ...input.hero },
      introParagraph: input.introParagraph ?? current.introParagraph,
      blocks: input.blocks ?? current.blocks,
      theme: {
        preset: input.theme?.preset ?? current.theme?.preset ?? 'ember',
        primaryOverride: input.theme?.primaryOverride ?? current.theme?.primaryOverride,
      },
    });
    persist();
    return mockStore.getPublicCommunity();
  },

  listMembers() {
    requireOrgAdmin();
    return state.members.map((member) => ({ ...member }));
  },

  inviteMember(email: string, displayName?: string | null) {
    requireOrgAdmin();
    const normalized = email.trim().toLowerCase();
    const existing = state.members.find((member) => member.email === normalized);
    if (existing) {
      existing.invitedAt = new Date().toISOString();
      if (displayName?.trim()) existing.displayName = displayName.trim();
    } else {
      state.members.unshift({
        userId: `m-${normalized.replace(/[^a-z0-9]/g, '-')}`,
        email: normalized,
        role: 'member',
        invitedAt: new Date().toISOString(),
        profileComplete: false,
        displayName: displayName?.trim() || null,
      });
    }
    persist();
  },

  importMembers(rows: Array<{ email: string; displayName?: string }>) {
    requireOrgAdmin();
    let created = 0;
    const errors: Array<{ line: number; email: string; message: string }> = [];

    rows.forEach((row, index) => {
      const email = row.email.trim().toLowerCase();
      if (!email.includes('@')) {
        errors.push({ line: index + 1, email: row.email, message: 'Email inválido' });
        return;
      }
      mockStore.inviteMember(email, row.displayName);
      created += 1;
    });

    return { created, errors };
  },

  getRound() {
    requireSession();
    const openRound = findOpenRound(state);
    if (!openRound) {
      return { round: null, slots: MOCK_REGIONAL_SLOTS, memberTimezone: state.profile.timezone };
    }
    return this.getRoundById(openRound.id);
  },

  listOpenRoundsForMember() {
    requireSession();
    const userId = resolveSessionUserId(state.session!.email);
    return listOpenRounds(state).map((round) => {
      const template = mockTemplateFor(round);
      const row = round.declarations.find((item) => item.userId === userId);
      const responseStatus = !row ? ('none' as const) : row.response;
      return {
        id: round.id,
        status: round.status,
        theme: round.theme,
        questions: [...round.questions],
        createdAt: round.createdAt,
        templateName: template.name,
        circleSize: template.circleSize,
        durationMinutes: template.durationMinutes,
        responseStatus,
        declared: responseStatus === 'attending',
      };
    });
  },

  getRoundById(roundId: string, timezone?: string) {
    requireSession();
    const round = findRound(state, roundId);
    if (!round || round.status !== 'open') {
      throw new Error('round not open');
    }
    const template = mockTemplateFor(round);
    return {
      round: {
        id: round.id,
        status: round.status,
        theme: round.theme,
        questions: [...round.questions],
        templateName: template.name,
        circleSize: template.circleSize,
        durationMinutes: template.durationMinutes,
      },
      slots: MOCK_REGIONAL_SLOTS,
      memberTimezone: timezone ?? state.profile.timezone,
    };
  },

  listGatherings() {
    requireFacilitator();
    return state.rounds
      .map((round) => mapMockGatheringSummary(round))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  getGathering(roundId: string) {
    requireFacilitator();
    const round = findRound(state, roundId);
    if (!round) throw new Error('not found');
    return {
      round: mapMockGatheringDetail(round),
    };
  },

  getCurrentOpenRound() {
    requireFacilitator();
    const openRound = findOpenRound(state);
    if (!openRound) return { round: null, declarationCount: 0 };
    return {
      round: {
        id: openRound.id,
        status: openRound.status,
        theme: openRound.theme,
        questions: [...openRound.questions],
        slotLabels: SLOT_LABELS,
      },
      declarationCount: attendingDeclarationCount(openRound),
    };
  },

  getDeclaration(roundId: string) {
    requireSession();
    const round = findRound(state, roundId);
    if (!round || round.status !== 'open') {
      return { declaration: null };
    }
    const userId = resolveSessionUserId(state.session!.email);
    const row = round.declarations.find((item) => item.userId === userId);
    if (!row) {
      return { declaration: null };
    }
    return {
      declaration: {
        roundId,
        response: row.response,
        slots: [...row.slots],
        intention: row.response === 'declined' ? null : row.intention,
      },
    };
  },

  saveDeclaration(
    roundId: string,
    input:
      | {
          response: 'declined';
        }
      | {
          response?: 'attending';
          slots: string[];
          intention: 'surprise' | 'frontier' | 'ease';
        },
  ) {
    requireSession();
    const round = findRound(state, roundId);
    if (!round || round.status !== 'open') {
      throw new Error('round not open');
    }

    const session = state.session!;
    const userId = resolveSessionUserId(session.email);
    const populationUser = MOCK_USER_BY_ID.get(userId);
    if (input.response === 'declined') {
      const row: MockDeclarationRow = {
        userId,
        memberLabel: populationUser?.memberLabel ?? state.profile.displayName,
        emailMasked: maskEmail(session.email),
        slots: [],
        intention: 'declined',
        languages: [...state.profile.languages],
        timezone: state.profile.timezone,
        response: 'declined',
      };
      const existingIndex = round.declarations.findIndex((item) => item.userId === userId);
      if (existingIndex >= 0) {
        round.declarations[existingIndex] = row;
      } else {
        round.declarations.push(row);
      }
      persist();
      return { roundId, response: 'declined' as const, slots: [] as string[], intention: null };
    }

    state.declaration = { slots: [...input.slots], intention: input.intention };
    const row: MockDeclarationRow = {
      userId,
      memberLabel: populationUser?.memberLabel ?? state.profile.displayName,
      emailMasked: maskEmail(session.email),
      slots: [...input.slots],
      intention: input.intention,
      languages: [...state.profile.languages],
      timezone: state.profile.timezone,
      response: 'attending',
    };
    const existingIndex = round.declarations.findIndex((item) => item.userId === userId);
    if (existingIndex >= 0) {
      round.declarations[existingIndex] = row;
    } else {
      round.declarations.push(row);
    }

    persist();
    return {
      roundId,
      response: 'attending' as const,
      slots: [...input.slots],
      intention: input.intention,
    };
  },

  listCircles() {
    requireSession();
    return state.circles.map(({ members: _members, ...circle }) => circle);
  },

  getCircle(id: string) {
    requireSession();
    const circle = state.circles.find((item) => item.id === id);
    if (!circle) throw new Error('circle not found');
    return {
      circle: {
        id: circle.id,
        status: circle.status,
        question: circle.question,
        communityName: circle.communityName,
        scheduledSlot: circle.scheduledSlot,
        scheduledAt: circle.scheduledAt,
        jitsiUrl: circle.jitsiUrl,
        durationMinutes: circle.durationMinutes,
        canRecordAttendance: circle.canRecordAttendance,
        myStatus: circle.myStatus,
        myAttendance: circle.myAttendance,
      },
      members: circle.members.map((member) => ({ ...member })),
    };
  },

  confirmCircle(id: string) {
    requireSession();
    const circle = state.circles.find((item) => item.id === id);
    if (!circle) throw new Error('circle not found');
    circle.myStatus = 'confirmed';
    circle.members = circle.members.map((member) =>
      member.userId === 'm-you' ? { ...member, status: 'confirmed' } : member,
    );
    persist();
  },

  recordAttendance(id: string, happened: boolean) {
    requireSession();
    const circle = state.circles.find((item) => item.id === id);
    if (!circle) throw new Error('circle not found');
    circle.myAttendance = happened ? 'yes' : 'no';
    circle.members = circle.members.map((member) =>
      member.userId === 'm-you'
        ? { ...member, attendance: happened ? 'yes' : 'no' }
        : member,
    );
    persist();
  },

  searchPlaces(text: string) {
    requireSession();
    const query = text.trim().toLowerCase();
    if (query.length < 2) return [];
    return MOCK_PLACES.filter(
      (place) =>
        place.label.toLowerCase().includes(query) ||
        place.city.toLowerCase().includes(query) ||
        place.country.toLowerCase().includes(query),
    );
  },

  listTemplates() {
    requireFacilitator();
    return state.templates.map((template) => ({ ...template }));
  },

  createTemplate(input: Omit<MockTemplate, 'id'>) {
    requireFacilitator();
    const template = { id: `tpl-${Date.now()}`, ...input };
    state.templates.push(template);
    persist();
    return { template };
  },

  updateTemplate(id: string, input: Omit<MockTemplate, 'id'>) {
    requireFacilitator();
    const index = state.templates.findIndex((template) => template.id === id);
    if (index < 0) throw new Error('template not found');
    state.templates[index] = { id, ...input };
    persist();
    return { template: state.templates[index] };
  },

  createRound(input: {
    templateId: string;
    theme: string;
    questions: string[];
    slots: unknown[];
  }) {
    requireFacilitator();
    const roundId = `mock-round-${Date.now()}`;
    state.rounds.unshift({
      id: roundId,
      status: 'open',
      theme: input.theme,
      questions: [...input.questions],
      createdAt: new Date().toISOString(),
      templateId: input.templateId,
      circleCount: 0,
      declarations: [],
      autoMatchDraft: null,
      lastUnmatchedMembers: [],
      publishedCircleIds: [],
    });
    state.declaration = null;
    persist();
    return {
      round: {
        id: roundId,
        status: 'open',
        theme: input.theme,
        questions: input.questions,
        slots: input.slots,
      },
    };
  },

  listDeclarations(roundId: string) {
    requireFacilitator();
    const round = findRound(state, roundId);
    if (!round) return { items: [] as MockDeclarationRow[] };
    return { items: round.declarations.map((item) => ({ ...item })) };
  },

  runMatch(roundId: string) {
    requireFacilitator();
    const round = findRound(state, roundId);
    if (!round || round.status !== 'closed') throw new Error('round not found');
    const numericSeed = roundId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const draft = buildMatchDraftFromDeclarations(
      asPopulationDeclarations(round.declarations),
      round.templateId,
      numericSeed,
    );
    const groups = cloneMatchGroups(draft.trios);
    return {
      groups,
      trios: groups,
      unmatched: draft.unmatchedCount,
      unmatchedMembers: draft.unmatchedMembers.map((item) => ({
        userId: item.userId,
        reasons: [...item.reasons],
      })),
    };
  },

  updateGathering(
    roundId: string,
    input: { theme: string; questions: string[]; slots: unknown[] },
  ) {
    requireFacilitator();
    const round = findRound(state, roundId);
    if (!round || round.status !== 'open') throw new Error('round not found');
    round.theme = input.theme;
    round.questions = [...input.questions];
    persist();
    return { round: mapMockGatheringDetail(round) };
  },

  closeGathering(roundId: string) {
    requireFacilitator();
    const round = findRound(state, roundId);
    if (!round || round.status !== 'open') throw new Error('round not found');
    round.status = 'closed';
    persist();
    return { round: mapMockGatheringDetail(round) };
  },

  reopenGathering(roundId: string) {
    requireFacilitator();
    const round = findRound(state, roundId);
    if (!round || round.status !== 'closed') throw new Error('round not found');
    round.status = 'open';
    round.autoMatchDraft = null;
    persist();
    return { round: mapMockGatheringDetail(round) };
  },

  runAutoMatch(roundId: string) {
    requireFacilitator();
    const round = findRound(state, roundId);
    if (!round || round.status !== 'closed') throw new Error('round not found');
    const numericSeed = roundId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const draft = buildMatchDraftFromDeclarations(
      asPopulationDeclarations(round.declarations),
      round.templateId,
      numericSeed,
    );
    round.autoMatchDraft = {
      trios: cloneMatchGroups(draft.trios),
      unmatchedMembers: draft.unmatchedMembers.map((item) => ({
        userId: item.userId,
        reasons: [...item.reasons],
      })),
    };
    persist();
    return {
      groups: cloneMatchGroups(draft.trios),
      trios: cloneMatchGroups(draft.trios),
      unmatched: draft.unmatchedCount,
      unmatchedMembers: round.autoMatchDraft.unmatchedMembers,
      auditEventId: 'mock-audit',
      draftCreatedAt: new Date().toISOString(),
    };
  },

  getAutoMatchDraft(roundId: string) {
    requireFacilitator();
    const round = findRound(state, roundId);
    if (!round?.autoMatchDraft) return { draft: null };
    return {
      draft: {
        groups: round.autoMatchDraft.trios,
        trios: round.autoMatchDraft.trios,
        unmatched: round.autoMatchDraft.unmatchedMembers.length,
        unmatchedMembers: round.autoMatchDraft.unmatchedMembers,
        triggeredBy: 'mock-facilitator',
        createdAt: new Date().toISOString(),
      },
    };
  },

  undoAutoMatch(roundId: string) {
    requireFacilitator();
    const round = findRound(state, roundId);
    if (!round) throw new Error('round not found');
    const removed = Boolean(round.autoMatchDraft);
    round.autoMatchDraft = null;
    persist();
    return { removed };
  },

  publish(roundId: string, input?: { groups?: MockTrio[] }) {
    requireFacilitator();
    const round = findRound(state, roundId);
    if (!round || round.status !== 'closed') throw new Error('round not found');
    const numericSeed = roundId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const fallbackDraft = buildMatchDraftFromDeclarations(
      asPopulationDeclarations(round.declarations),
      round.templateId,
      numericSeed,
    );
    const groups = input?.groups?.length
      ? normalizePublishGroups(input.groups)
      : round.autoMatchDraft?.trios ?? fallbackDraft.trios;
    const unmatchedMembers =
      round.autoMatchDraft?.unmatchedMembers ?? fallbackDraft.unmatchedMembers;

    if (round.publishedCircleIds.length > 0) {
      state.circles = state.circles.filter((circle) => !round.publishedCircleIds.includes(circle.id));
    }

    const sessionUserId = state.session ? resolveSessionUserId(state.session.email) : null;
    const createdCircles = groups.map((group, index) =>
      buildMockCircleFromGroup(round, group, index, sessionUserId),
    );

    state.circles.push(...createdCircles);
    round.status = 'published';
    round.circleCount = groups.length;
    round.publishedCircleIds = createdCircles.map((circle) => circle.id);
    round.lastUnmatchedMembers = unmatchedMembers.map((item) => ({
      userId: item.userId,
      reasons: [...item.reasons],
    }));
    round.autoMatchDraft = null;
    persist();

    const template = mockTemplateFor(round);
    return {
      roundId,
      status: 'published' as const,
      circles: createdCircles.map((circle) => ({
        id: circle.id,
        status: circle.status,
        scheduledSlot: circle.scheduledSlot,
        jitsiUrl: circle.jitsiUrl,
        scheduledAt: circle.scheduledAt,
      })),
      emails: {
        sent: groups.length * template.circleSize,
        failed: [] as Array<{ circleId: string; userId: string; email: string; error: string }>,
      },
    };
  },

  exportUnmatchedCsv(roundId: string, locale: 'pt' | 'en') {
    requireFacilitator();
    const round = findRound(state, roundId);
    if (!round) throw new Error('round not found');

    const unmatchedMembers =
      round.autoMatchDraft?.unmatchedMembers ??
      round.lastUnmatchedMembers ??
      buildMatchDraftFromDeclarations(
        asPopulationDeclarations(round.declarations),
        round.templateId,
        roundId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0),
      ).unmatchedMembers;

    const header = locale === 'en' ? 'member_id,name,reasons' : 'membro_id,nome,motivos';
    const rows = unmatchedMembers.map((row) => {
      const reasons = row.reasons
        .map((reason) => UNMATCHED_CSV_LABELS[reason][locale])
        .join(' | ');
      const name = memberLabel(row.userId);
      return `${row.userId},"${name.replace(/"/g, '""')}","${reasons.replace(/"/g, '""')}"`;
    });

    return [header, ...rows].join('\n');
  },

  retryPublishEmails(roundId: string) {
    requireFacilitator();
    const round = findRound(state, roundId);
    if (!round) throw new Error('round not found');
    return { sent: 0, failed: [] as Array<{ circleId: string; userId: string; email: string; error: string }> };
  },

  getRoundMetrics(roundId: string) {
    requireFacilitator();
    const round = findRound(state, roundId);
    if (!round) throw new Error('not found');

    const matchedCount = round.publishedCircleIds.length * mockTemplateFor(round).circleSize;
    const invited = attendingDeclarationCount(round);
    const unmatched = round.lastUnmatchedMembers.length;
    const responded = round.status === 'published' ? invited : 0;
    const yes = round.status === 'published' ? Math.max(0, matchedCount) : 0;
    const no = round.status === 'published' ? Math.max(0, responded - yes - unmatched) : 0;
    const languages = [...new Set(round.declarations.flatMap((item) => item.languages))].slice(0, 6);
    const editionYears = [
      ...new Set(
        round.declarations
          .map((item) => MOCK_USER_BY_ID.get(item.userId)?.editionYear)
          .filter((year): year is number => typeof year === 'number'),
      ),
    ].slice(0, 5);

    const metrics = {
      newPairs: round.status === 'published' ? matchedCount : 0,
      noShow: {
        invited,
        responded,
        yes,
        no,
        rate: round.status === 'published' && responded > 0 ? no / responded : null,
      },
      diversity: {
        editionYears: editionYears.length ? editionYears : [2019, 2021, 2023],
        languages: languages.length ? languages : ['pt', 'en'],
        countries: ['Brazil', 'Portugal', 'Germany', 'United States', 'Japan'],
      },
      exceptions: {
        unmatched: round.status === 'published' ? unmatched : 0,
      },
    };

    const sortedRounds = [...state.rounds].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const roundIndex = sortedRounds.findIndex((item) => item.id === roundId);
    const previousRound = roundIndex >= 0 ? sortedRounds[roundIndex + 1] : null;
    const previousMatched =
      previousRound && previousRound.status === 'published'
        ? previousRound.circleCount * mockTemplateFor(previousRound).circleSize
        : 0;

    return {
      roundId,
      metrics,
      previous: previousRound
        ? {
            roundId: previousRound.id,
            metrics: {
              ...metrics,
              newPairs: previousMatched,
              noShow: {
                ...metrics.noShow,
                rate:
                  previousRound.status === 'published' && metrics.noShow.responded > 0
                    ? metrics.noShow.no / metrics.noShow.responded
                    : null,
              },
            },
            delta: {
              newPairs: metrics.newPairs - previousMatched,
              noShowRate:
                metrics.noShow.rate !== null && previousRound.status === 'published'
                  ? metrics.noShow.rate - (metrics.noShow.no / Math.max(metrics.noShow.responded, 1))
                  : null,
            },
          }
        : null,
    };
  },
};
