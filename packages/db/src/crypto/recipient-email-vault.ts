import { createHash } from 'node:crypto';
import { decryptVault, encryptVault } from './vault-crypto.js';

const EMAIL_VAULT_NAMESPACE = 'email-vault:v1';

export function normalizeRecipientEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashRecipientEmail(email: string, pepper: string): string {
  return createHash('sha256')
    .update(`${pepper}:${normalizeRecipientEmail(email)}`)
    .digest('hex');
}

export function encryptRecipientEmail(email: string, pepper: string): string {
  return encryptVault(normalizeRecipientEmail(email), pepper, EMAIL_VAULT_NAMESPACE);
}

export function decryptRecipientEmail(vault: string, pepper: string): string | null {
  return decryptVault(vault, pepper, EMAIL_VAULT_NAMESPACE);
}
