import { createHash } from 'node:crypto';

export function buildJitsiRoomUrl(circleId: string, baseUrl?: string): string {
  const base = (baseUrl ?? process.env.EMBER_JITSI_BASE_URL ?? 'https://meet.jit.si').replace(
    /\/$/,
    '',
  );
  const slug = createHash('sha256').update(circleId).digest('base64url').slice(0, 20);
  return `${base}/ember-${slug}`;
}
