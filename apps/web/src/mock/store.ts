import type { PlaceRef } from '../lib/place.js';
import {
  isFacilitatorDemoEmail,
  isNewMemberDemoEmail,
  isOrgAdminDemoEmail,
} from '../lib/mock-mode.js';
import {
  DEFAULT_COMMUNITY_PUBLIC_SETTINGS,
  mergeCommunityPublicSettings,
  type CommunityBrandingInput,
  type CommunityPublicSettings,
} from '@ember/domain/schemas/community-branding';
import {
  MOCK_COMMUNITY_NAME,
  MOCK_DECLARATIONS,
  MOCK_PLACES,
  MOCK_QUESTIONS,
  MOCK_REGIONAL_SLOTS,
  MOCK_ROUND_ID,
  MOCK_TEMPLATES,
  MOCK_THEMES,
  MOCK_TRIOS,
  MOCK_UNMATCHED_COUNT,
} from './data.js';

const STORAGE_KEY = 'ember-mock-v3';

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
  intention: string;
  languages: string[];
  timezone: string | null;
};

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
    declarationCount: round.declarations.length,
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

function seedDeclarations(): MockDeclarationRow[] {
  return MOCK_DECLARATIONS.map((item) => ({ ...item }));
}

function seedRounds(): MockRound[] {
  return [
    {
      id: MOCK_ROUND_ID,
      status: 'open',
      theme: MOCK_THEMES.open,
      questions: [...MOCK_QUESTIONS.open],
      createdAt: '2026-08-19T18:00:00.000Z',
      templateId: 'tpl-council',
      circleCount: 0,
      declarations: seedDeclarations(),
    },
    {
      id: 'mock-round-published',
      status: 'published',
      theme: MOCK_THEMES.published,
      questions: [...MOCK_QUESTIONS.published],
      createdAt: '2026-08-05T18:00:00.000Z',
      templateId: 'tpl-council',
      circleCount: 3,
      declarations: MOCK_DECLARATIONS.slice(0, 7).map((item) => ({ ...item })),
    },
    {
      id: 'mock-round-closed',
      status: 'closed',
      theme: MOCK_THEMES.closedCulture,
      questions: [...MOCK_QUESTIONS.closedCulture],
      createdAt: '2026-07-20T18:00:00.000Z',
      templateId: 'tpl-cafe',
      circleCount: 0,
      declarations: MOCK_DECLARATIONS.slice(2, 8).map((item) => ({ ...item })),
    },
    {
      id: 'mock-round-closed-2',
      status: 'closed',
      theme: MOCK_THEMES.closedRoots,
      questions: [...MOCK_QUESTIONS.closedRoots],
      createdAt: '2026-06-28T18:00:00.000Z',
      templateId: 'tpl-walk',
      circleCount: 1,
      declarations: MOCK_DECLARATIONS.slice(0, 5).map((item) => ({ ...item })),
    },
    {
      id: 'mock-round-archived',
      status: 'published',
      theme: MOCK_THEMES.archived,
      questions: [...MOCK_QUESTIONS.archived],
      createdAt: '2026-05-15T18:00:00.000Z',
      templateId: 'tpl-council',
      circleCount: 2,
      declarations: MOCK_DECLARATIONS.slice(4, 10).map((item) => ({ ...item })),
    },
  ];
}

function findOpenRound(state: PersistedState): MockRound | null {
  return state.rounds.find((round) => round.status === 'open') ?? null;
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
  const localPart = email?.split('@')[0]?.replace(/[._-]/g, ' ') ?? 'Alex Demo';
  const displayName = localPart.charAt(0).toUpperCase() + localPart.slice(1);
  const incomplete = email ? isNewMemberDemoEmail(email) : false;

  return {
    displayName: incomplete ? '' : displayName,
    editionYear: incomplete ? null : 2024,
    timezone: 'America/Sao_Paulo',
    languages: incomplete ? [] : ['pt', 'en'],
    originPlace: incomplete ? null : (MOCK_PLACES[0] ?? null),
    residencePlace: incomplete ? null : (MOCK_PLACES[2] ?? null),
    isFacilitator: email ? isFacilitatorDemoEmail(email) : false,
    isOrgAdmin: email ? isOrgAdminDemoEmail(email) : false,
  };
}

function defaultMembers(): MockMemberRecord[] {
  return [
    {
      userId: 'm-demo',
      email: 'demo@ember.app',
      role: 'member',
      invitedAt: '2026-08-01T10:00:00.000Z',
      profileComplete: true,
      displayName: 'Alex Demo',
    },
    {
      userId: 'm-facil',
      email: 'facilitador@demo.ember',
      role: 'facilitator',
      invitedAt: '2026-08-01T10:00:00.000Z',
      profileComplete: true,
      displayName: 'Facilitador Demo',
    },
  ];
}

function defaultCircles(): MockCircle[] {
  const q1 = MOCK_QUESTIONS.open[0]!;
  const q2 = MOCK_QUESTIONS.published[0]!;
  const q3 = MOCK_QUESTIONS.closedRoots[0]!;

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
        { userId: 'u-marina', label: 'Marina Silva · Marina S.', status: 'confirmed', attendance: null },
        { userId: 'u-jonas', label: 'Jonas Keller · Jonas K.', status: 'confirmed', attendance: null },
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
        { userId: 'u-sofia', label: 'Sofia Martins · Sofia M.', status: 'confirmed', attendance: null },
        { userId: 'u-alex', label: 'Alex Chen · Alex C.', status: 'confirmed', attendance: null },
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
        { userId: 'u-priya', label: 'Priya Mehta · Priya M.', status: 'confirmed', attendance: null },
        { userId: 'u-lucas', label: 'Lucas Almeida · Lucas A.', status: 'confirmed', attendance: null },
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
        { userId: 'u-elena', label: 'Elena Rossi · Elena R.', status: 'confirmed', attendance: 'yes' },
        { userId: 'u-noah', label: 'Noah Williams · Noah W.', status: 'confirmed', attendance: 'yes' },
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
      rounds: parsed.rounds?.length ? parsed.rounds : seedRounds(),
      publicSettings: mergeCommunityPublicSettings(parsed.publicSettings),
      members: parsed.members?.length ? parsed.members : defaultMembers(),
    };
  } catch {
    return createDefaultState();
  }
}

