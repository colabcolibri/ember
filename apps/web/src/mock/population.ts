import { mockBilingual, MOCK_REGIONAL_SLOTS, MOCK_TEMPLATES } from './data.js';

export type MockPopulationUser = {
  userId: string;
  email: string;
  displayName: string;
  memberLabel: string;
  emailMasked: string;
  timezone: string;
  languages: string[];
  editionYear: number;
  originPlaceIndex: number;
  residencePlaceIndex: number;
  profileComplete: boolean;
};

export type MockPopulationDeclaration = {
  userId: string;
  memberLabel: string;
  emailMasked: string;
  slots: string[];
  intention: 'surprise' | 'frontier' | 'ease';
  languages: string[];
  timezone: string;
  response: 'attending';
};

export type MockRoundSeed = {
  id: string;
  status: 'open' | 'closed' | 'published';
  theme: string;
  questions: string[];
  createdAt: string;
  templateId: string;
  participantCount: number;
  circleCount?: number;
  withAutoMatchDraft?: boolean;
};

const INTENTIONS = ['surprise', 'frontier', 'ease'] as const;

const TIMEZONES = [
  'America/Sao_Paulo',
  'America/New_York',
  'America/Los_Angeles',
  'America/Mexico_City',
  'Europe/Lisbon',
  'Europe/Berlin',
  'Europe/Paris',
  'Europe/Amsterdam',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Kolkata',
  'Australia/Sydney',
] as const;

const LANGUAGE_SETS = [
  ['pt'],
  ['en'],
  ['pt', 'en'],
  ['en', 'de'],
  ['pt', 'en', 'es'],
  ['en', 'fr'],
  ['en', 'it'],
  ['pt', 'fr'],
  ['en', 'ja'],
  ['en', 'ar'],
] as const;

const FIRST_NAMES = [
  'Marina',
  'Jonas',
  'Priya',
  'Lucas',
  'Sofia',
  'Alex',
  'Elena',
  'Noah',
  'Camila',
  'Omar',
  'Kenji',
  'Amira',
  'Beatriz',
  'Thomas',
  'Yuki',
  'Inês',
  'Marcus',
  'Leila',
  'Pedro',
  'Anna',
  'Diego',
  'Hana',
  'Rafael',
  'Clara',
  'Viktor',
  'Nadia',
  'Felipe',
  'Maya',
  'Henrik',
  'Zara',
  'Giulia',
  'Samuel',
  'Aisha',
  'Bruno',
  'Chloe',
  'Daniel',
  'Emma',
  'Fabio',
  'Grace',
  'Hugo',
];

const LAST_NAMES = [
  'Silva',
  'Keller',
  'Mehta',
  'Almeida',
  'Martins',
  'Chen',
  'Rossi',
  'Williams',
  'Ferreira',
  'Hassan',
  'Tanaka',
  'Farouk',
  'Santos',
  'Mueller',
  'Sato',
  'Costa',
  'Johnson',
  'Nour',
  'Oliveira',
  'Berg',
  'Morales',
  'Park',
  'Lima',
  'Dupont',
  'Novak',
  'Khan',
  'Ribeiro',
  'Patel',
  'Larsen',
  'Ahmed',
  'Romano',
  'Brooks',
  'Yilmaz',
  'Carvalho',
  'Dubois',
  'Fischer',
  'Nguyen',
  'Gomes',
  'Schmidt',
  'Ibrahim',
];

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  const visible = local.length <= 1 ? '*' : `${local[0]}***`;
  return `${visible}@${domain}`;
}

function shortLabel(displayName: string): string {
  const parts = displayName.split(' ');
  const first = parts[0] ?? displayName;
  const lastInitial = parts[1]?.[0] ?? parts[0]?.[0] ?? '?';
  return `${first} ${lastInitial}.`;
}

