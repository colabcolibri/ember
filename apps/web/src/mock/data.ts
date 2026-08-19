import type { RegionalSlotOption } from '../components/app/RegionalSlotPicker.js';
import type { PlaceRef } from '../lib/place.js';

export const MOCK_ROUND_ID = 'mock-round-1';

export const MOCK_REGIONAL_SLOTS: RegionalSlotOption[] = [
  {
    ref: 'cal-americas:slot-mon-1900',
    calendarLabel: 'Américas',
    officialLabel: 'Seg 19:00 (BRT)',
    localLabel: 'Seg 19:00',
  },
  {
    ref: 'cal-americas:slot-wed-1900',
    calendarLabel: 'Américas',
    officialLabel: 'Qua 19:00 (BRT)',
    localLabel: 'Qua 19:00',
  },
  {
    ref: 'cal-europe:slot-sun-1300',
    calendarLabel: 'Europa',
    officialLabel: 'Dom 13:00 (CET)',
    localLabel: 'Dom 08:00',
  },
  {
    ref: 'cal-europe:slot-tue-2000',
    calendarLabel: 'Europa',
    officialLabel: 'Ter 20:00 (CET)',
    localLabel: 'Ter 15:00',
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
];

export const MOCK_TEMPLATES = [
  {
    id: 'tpl-fogo',
    name: 'Fogo de Conselho',
    circleSize: 3,
    durationMinutes: 60,
  },
  {
    id: 'tpl-cafe',
    name: 'Café com intenção',
    circleSize: 4,
    durationMinutes: 45,
  },
];

export const MOCK_DECLARATIONS = [
  {
    userId: 'u-1',
    memberLabel: 'Marina S.',
    emailMasked: 'm***@gsa.org',
    slots: ['cal-americas:slot-mon-1900', 'cal-americas:slot-wed-1900'],
    intention: 'surprise',
    languages: ['pt', 'en'],
    timezone: 'America/Sao_Paulo',
  },
  {
    userId: 'u-2',
    memberLabel: 'Jonas K.',
    emailMasked: 'j***@example.com',
    slots: ['cal-europe:slot-sun-1300'],
    intention: 'frontier',
    languages: ['en', 'de'],
    timezone: 'Europe/Berlin',
  },
  {
    userId: 'u-3',
    memberLabel: 'Priya M.',
    emailMasked: 'p***@example.com',
    slots: ['cal-americas:slot-wed-1900', 'cal-europe:slot-tue-2000'],
    intention: 'ease',
    languages: ['en'],
    timezone: 'America/New_York',
  },
  {
    userId: 'u-4',
    memberLabel: 'Lucas A.',
    emailMasked: 'l***@example.com',
    slots: ['cal-americas:slot-mon-1900'],
    intention: 'surprise',
    languages: ['pt'],
    timezone: 'America/Sao_Paulo',
  },
];

export const MOCK_TRIOS = [
  {
    memberIds: ['u-1', 'u-2', 'u-3'] as [string, string, string],
    slot: 'cal-americas:slot-wed-1900',
    score: 0.82,
  },
  {
    memberIds: ['u-4', 'u-1', 'u-2'] as [string, string, string],
    slot: 'cal-americas:slot-mon-1900',
    score: 0.76,
  },
];
