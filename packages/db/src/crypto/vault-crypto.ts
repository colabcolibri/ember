import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

export function deriveVaultKey(pepper: string, namespace: string): Buffer {
  return createHash('sha256').update(`${pepper}:${namespace}`).digest();
}

export function encryptVault(plaintext: string, pepper: string, namespace: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', deriveVaultKey(pepper, namespace), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

export function decryptVault(vault: string, pepper: string, namespace: string): string | null {
  try {
    const buf = Buffer.from(vault, 'base64url');
    if (buf.length < 29) return null;
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const encrypted = buf.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', deriveVaultKey(pepper, namespace), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}
