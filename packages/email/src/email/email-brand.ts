import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { EmailLocale } from './email-locale.js';

/** Tokens de marca para email — paleta rust/paper/ink do design system. */
export const EMAIL_BRAND = {
  productName: 'Ember',
  logoAlt: 'Ember',
  tagline: {
    pt: 'Encontros pequenos, com intenção.',
    en: 'Small gatherings, with intention.',
  } satisfies Record<EmailLocale, string>,
  colors: {
    ink: '#20211f',
    panel: '#fbf8f3',
    text: '#20211f',
    textSoft: '#68645d',
    muted: '#68645d',
    onInk: '#fbf8f3',
    onInkMuted: '#c9c4bc',
    accent: '#aa4f36',
    accentSoft: '#f4efe7',
    onAccent: '#fbf8f3',
    rule: 'rgba(251,248,243,.18)',
  },
} as const;

const LOGO_FILENAME = 'ember-logo-email.png';

function resolveEmailLogoPath(): string | null {
  const fromEnv = process.env.EMBER_EMAIL_ASSETS_DIR?.trim();
  if (fromEnv) {
    const candidate = join(fromEnv, LOGO_FILENAME);
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  const moduleRelative = join(dirname(fileURLToPath(import.meta.url)), '../../assets', LOGO_FILENAME);
  if (existsSync(moduleRelative)) {
    return moduleRelative;
  }

  return null;
}

export const EMAIL_LOGO_CID = 'ember-logo';

export type EmailLogoInlineAttachment = {
  filename: string;
  content: string;
  content_id: string;
  content_type: string;
};

let cachedLogoInlineAttachment: EmailLogoInlineAttachment | null | undefined;

export function emailLogoInlineAttachment(): EmailLogoInlineAttachment | null {
  if (cachedLogoInlineAttachment !== undefined) {
    return cachedLogoInlineAttachment;
  }

  const path = resolveEmailLogoPath();
  if (!path) {
    cachedLogoInlineAttachment = null;
    return null;
  }

  const buffer = readFileSync(path);
  cachedLogoInlineAttachment = {
    filename: LOGO_FILENAME,
    content: buffer.toString('base64'),
    content_id: EMAIL_LOGO_CID,
    content_type: 'image/png',
  };
  return cachedLogoInlineAttachment;
}

export function emailLogoAttachments(): EmailLogoInlineAttachment[] {
  const attachment = emailLogoInlineAttachment();
  return attachment ? [attachment] : [];
}

export function emailLogoSrc(): string | null {
  return emailLogoInlineAttachment() ? `cid:${EMAIL_LOGO_CID}` : null;
}

export function resetEmailLogoCacheForTests(): void {
  cachedLogoInlineAttachment = undefined;
}
