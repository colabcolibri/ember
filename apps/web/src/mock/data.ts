import type { RegionalSlotOption } from '../components/app/RegionalSlotPicker.js';
import type { PlaceRef } from '../lib/place.js';

/** Bilingual copy helper — PT / EN in one string for mock fidelity. */
export function mockBilingual(pt: string, en: string): string {
  return `${pt} / ${en}`;
}

export const MOCK_COMMUNITY_NAME = mockBilingual('Comunidade Ember', 'Ember Community');

export const MOCK_ROUND_ID = 'mock-round-open';

export const MOCK_REGIONAL_SLOTS: RegionalSlotOption[] = [
  {
    ref: 'cal-americas:slot-mon-1900',
    calendarLabel: 'Américas / Americas',
    officialLabel: 'Seg 19:00 (BRT)',
    localLabel: 'Seg 19:00',
  },
  {
    ref: 'cal-americas:slot-wed-1900',
    calendarLabel: 'Américas / Americas',
    officialLabel: 'Qua 19:00 (BRT)',
    localLabel: 'Qua 19:00',
  },
  {
    ref: 'cal-europe:slot-sun-1300',
    calendarLabel: 'Europa / Europe',
    officialLabel: 'Dom 13:00 (CET)',
    localLabel: 'Dom 08:00',
  },
  {
    ref: 'cal-europe:slot-tue-2000',
    calendarLabel: 'Europa / Europe',
    officialLabel: 'Ter 20:00 (CET)',
    localLabel: 'Ter 15:00',
  },
  {
    ref: 'cal-asia:slot-sat-1000',
    calendarLabel: 'Ásia-Pacífico / Asia-Pacific',
    officialLabel: 'Sáb 10:00 (JST)',
    localLabel: 'Sáb 22:00',
  },
];

export const MOCK_PLACES: PlaceRef[] = [
  {
    provider: 'photon',
    placeId: 'R298019',
    city: 'São Paulo',
    adminArea: 'São Paulo',
    country: 'Brazil',
    countryCode: 'BR',
    latitude: -23.5505,
    longitude: -46.6333,
    label: 'São Paulo, São Paulo, Brazil',
  },
  {
    provider: 'photon',
    placeId: 'R2757728',
    city: 'Amsterdam',
    adminArea: 'North Holland',
    country: 'Netherlands',
    countryCode: 'NL',
    latitude: 52.3676,
    longitude: 4.9041,
    label: 'Amsterdam, North Holland, Netherlands',
  },
  {
    provider: 'photon',
    placeId: 'R175905',
    city: 'Lisbon',
    adminArea: 'Lisbon',
    country: 'Portugal',
    countryCode: 'PT',
    latitude: 38.7223,
    longitude: -9.1393,
    label: 'Lisbon, Lisbon, Portugal',
  },
  {
    provider: 'photon',
    placeId: 'R613860',
    city: 'Berlin',
    adminArea: 'Berlin',
    country: 'Germany',
    countryCode: 'DE',
    latitude: 52.52,
    longitude: 13.405,
    label: 'Berlin, Berlin, Germany',
  },
  {
    provider: 'photon',
    placeId: 'R5396193',
    city: 'San Francisco',
    adminArea: 'California',
    country: 'United States',
    countryCode: 'US',
    latitude: 37.7749,
    longitude: -122.4194,
    label: 'San Francisco, California, United States',
  },
  {
    provider: 'photon',
    placeId: 'R5466225',
    city: 'Tokyo',
    adminArea: 'Tokyo',
    country: 'Japan',
    countryCode: 'JP',
    latitude: 35.6762,
    longitude: 139.6503,
    label: 'Tokyo, Tokyo, Japan',
  },
];

export const MOCK_TEMPLATES = [
  {
    id: 'tpl-council',
    name: mockBilingual('Fogo de Conselho', 'Council Fire'),
    circleSize: 3,
    durationMinutes: 60,
  },
  {
    id: 'tpl-cafe',
    name: mockBilingual('Café com intenção', 'Intentional Café'),
    circleSize: 4,
    durationMinutes: 45,
  },
  {
    id: 'tpl-walk',
    name: mockBilingual('Caminhada compartilhada', 'Shared Walk'),
    circleSize: 3,
    durationMinutes: 30,
  },
];

