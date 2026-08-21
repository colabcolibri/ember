const DEFAULT_JITSI_BASE = 'https://meet.jit.si';

/**
 * Browser-safe Jitsi room URL for mock/demo.
 * API uses SHA-256 via node:crypto — avoid importing @ember/domain barrel in client code.
 */
export function buildJitsiRoomUrl(circleId: string, baseUrl = DEFAULT_JITSI_BASE): string {
  const base = baseUrl.replace(/\/$/, '');
  const slug = toBase64Url(circleId).slice(0, 20);
  return `${base}/ember-${slug}`;
}

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
