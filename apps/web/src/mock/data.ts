import type { RegionalSlotOption } from '../components/app/RegionalSlotPicker.js';
import {
  devBilingual,
  DEV_PLACES,
  DEV_REGIONAL_SLOTS,
  DEV_TEMPLATES,
} from '@ember/domain/fixtures/dev-population';

/** Bilingual copy helper — PT / EN in one string for mock fidelity. */
export const mockBilingual = devBilingual;

export const MOCK_COMMUNITY_NAME = mockBilingual('Comunidade Ember', 'Ember Community');

export const MOCK_ROUND_ID = 'mock-round-open';

export const MOCK_REGIONAL_SLOTS: RegionalSlotOption[] = [...DEV_REGIONAL_SLOTS];

export const MOCK_PLACES = DEV_PLACES;

export const MOCK_TEMPLATES = [...DEV_TEMPLATES];

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
      'Que ponte você gostaria de construir neste encontro?',
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

