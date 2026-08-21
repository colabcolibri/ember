import { ApiError } from '../lib/api.js';
import { MOCK_DEMO_CODE } from '../lib/mock-mode.js';
import type { MockTrio } from './population.js';
import { mockStore } from './store.js';

function parseBody(init?: RequestInit): unknown {
  if (!init?.body || typeof init.body !== 'string') return null;
  try {
    return JSON.parse(init.body);
  } catch {
    return null;
  }
}

function unauthorized(): never {
  throw new ApiError('unauthorized', 'Sessão expirada', 401);
}

function forbidden(message = 'Acesso restrito'): never {
  throw new ApiError('client', message, 403);
}

function requireCompleteProfile(): void {
  if (!mockStore.isProfileComplete()) {
    forbidden('Complete seu perfil antes de continuar.');
  }
}

function requireAuthedMember(): void {
  if (!mockStore.isAuthed()) unauthorized();
  requireCompleteProfile();
}

function notFound(message: string): never {
  throw new ApiError('client', message, 404);
}

function delay(ms = 180) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockApiDownload(path: string): Promise<{ blob: Blob; filename: string }> {
  await delay();

  const method = (path.split('?')[0]?.includes('/') ? 'GET' : 'GET');
  const [pathname, search = ''] = path.split('?');
  const params = new URLSearchParams(search);

  try {
    const unmatchedCsvGet = pathname.match(/^\/admin\/matching-rounds\/([^/]+)\/unmatched\/export\.csv$/);
    if (method === 'GET' && unmatchedCsvGet) {
      const locale = params.get('locale') === 'en' ? 'en' : 'pt';
      const csv = mockStore.exportUnmatchedCsv(unmatchedCsvGet[1]!, locale);
      return {
        blob: new Blob([csv], { type: 'text/csv;charset=utf-8' }),
        filename: `unmatched-${unmatchedCsvGet[1]}.csv`,
      };
    }
  } catch (err) {
    if (err instanceof Error && err.message === 'round not found') {
      throw new ApiError('client', 'Encontro não encontrado', 404);
    }
    if (err instanceof Error && err.message === 'forbidden') {
      throw new ApiError('client', 'Acesso restrito', 403);
    }
    if (err instanceof Error && err.message === 'unauthorized') {
      throw new ApiError('unauthorized', 'Sessão expirada', 401);
    }
    throw err;
  }

  throw new ApiError('client', `Mock sem rota de download: ${path}`, 404);
}

