import { decryptVault, encryptVault } from './crypto/vault-crypto.js';

const HTML_NAMESPACE = 'sent-email-html:v1';
const TEXT_NAMESPACE = 'sent-email-text:v1';

export function encryptSentEmailHtml(html: string, pepper: string): string {
  return encryptVault(html, pepper, HTML_NAMESPACE);
}

export function decryptSentEmailHtml(vault: string, pepper: string): string | null {
  return decryptVault(vault, pepper, HTML_NAMESPACE);
}

export function encryptSentEmailText(text: string, pepper: string): string {
  return encryptVault(text, pepper, TEXT_NAMESPACE);
}

export function decryptSentEmailText(vault: string, pepper: string): string | null {
  return decryptVault(vault, pepper, TEXT_NAMESPACE);
}
