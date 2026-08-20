export const isMockMode = import.meta.env.VITE_MOCK === 'true';

export const appBasePath = import.meta.env.VITE_BASE_PATH || '/';

export const MOCK_DEMO_CODE = '123456';

export const MOCK_DEMO_EMAIL = 'demo@ember.app';

export const MOCK_FACILITATOR_DEMO_EMAIL = 'facilitador@demo.ember';

export const MOCK_ORG_ADMIN_DEMO_EMAIL = 'admin@demo.ember';

export const MOCK_NEW_MEMBER_DEMO_EMAIL = 'novo@demo.ember';

export const MOCK_DEMO_PRESENCE = {
  slots: ['cal-americas:slot-mon-1900', 'cal-americas:slot-wed-1900'],
  intention: 'surprise' as const,
};

export const MOCK_DEMO_ROUND_DRAFT = {
  templateId: 'tpl-council',
  theme: 'Pontes entre gerações / Bridges across generations',
  questions: [
    'O que você herdou — e o que escolheu deixar para trás? / What did you inherit — and what did you choose to leave behind?',
    'Quem te ensinou a escutar de verdade? / Who taught you to listen for real?',
  ],
  slots: [
    {
      timezone: 'America/Sao_Paulo',
      localDate: '2026-08-25',
      localTime: '19:00',
      officialLabel: 'Seg 19:00 (BRT)',
    },
    {
      timezone: 'America/Sao_Paulo',
      localDate: '2026-08-27',
      localTime: '19:00',
      officialLabel: 'Qua 19:00 (BRT)',
    },
  ],
};

export function routerBasename(basePath = appBasePath): string | undefined {
  const trimmed = basePath.replace(/\/$/, '');
  if (!trimmed || trimmed === '/') return undefined;
  return trimmed;
}

export function isFacilitatorDemoEmail(email: string): boolean {
  return /facilitador|facilitator/i.test(email);
}

export function isOrgAdminDemoEmail(email: string): boolean {
  return /admin|org-admin|orgadmin/i.test(email);
}

export function isNewMemberDemoEmail(email: string): boolean {
  return /novo|new-member|incomplete/i.test(email);
}
