import { ctaButton, emailLead, emailMuted, emailPlainLink, wrapEmailDocument } from './email-layout.js';
import type { EmailLocale } from './email-locale.js';
import { resolveAppUrl } from './email-env.js';

export type MagicLinkEmailContent = {
  subject: string;
  text: string;
  html: string;
};

export function buildMagicLinkEmailContent(input: {
  magicLinkUrl: string;
  ttlMinutes: number;
  locale?: EmailLocale;
}): MagicLinkEmailContent {
  const locale = input.locale ?? 'pt';
  const url = input.magicLinkUrl.trim();
  const intro =
    locale === 'pt'
      ? 'Use o link abaixo para entrar na Ember. Ele é pessoal e expira em breve.'
      : 'Use the link below to sign in to Ember. It is personal and expires soon.';
  const ctaLabel = locale === 'pt' ? 'Entrar na Ember' : 'Sign in to Ember';
  const expiry =
    locale === 'pt'
      ? `O link expira em ${input.ttlMinutes} minutos.`
      : `This link expires in ${input.ttlMinutes} minutes.`;
  const footer =
    locale === 'pt'
      ? 'Se você não solicitou este email, ignore-o com segurança.'
      : 'If you did not request this email, you can safely ignore it.';

  const text = [intro, '', url, '', expiry, '', footer].join('\n');

  const panelHtml = `
    ${emailLead(locale === 'pt' ? 'Seu link de acesso' : 'Your sign-in link')}
    ${emailMuted(intro)}
    ${ctaButton(ctaLabel, url)}
    ${emailPlainLink(url, locale === 'pt' ? 'Ou copie o link' : 'Or copy the link')}
    ${emailMuted(expiry)}`;

  const html = wrapEmailDocument(locale, panelHtml, footer);
  const subject =
    locale === 'pt' ? 'Seu link de acesso — Ember' : 'Your sign-in link — Ember';

  return { subject, text, html };
}

export function buildMagicLinkUrl(input: {
  token: string;
  appUrl?: string;
}): string {
  const base = input.appUrl ?? resolveAppUrl();
  return `${base}/api/v1/auth/magic-link/verify?token=${encodeURIComponent(input.token)}`;
}