export async function mockApiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  await delay();

  const method = (init?.method ?? 'GET').toUpperCase();
  const [pathname, search = ''] = path.split('?');
  const params = new URLSearchParams(search);
  const body = parseBody(init) as Record<string, unknown> | null;

  try {
    if (method === 'POST' && pathname === '/auth/code') {
      return {} as T;
    }

    if (method === 'POST' && pathname === '/auth/code/verify') {
      const email = String(body?.email ?? '');
      const code = String(body?.code ?? '');
      if (code !== MOCK_DEMO_CODE) {
        throw new ApiError('client', 'Código inválido ou expirado', 400);
      }
      mockStore.login(email);
      return {} as T;
    }

    if (method === 'POST' && pathname === '/auth/logout') {
      mockStore.logout();
      return {} as T;
    }

    if (pathname === '/auth/session' && method === 'GET') {
      return mockStore.getSession() as T;
    }

    if (pathname === '/me/profile' && method === 'GET') {
      if (!mockStore.isAuthed()) unauthorized();
      return mockStore.getProfile() as T;
    }

    if (pathname === '/public/community' && method === 'GET') {
      return mockStore.getPublicCommunity() as T;
    }

    if (pathname === '/admin/community/branding' && method === 'GET') {
      try {
        return mockStore.getCommunityBranding() as T;
      } catch {
        forbidden();
      }
    }

    if (pathname === '/admin/community/branding' && method === 'PUT') {
      try {
        return mockStore.updateCommunityBranding((body ?? {}) as never) as T;
      } catch {
        forbidden();
      }
    }

    if (pathname === '/admin/members' && method === 'GET') {
      try {
        return { items: mockStore.listMembers() } as T;
      } catch {
        forbidden();
      }
    }

    if (pathname === '/admin/invites' && method === 'POST') {
      try {
        mockStore.inviteMember(String(body?.email ?? ''), body?.displayName ? String(body.displayName) : undefined);
        return { ok: true } as T;
      } catch {
        forbidden();
      }
    }

    if (pathname === '/admin/invites/import' && method === 'POST') {
      try {
        const csv = typeof init?.body === 'string' ? init.body : '';
        const rows = csv
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .filter((line, index) => !(index === 0 && /email/i.test(line)))
          .map((line) => {
            const [email, displayName] = line.split(',').map((part) => part.trim());
            return { email: email ?? '', displayName: displayName || undefined };
          });
        return mockStore.importMembers(rows) as T;
      } catch {
        forbidden();
      }
    }

    if (pathname === '/me/profile' && method === 'PUT') {
      if (!mockStore.isAuthed()) unauthorized();
      return mockStore.updateProfile(body ?? {}) as T;
    }

    if (pathname === '/rounds/open' && method === 'GET') {
      requireAuthedMember();
      return { rounds: mockStore.listOpenRoundsForMember() } as T;
    }

    if (pathname === '/rounds/current' && method === 'GET') {
      requireAuthedMember();
      const round = mockStore.getRound();
      const timezone = params.get('timezone');
      if (timezone) {
        return {
          ...round,
          memberTimezone: timezone,
        } as T;
      }
      return round as T;
    }

    const roundDetailGet = pathname.match(/^\/rounds\/([^/]+)$/);
    if (roundDetailGet && method === 'GET') {
      requireAuthedMember();
      try {
        const timezone = params.get('timezone') ?? undefined;
        return mockStore.getRoundById(roundDetailGet[1]!, timezone) as T;
      } catch {
        notFound('Convite não encontrado');
      }
    }

    const presenceGet = pathname.match(/^\/rounds\/([^/]+)\/presence$/);
    if (presenceGet && method === 'GET') {
      requireAuthedMember();
      return mockStore.getDeclaration(presenceGet[1]!) as T;
    }

    const presencePost = pathname.match(/^\/rounds\/([^/]+)\/presence$/);
    if (presencePost && method === 'POST') {
      requireAuthedMember();
      if (body?.response === 'declined') {
        return mockStore.saveDeclaration(presencePost[1]!, { response: 'declined' }) as T;
      }
      return mockStore.saveDeclaration(presencePost[1]!, {
        response: 'attending',
        slots: (body?.slots as string[]) ?? [],
        intention: (body?.intention as 'surprise' | 'frontier' | 'ease') ?? 'surprise',
      }) as T;
    }

    if (pathname === '/circles' && method === 'GET') {
      requireAuthedMember();
      return { circles: mockStore.listCircles() } as T;
    }

    const circleGet = pathname.match(/^\/circles\/([^/]+)$/);
    if (circleGet && method === 'GET') {
      requireAuthedMember();
      try {
        return mockStore.getCircle(circleGet[1]!) as T;
      } catch {
        notFound('Grupo não encontrado');
      }
    }

    const circleConfirm = pathname.match(/^\/circles\/([^/]+)\/confirm$/);
    if (circleConfirm && method === 'POST') {
      requireAuthedMember();
      mockStore.confirmCircle(circleConfirm[1]!);
      return {} as T;
    }

    const circleAttendance = pathname.match(/^\/circles\/([^/]+)\/attendance$/);
    if (circleAttendance && method === 'POST') {
      requireAuthedMember();
      mockStore.recordAttendance(circleAttendance[1]!, Boolean(body?.happened));
      return {} as T;
    }

    if (pathname === '/places/autocomplete' && method === 'GET') {
      if (!mockStore.isAuthed()) unauthorized();
      const text = params.get('text') ?? '';
      return { items: mockStore.searchPlaces(text) } as T;
    }

    if (pathname === '/admin/matching-rounds' && method === 'GET') {
      try {
        return { rounds: mockStore.listGatherings() } as T;
      } catch {
        forbidden();
      }
    }

    if (pathname === '/admin/matching-rounds/current' && method === 'GET') {
      try {
        return mockStore.getCurrentOpenRound() as T;
      } catch {
        forbidden();
      }
    }

    const metricsGet = pathname.match(/^\/admin\/matching-rounds\/([^/]+)\/metrics$/);
    if (metricsGet && method === 'GET') {
      try {
        return mockStore.getRoundMetrics(metricsGet[1]!) as T;
      } catch (err) {
        if (err instanceof Error && err.message === 'not found') notFound('Encontro não encontrado');
        forbidden();
      }
    }

    const roundPut = pathname.match(/^\/admin\/matching-rounds\/([^/]+)$/);
    if (roundPut && method === 'PUT' && roundPut[1] !== 'current') {
      try {
        return mockStore.updateGathering(roundPut[1]!, body as never) as T;
      } catch (err) {
        if (err instanceof Error && err.message === 'round not found') notFound('Encontro não encontrado');
        forbidden();
      }
    }

    const roundClose = pathname.match(/^\/admin\/matching-rounds\/([^/]+)\/close$/);
    if (roundClose && method === 'POST') {
      try {
        return mockStore.closeGathering(roundClose[1]!) as T;
      } catch (err) {
        if (err instanceof Error && err.message === 'round not found') notFound('Encontro não encontrado');
        forbidden();
      }
    }

    const roundReopen = pathname.match(/^\/admin\/matching-rounds\/([^/]+)\/reopen$/);
    if (roundReopen && method === 'POST') {
      try {
        return mockStore.reopenGathering(roundReopen[1]!) as T;
      } catch (err) {
        if (err instanceof Error && err.message === 'round not found') notFound('Encontro não encontrado');
        if (err instanceof Error && err.message === 'other open') {
          throw new ApiError('client', 'Já existe outro convite com inscrições abertas', 409);
        }
        forbidden();
      }
    }

    const roundGet = pathname.match(/^\/admin\/matching-rounds\/([^/]+)$/);
    if (roundGet && method === 'GET' && roundGet[1] !== 'current') {
      try {
        return mockStore.getGathering(roundGet[1]!) as T;
      } catch (err) {
        if (err instanceof Error && err.message === 'not found') notFound('Encontro não encontrado');
        forbidden();
      }
    }

    if (pathname === '/admin/templates' && method === 'GET') {
      try {
        return { templates: mockStore.listTemplates() } as T;
      } catch {
        forbidden();
      }
    }

    if (pathname === '/admin/templates' && method === 'POST') {
      try {
        return mockStore.createTemplate(body as never) as T;
      } catch {
        forbidden();
      }
    }

    const templatePut = pathname.match(/^\/admin\/templates\/([^/]+)$/);
    if (templatePut && method === 'PUT') {
      try {
        return mockStore.updateTemplate(templatePut[1]!, body as never) as T;
      } catch {
        forbidden();
      }
    }

    if (pathname === '/admin/matching-rounds' && method === 'POST') {
      try {
        return mockStore.createRound(body as never) as T;
      } catch {
        forbidden();
      }
    }

    const declarationsGet = pathname.match(/^\/admin\/matching-rounds\/([^/]+)\/declarations$/);
    if (declarationsGet && method === 'GET') {
      try {
        return mockStore.listDeclarations(declarationsGet[1]!) as T;
      } catch {
        forbidden();
      }
    }

    const matchPost = pathname.match(/^\/admin\/matching-rounds\/([^/]+)\/match$/);
    if (matchPost && method === 'POST') {
      try {
        return mockStore.runMatch(matchPost[1]!) as T;
      } catch {
        forbidden();
      }
    }

    const autoMatchGet = pathname.match(/^\/admin\/matching-rounds\/([^/]+)\/auto-match$/);
    if (autoMatchGet && method === 'GET') {
      try {
        return mockStore.getAutoMatchDraft(autoMatchGet[1]!) as T;
      } catch {
        forbidden();
      }
    }

    if (autoMatchGet && method === 'POST') {
      try {
        return mockStore.runAutoMatch(autoMatchGet[1]!) as T;
      } catch {
        forbidden();
      }
    }

    if (autoMatchGet && method === 'DELETE') {
      try {
        return mockStore.undoAutoMatch(autoMatchGet[1]!) as T;
      } catch {
        forbidden();
      }
    }

    const retryEmailsPost = pathname.match(/^\/admin\/matching-rounds\/([^/]+)\/publish\/retry-emails$/);
    if (retryEmailsPost && method === 'POST') {
      try {
        return mockStore.retryPublishEmails(retryEmailsPost[1]!) as T;
      } catch {
        forbidden();
      }
    }

    const publishPost = pathname.match(/^\/admin\/matching-rounds\/([^/]+)\/publish$/);
    if (publishPost && method === 'POST') {
      try {
        const parsedBody = body as { groups?: MockTrio[] } | null;
        return mockStore.publish(publishPost[1]!, parsedBody ?? undefined) as T;
      } catch {
        forbidden();
      }
    }

    throw new ApiError('client', `Mock sem rota: ${method} ${pathname}`, 404);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.message === 'unauthorized') unauthorized();
    if (error instanceof Error && error.message === 'forbidden') forbidden();
    if (error instanceof Error && error.message === 'profile_incomplete') {
      forbidden('Complete seu perfil antes de continuar.');
    }
    throw error;
  }
}
