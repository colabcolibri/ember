import { createHash } from 'node:crypto';
import { decryptVault, encryptVault } from './vault-crypto.js';
import { requireEmailPepper } from './email-pepper.js';

const EMAIL_VAULT_NAMESPACE = 'email-vault:v1';

export function normalizeRecipientEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashRecipientEmail(email: string, pepper = requireEmailPepper()): string {
  return createHash('sha256')
    .update(`${pepper}:${normalizeRecipientEmail(email)}`)
    .digest('hex');
}

export function encryptRecipientEmail(email: string, pepper = requireEmailPepper()): string {
  return encryptVault(normalizeRecipientEmail(email), pepper, EMAIL_VAULT_NAMESPACE);
}

export function decryptRecipientEmail(vault: string, pepper = requireEmailPepper()): string | null {
  return decryptVault(vault, pepper, EMAIL_VAULT_NAMESPACE);
}