function slotsForTimezone(timezone: string, rng: () => number): string[] {
  const refs = MOCK_REGIONAL_SLOTS.map((slot) => slot.ref);
  if (timezone.startsWith('America/')) {
    return [refs[0]!, refs[1]!, refs[rng() > 0.6 ? 4 : 1]!].filter(
      (value, index, array) => array.indexOf(value) === index,
    );
  }
  if (timezone.startsWith('Europe/')) {
    return rng() > 0.5 ? [refs[2]!, refs[3]!] : [refs[3]!];
  }
  if (timezone.startsWith('Asia/') || timezone.startsWith('Australia/')) {
    return [refs[4]!, refs[rng() > 0.5 ? 3 : 2]!];
  }
  return [refs[Math.floor(rng() * refs.length)]!];
}

function buildUser(index: number): MockPopulationUser {
  const n = index + 1;
  const padded = String(n).padStart(3, '0');
  const firstName = FIRST_NAMES[index % FIRST_NAMES.length]!;
  const lastName = LAST_NAMES[(index * 7 + 3) % LAST_NAMES.length]!;
  const displayName = `${firstName} ${lastName}`;
  const email =
    n === 1
      ? 'demo@ember.app'
      : n === 2
        ? 'facilitador@demo.ember'
        : n === 3
          ? 'admin@demo.ember'
          : `member${padded}@ember.community`;

  return {
    userId: `u-${padded}`,
    email,
    displayName,
    memberLabel: `${displayName} · ${shortLabel(displayName)}`,
    emailMasked: maskEmail(email),
    timezone: TIMEZONES[index % TIMEZONES.length]!,
    languages: [...LANGUAGE_SETS[index % LANGUAGE_SETS.length]!],
    editionYear: 2015 + (index % 10),
    originPlaceIndex: index % 6,
    residencePlaceIndex: (index + 2) % 6,
    profileComplete: index % 17 !== 0,
  };
}

export const MOCK_USERS: MockPopulationUser[] = Array.from({ length: 100 }, (_, index) =>
  buildUser(index),
);

export const MOCK_USER_BY_ID = new Map(MOCK_USERS.map((user) => [user.userId, user]));

export function buildPopulationMemberRecords() {
  return MOCK_USERS.map((user, index) => ({
    userId: user.userId,
    email: user.email,
    role: index === 1 || index === 2 ? 'facilitator' : 'member',
    invitedAt: `2025-${String((index % 12) + 1).padStart(2, '0')}-15T10:00:00.000Z`,
    profileComplete: user.profileComplete,
    displayName: user.displayName,
  }));
}