let state = readState();

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

function requireOrgAdmin() {
  requireSession();
  if (!state.profile.isOrgAdmin) {
    throw new Error('forbidden');
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

  login(email: string) {
    const normalized = email.trim().toLowerCase();
    const isFacilitator = isFacilitatorDemoEmail(normalized);
    const isOrgAdmin = isOrgAdminDemoEmail(normalized);
    state.session = { email: normalized, isFacilitator };
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
      isFacilitator: state.session?.isFacilitator ?? false,
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
    return {
      round: {
        id: openRound.id,
        status: openRound.status,
        theme: openRound.theme,
        questions: [...openRound.questions],
      },
      slots: MOCK_REGIONAL_SLOTS,
      memberTimezone: state.profile.timezone,
    };
  },

  listGatherings() {
    requireSession();
    if (!state.session?.isFacilitator) throw new Error('forbidden');
    return state.rounds
      .map((round) => mapMockGatheringSummary(round))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  getGathering(roundId: string) {
    requireSession();
    if (!state.session?.isFacilitator) throw new Error('forbidden');
    const round = findRound(state, roundId);
    if (!round) throw new Error('not found');
    return {
      round: mapMockGatheringDetail(round),
    };
  },

  getCurrentOpenRound() {
    requireSession();
    if (!state.session?.isFacilitator) throw new Error('forbidden');
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
      declarationCount: openRound.declarations.length,
    };
  },

  getDeclaration(roundId: string) {
    requireSession();
    const openRound = findOpenRound(state);
    if (!openRound || roundId !== openRound.id || !state.declaration) {
      return { declaration: null };
    }
    return {
      declaration: {
        roundId,
        slots: [...state.declaration.slots],
        intention: state.declaration.intention,
      },
    };
  },

  saveDeclaration(
    roundId: string,
    input: { slots: string[]; intention: 'surprise' | 'frontier' | 'ease' },
  ) {
    requireSession();
    const openRound = findOpenRound(state);
    if (!openRound || roundId !== openRound.id) {
      throw new Error('round not open');
    }
    state.declaration = { slots: [...input.slots], intention: input.intention };

    const session = state.session!;
    const userId = `user-${session.email}`;
    const row: MockDeclarationRow = {
      userId,
      memberLabel: state.profile.displayName,
      emailMasked: maskEmail(session.email),
      slots: [...input.slots],
      intention: input.intention,
      languages: [...state.profile.languages],
      timezone: state.profile.timezone,
    };
    const existingIndex = openRound.declarations.findIndex((item) => item.userId === userId);
    if (existingIndex >= 0) {
      openRound.declarations[existingIndex] = row;
    } else {
      openRound.declarations.push(row);
    }

    persist();
    return {
      roundId,
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
    requireSession();
    if (!state.session?.isFacilitator) {
      throw new Error('forbidden');
    }
    return state.templates.map((template) => ({ ...template }));
  },

  createTemplate(input: Omit<MockTemplate, 'id'>) {
    requireSession();
    if (!state.session?.isFacilitator) throw new Error('forbidden');
    const template = { id: `tpl-${Date.now()}`, ...input };
    state.templates.push(template);
    persist();
    return { template };
  },

  updateTemplate(id: string, input: Omit<MockTemplate, 'id'>) {
    requireSession();
    if (!state.session?.isFacilitator) throw new Error('forbidden');
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
    requireSession();
    if (!state.session?.isFacilitator) throw new Error('forbidden');
    const roundId = `mock-round-${Date.now()}`;
    for (const round of state.rounds) {
      if (round.status === 'open') round.status = 'closed';
    }
    state.rounds.unshift({
      id: roundId,
      status: 'open',
      theme: input.theme,
      questions: [...input.questions],
      createdAt: new Date().toISOString(),
      templateId: input.templateId,
      circleCount: 0,
      declarations: [],
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
    requireSession();
    if (!state.session?.isFacilitator) throw new Error('forbidden');
    const round = findRound(state, roundId);
    if (!round) return { items: [] as MockDeclarationRow[] };
    return { items: round.declarations.map((item) => ({ ...item })) };
  },

  runMatch(roundId: string) {
    requireSession();
    if (!state.session?.isFacilitator) throw new Error('forbidden');
    const round = findRound(state, roundId);
    if (!round || round.status !== 'open') throw new Error('round not found');
    return {
      trios: MOCK_TRIOS.map((trio) => ({ ...trio, memberIds: [...trio.memberIds] as [string, string, string] })),
      unmatched: MOCK_UNMATCHED_COUNT,
    };
  },

  publish(roundId: string) {
    requireSession();
    if (!state.session?.isFacilitator) throw new Error('forbidden');
    const round = findRound(state, roundId);
    if (!round || round.status !== 'open') throw new Error('round not found');
    round.status = 'published';
    round.circleCount = 3;
    persist();
    return { published: true };
  },
};
