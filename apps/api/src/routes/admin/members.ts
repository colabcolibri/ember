import { Hono } from 'hono';
import type { ensureDatabaseReady } from '@ember/db';
import {
  createLoginCode,
  inviteCommunityMember,
  listCommunityMembers,
} from '@ember/db';
import { z } from 'zod';
import {
  buildLoginCodeEmailContent,
  createEmailDeliveryContext,
  requireEmailPepper,
  sendTransactionalEmail,
} from '@ember/email';
import { createRequireOrgAdmin, type OrgAdminVariables } from '../../lib/org-admin.js';

type Db = ReturnType<typeof ensureDatabaseReady>;

const inviteSchema = z.object({
  email: z.string().email(),
  displayName: z.string().trim().min(2).max(120).optional(),
});

const CODE_TTL_MINUTES = 15;

function parseCsv(content: string): Array<{ line: number; email: string; displayName?: string }> {
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const rows: Array<{ line: number; email: string; displayName?: string }> = [];

  for (let index = 0; index < lines.length; index += 1) {
    const lineNo = index + 1;
    const line = lines[index]!;
    if (lineNo === 1 && /email/i.test(line)) continue;

    const parts = line.split(',').map((part) => part.trim());
    const email = parts[0];
    if (!email) continue;
    rows.push({ line: lineNo, email, displayName: parts[1] || undefined });
  }

  return rows.slice(0, 500);
}

async function sendInviteLoginCode(
  db: Db,
  email: string,
  communityId: string,
  communitySlug: string,
): Promise<{ ok: boolean; error?: string }> {
  const pepper = requireEmailPepper();
  const { code } = createLoginCode(db, email, pepper);
  const content = buildLoginCodeEmailContent({ code, ttlMinutes: CODE_TTL_MINUTES, locale: 'pt' });
  const result = await sendTransactionalEmail({
    to: email,
    subject: content.subject,
    text: content.text,
    html: content.html,
    delivery: createEmailDeliveryContext({
      kind: 'login_code',
      db,
      meta: { community_id: communityId, community_slug: communitySlug, invite: 'true' },
    }),
  });
  return { ok: result.ok, error: result.error };
}

export function createAdminMembersRoutes(db: Db) {
  const members = new Hono<{ Variables: OrgAdminVariables }>();
  const requireOrgAdmin = createRequireOrgAdmin(db);

  members.get('/members', requireOrgAdmin, (c) => {
    const communityId = c.get('communityId');
    const pepper = requireEmailPepper();
    const items = listCommunityMembers(db, communityId, pepper);
    return c.json({ items });
  });

  members.post('/invites', requireOrgAdmin, async (c) => {
    const communityId = c.get('communityId');
    const communitySlug = process.env.EMBER_DEFAULT_COMMUNITY_SLUG?.trim() || 'gsa-pilot';
    const body = await c.req.json().catch(() => null);
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Convite inválido', details: parsed.error.issues } },
        400,
      );
    }

    const pepper = requireEmailPepper();
    inviteCommunityMember(db, communityId, parsed.data.email, pepper, parsed.data.displayName ?? null);
    const send = await sendInviteLoginCode(db, parsed.data.email, communityId, communitySlug);
    if (!send.ok) {
      return c.json(
        { error: { code: 'EMAIL_UNAVAILABLE', message: 'Não foi possível enviar o convite por email' } },
        503,
      );
    }

    return c.json({ ok: true }, 201);
  });

  members.post('/invites/import', requireOrgAdmin, async (c) => {
    const communityId = c.get('communityId');
    const communitySlug = process.env.EMBER_DEFAULT_COMMUNITY_SLUG?.trim() || 'gsa-pilot';
    const body = await c.req.text();
    const rows = parseCsv(body);
    const pepper = requireEmailPepper();
    const created: string[] = [];
    const errors: Array<{ line: number; email: string; message: string }> = [];

    for (const row of rows) {
      const emailParsed = z.string().email().safeParse(row.email);
      if (!emailParsed.success) {
        errors.push({ line: row.line, email: row.email, message: 'Email inválido' });
        continue;
      }

      try {
        inviteCommunityMember(db, communityId, emailParsed.data, pepper, row.displayName ?? null);
        const send = await sendInviteLoginCode(db, emailParsed.data, communityId, communitySlug);
        if (!send.ok) {
          errors.push({ line: row.line, email: row.email, message: 'Falha ao enviar email' });
          continue;
        }
        created.push(emailParsed.data);
      } catch {
        errors.push({ line: row.line, email: row.email, message: 'Erro ao registrar convite' });
      }
    }

    return c.json({ created: created.length, errors });
  });

  return members;
}