export const MOCK_QUESTIONS = {
  open: [
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
  published: [
    mockBilingual(
      'Quando foi a última vez que você se sentiu verdadeiramente ouvido?',
      'When was the last time you felt truly heard?',
    ),
    mockBilingual(
      'O que muda quando alguém segura o silêncio com você?',
      'What shifts when someone holds silence with you?',
    ),
  ],
  closedCulture: [
    mockBilingual(
      'O que te surpreendeu em alguém de outro lugar ou geração?',
      'What surprised you about someone from another place or generation?',
    ),
  ],
  closedRoots: [
    mockBilingual(
      'De onde você veio — e o que carrega com você hoje?',
      'Where did you come from — and what do you carry with you today?',
    ),
    mockBilingual(
      'Que parte da sua história você raramente conta?',
      'What part of your story do you rarely tell?',
    ),
  ],
  archived: [
    mockBilingual(
      'O que você precisava ouvir neste encontro?',
      'What did you need to hear in this gathering?',
    ),
  ],
};

export const MOCK_THEMES = {
  open: mockBilingual('Pontes entre gerações', 'Bridges across generations'),
  published: mockBilingual('Escuta e pertencimento', 'Listening and belonging'),
  closedCulture: mockBilingual('Surpresas na rede', 'Surprises in the network'),
  closedRoots: mockBilingual('Raízes e partidas', 'Roots and departures'),
  archived: mockBilingual('Presença compartilhada', 'Shared presence'),
};

export const MOCK_DECLARATIONS = [
  {
    userId: 'u-marina',
    memberLabel: 'Marina Silva · Marina S.',
    emailMasked: 'm***@ember.community',
    slots: ['cal-americas:slot-mon-1900', 'cal-americas:slot-wed-1900'],
    intention: 'surprise',
    languages: ['pt', 'en'],
    timezone: 'America/Sao_Paulo',
  },
  {
    userId: 'u-jonas',
    memberLabel: 'Jonas Keller · Jonas K.',
    emailMasked: 'j***@ember.community',
    slots: ['cal-europe:slot-sun-1300', 'cal-europe:slot-tue-2000'],
    intention: 'frontier',
    languages: ['en', 'de'],
    timezone: 'Europe/Berlin',
  },
  {
    userId: 'u-priya',
    memberLabel: 'Priya Mehta · Priya M.',
    emailMasked: 'p***@ember.community',
    slots: ['cal-americas:slot-wed-1900', 'cal-europe:slot-tue-2000'],
    intention: 'ease',
    languages: ['en'],
    timezone: 'America/New_York',
  },
  {
    userId: 'u-lucas',
    memberLabel: 'Lucas Almeida · Lucas A.',
    emailMasked: 'l***@ember.community',
    slots: ['cal-americas:slot-mon-1900'],
    intention: 'surprise',
    languages: ['pt'],
    timezone: 'America/Sao_Paulo',
  },
  {
    userId: 'u-sofia',
    memberLabel: 'Sofia Martins · Sofia M.',
    emailMasked: 's***@ember.community',
    slots: ['cal-europe:slot-sun-1300', 'cal-americas:slot-wed-1900'],
    intention: 'frontier',
    languages: ['pt', 'en', 'es'],
    timezone: 'Europe/Lisbon',
  },
  {
    userId: 'u-alex',
    memberLabel: 'Alex Chen · Alex C.',
    emailMasked: 'a***@ember.community',
    slots: ['cal-asia:slot-sat-1000', 'cal-europe:slot-tue-2000'],
    intention: 'ease',
    languages: ['en'],
    timezone: 'Asia/Tokyo',
  },
  {
    userId: 'u-elena',
    memberLabel: 'Elena Rossi · Elena R.',
    emailMasked: 'e***@ember.community',
    slots: ['cal-europe:slot-tue-2000'],
    intention: 'surprise',
    languages: ['en', 'it'],
    timezone: 'Europe/Berlin',
  },
  {
    userId: 'u-noah',
    memberLabel: 'Noah Williams · Noah W.',
    emailMasked: 'n***@ember.community',
    slots: ['cal-americas:slot-mon-1900', 'cal-americas:slot-wed-1900', 'cal-asia:slot-sat-1000'],
    intention: 'frontier',
    languages: ['en'],
    timezone: 'America/Los_Angeles',
  },
  {
    userId: 'u-camila',
    memberLabel: 'Camila Ferreira · Camila F.',
    emailMasked: 'c***@ember.community',
    slots: ['cal-americas:slot-wed-1900'],
    intention: 'ease',
    languages: ['pt', 'en'],
    timezone: 'America/Sao_Paulo',
  },
  {
    userId: 'u-omar',
    memberLabel: 'Omar Hassan · Omar H.',
    emailMasked: 'o***@ember.community',
    slots: ['cal-europe:slot-sun-1300', 'cal-americas:slot-mon-1900'],
    intention: 'surprise',
    languages: ['en', 'ar'],
    timezone: 'Europe/Lisbon',
  },
];

export const MOCK_TRIOS = [
  {
    memberIds: ['u-marina', 'u-jonas', 'u-priya'] as [string, string, string],
    slot: 'cal-americas:slot-wed-1900',
    score: 0.86,
  },
  {
    memberIds: ['u-lucas', 'u-sofia', 'u-elena'] as [string, string, string],
    slot: 'cal-europe:slot-sun-1300',
    score: 0.81,
  },
  {
    memberIds: ['u-alex', 'u-noah', 'u-camila'] as [string, string, string],
    slot: 'cal-americas:slot-mon-1900',
    score: 0.78,
  },
];

export const MOCK_UNMATCHED_COUNT = 2;