export const MOCK_ROUND_SEEDS: MockRoundSeed[] = [
  {
    id: 'mock-round-open',
    status: 'open',
    theme: mockBilingual('Pontes entre gerações', 'Bridges across generations'),
    questions: [
      mockBilingual(
        'O que você herdou — e o que escolheu deixar para trás?',
        'What did you inherit — and what did you choose to leave behind?',
      ),
      mockBilingual(
        'Quem te ensinou a escutar de verdade?',
        'Who taught you to listen for real?',
      ),
      mockBilingual(
        'Que ponte você gostaria de construir nesta rodada?',
        'What bridge would you like to build in this round?',
      ),
    ],
    createdAt: '2026-08-19T18:00:00.000Z',
    templateId: 'tpl-council',
    participantCount: 52,
  },
  {
    id: 'mock-round-open-2',
    status: 'open',
    theme: mockBilingual('Escuta em movimento', 'Listening in motion'),
    questions: [
      mockBilingual(
        'O que muda no seu corpo quando alguém te escuta de verdade?',
        'What shifts in your body when someone truly listens to you?',
      ),
      mockBilingual(
        'Que ritmo você traz para este encontro?',
        'What rhythm do you bring to this gathering?',
      ),
    ],
    createdAt: '2026-08-22T14:00:00.000Z',
    templateId: 'tpl-cafe',
    participantCount: 31,
  },
  {
    id: 'mock-round-published-01',
    status: 'published',
    theme: mockBilingual('Escuta e pertencimento', 'Listening and belonging'),
    questions: [
      mockBilingual(
        'Quando foi a última vez que você se sentiu verdadeiramente ouvido?',
        'When was the last time you felt truly heard?',
      ),
      mockBilingual(
        'O que muda quando alguém segura o silêncio com você?',
        'What shifts when someone holds silence with you?',
      ),
    ],
    createdAt: '2026-08-05T18:00:00.000Z',
    templateId: 'tpl-council',
    participantCount: 78,
    circleCount: 26,
  },
  {
    id: 'mock-round-published-02',
    status: 'published',
    theme: mockBilingual('Surpresas na rede', 'Surprises in the network'),
    questions: [
      mockBilingual(
        'O que te surpreendeu em alguém de outro lugar ou geração?',
        'What surprised you about someone from another place or generation?',
      ),
    ],
    createdAt: '2026-07-28T18:00:00.000Z',
    templateId: 'tpl-cafe',
    participantCount: 64,
    circleCount: 16,
  },
  {
    id: 'mock-round-closed-01',
    status: 'closed',
    theme: mockBilingual('Raízes e partidas', 'Roots and departures'),
    questions: [
      mockBilingual(
        'De onde você veio — e o que carrega com você hoje?',
        'Where did you come from — and what do you carry with you today?',
      ),
      mockBilingual(
        'Que parte da sua história você raramente conta?',
        'What part of your story do you rarely tell?',
      ),
    ],
    createdAt: '2026-07-12T18:00:00.000Z',
    templateId: 'tpl-walk',
    participantCount: 45,
    withAutoMatchDraft: true,
  },
  {
    id: 'mock-round-published-03',
    status: 'published',
    theme: mockBilingual('Presença compartilhada', 'Shared presence'),
    questions: [
      mockBilingual(
        'O que você precisava ouvir neste encontro?',
        'What did you need to hear in this gathering?',
      ),
    ],
    createdAt: '2026-06-25T18:00:00.000Z',
    templateId: 'tpl-council',
    participantCount: 88,
    circleCount: 29,
  },
  {
    id: 'mock-round-published-04',
    status: 'published',
    theme: mockBilingual('Fronteiras suaves', 'Soft frontiers'),
    questions: [
      mockBilingual(
        'Onde você sente fronteira — e onde sente ponte?',
        'Where do you feel a frontier — and where a bridge?',
      ),
      mockBilingual(
        'O que você evita dizer — e por quê?',
        'What do you avoid saying — and why?',
      ),
    ],
    createdAt: '2026-06-08T18:00:00.000Z',
    templateId: 'tpl-cafe',
    participantCount: 71,
    circleCount: 17,
  },
  {
    id: 'mock-round-closed-02',
    status: 'closed',
    theme: mockBilingual('Corpos da escuta', 'Bodies of listening'),
    questions: [
      mockBilingual(
        'Como sua escuta muda quando você está cansado?',
        'How does your listening change when you are tired?',
      ),
    ],
    createdAt: '2026-05-22T18:00:00.000Z',
    templateId: 'tpl-walk',
    participantCount: 38,
    withAutoMatchDraft: true,
  },
  {
    id: 'mock-round-published-05',
    status: 'published',
    theme: mockBilingual('Memória viva', 'Living memory'),
    questions: [
      mockBilingual(
        'Que memória você gostaria que alguém guardasse por você?',
        'What memory would you like someone to hold for you?',
      ),
    ],
    createdAt: '2026-05-05T18:00:00.000Z',
    templateId: 'tpl-council',
    participantCount: 59,
    circleCount: 19,
  },
  {
    id: 'mock-round-published-06',
    status: 'published',
    theme: mockBilingual('Encontros improváveis', 'Unlikely encounters'),
    questions: [
      mockBilingual(
        'Com quem você nunca imaginou conversar — e o que aprendeu?',
        'Who did you never imagine talking to — and what did you learn?',
      ),
    ],
    createdAt: '2026-04-18T18:00:00.000Z',
    templateId: 'tpl-cafe',
    participantCount: 83,
    circleCount: 20,
  },
  {
    id: 'mock-round-closed-03',
    status: 'closed',
    theme: mockBilingual('Silêncio produtivo', 'Productive silence'),
    questions: [
      mockBilingual(
        'Quando o silêncio te acolhe — e quando te incomoda?',
        'When does silence hold you — and when does it unsettle you?',
      ),
    ],
    createdAt: '2026-03-30T18:00:00.000Z',
    templateId: 'tpl-walk',
    participantCount: 42,
  },
  {
    id: 'mock-round-published-07',
    status: 'published',
    theme: mockBilingual('Primeira primavera', 'First spring'),
    questions: [
      mockBilingual(
        'O que está brotando em você nesta temporada?',
        'What is sprouting in you this season?',
      ),
    ],
    createdAt: '2026-03-10T18:00:00.000Z',
    templateId: 'tpl-council',
    participantCount: 67,
    circleCount: 22,
  },
];

