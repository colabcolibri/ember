import { EMAIL_BRAND } from './email-brand.js';
import { ctaButton, emailPlainLink, escapeHtml, wrapEmailDocument } from './email-layout.js';
import type { EmailLocale } from './email-locale.js';

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

  const { text: textColor, textSoft } = EMAIL_BRAND.colors;
  const panelHtml = `
    <p style="margin:0 0 20px;font-size:17px;line-height:1.55;color:${textColor};">${escapeHtml(intro)}</p>
    ${ctaButton(ctaLabel, url)}
    ${emailPlainLink(url, locale === 'pt' ? 'Ou copie o link' : 'Or copy the link')}
    <p style="margin:20px 0 0;font-size:14px;line-height:1.5;color:${textSoft};">${escapeHtml(expiry)}</p>`;

  const html = wrapEmailDocument(locale, panelHtml, footer);
  const subject =
    locale === 'pt' ? 'Seu link de acesso — Ember' : 'Your sign-in link — Ember';

  return { subject, text, html };
}

export function buildMagicLinkUrl(input: {
  token: string;
  appUrl?: string;
}): string {
  const base = (input.appUrl ?? process.env.EMBER_APP_URL?.trim() ?? 'http://localhost:3000').replace(
    /\/$/,
    '',
  );
  return `${base}/api/v1/auth/magic-link/verify?token=${encodeURIComponent(input.token)}`;
}