function shuffledIndices(count: number, seed: number): number[] {
  const rng = mulberry32(seed);
  const indices = Array.from({ length: MOCK_USERS.length }, (_, index) => index);
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j]!, indices[i]!];
  }
  return indices.slice(0, Math.min(count, MOCK_USERS.length));
}

export function buildRoundDeclarations(seed: MockRoundSeed): MockPopulationDeclaration[] {
  const numericSeed = seed.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const indices = shuffledIndices(seed.participantCount, numericSeed);

  return indices.map((userIndex, position) => {
    const user = MOCK_USERS[userIndex]!;
    const rng = mulberry32(numericSeed + userIndex * 17 + position);
    const intention = INTENTIONS[(userIndex + position) % INTENTIONS.length]!;

    return {
      userId: user.userId,
      memberLabel: user.memberLabel,
      emailMasked: user.emailMasked,
      slots: slotsForTimezone(user.timezone, rng),
      intention,
      languages: [...user.languages],
      timezone: user.timezone,
      response: 'attending' as const,
    };
  });
}

export type MockTrio = {
  memberIds: [string, string, string] | [string, string, string, string];
  slot: string;
  score: number;
};

export type MockUnmatchedMember = {
  userId: string;
  reasons: readonly ('NO_COMMON_SLOT' | 'ODD_POOL' | 'INCOMPLETE_PROFILE')[];
};

export function buildMatchDraftFromDeclarations(
  declarations: MockPopulationDeclaration[],
  templateId: string,
  seed: number,
) {
  const template = MOCK_TEMPLATES.find((item) => item.id === templateId) ?? MOCK_TEMPLATES[0]!;
  const circleSize = template.circleSize;
  const rng = mulberry32(seed);
  const shuffled = [...declarations].sort(() => rng() - 0.5);
  const trios: MockTrio[] = [];
  const slotRefs = MOCK_REGIONAL_SLOTS.map((slot) => slot.ref);

  for (let i = 0; i + circleSize <= shuffled.length; i += circleSize) {
    const group = shuffled.slice(i, i + circleSize);
    const commonSlot =
      group
        .map((member) => member.slots)
        .reduce<string | null>((found, slots) => {
          if (found) return found;
          return slots.find((slot) => group.every((other) => other.slots.includes(slot))) ?? null;
        }, null) ?? group[0]!.slots[0]!;

    if (circleSize === 3) {
      trios.push({
        memberIds: [group[0]!.userId, group[1]!.userId, group[2]!.userId],
        slot: commonSlot ?? slotRefs[0]!,
        score: 0.62 + rng() * 0.35,
      });
    } else if (circleSize === 4) {
      trios.push({
        memberIds: [group[0]!.userId, group[1]!.userId, group[2]!.userId, group[3]!.userId],
        slot: commonSlot ?? slotRefs[0]!,
        score: 0.58 + rng() * 0.35,
      });
    }
  }

  const matchedIds = new Set(trios.flatMap((trio) => trio.memberIds));
  const unmatchedMembers: MockUnmatchedMember[] = shuffled
    .filter((member) => !matchedIds.has(member.userId))
    .slice(0, 8)
    .map((member, index) => ({
      userId: member.userId,
      reasons: [
        index % 3 === 0 ? 'NO_COMMON_SLOT' : index % 3 === 1 ? 'ODD_POOL' : 'INCOMPLETE_PROFILE',
      ] as MockUnmatchedMember['reasons'],
    }));

  return {
    trios,
    unmatchedMembers,
    unmatchedCount: unmatchedMembers.length,
  };
}
