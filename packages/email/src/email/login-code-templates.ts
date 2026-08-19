import { EMAIL_BRAND } from './email-brand.js';
import { emailLead, emailMuted, escapeHtml, wrapEmailDocument } from './email-layout.js';
import type { EmailLocale } from './email-locale.js';

export type LoginCodeEmailContent = {
  subject: string;
  text: string;
  html: string;
};

export function buildLoginCodeEmailContent(input: {
  code: string;
  ttlMinutes: number;
  locale?: EmailLocale;
}): LoginCodeEmailContent {
  const locale = input.locale ?? 'pt';
  const intro =
    locale === 'pt'
      ? 'Use o código abaixo para entrar na Ember. Ele é pessoal e expira em breve.'
      : 'Use the code below to sign in to Ember. It is personal and expires soon.';
  const expiry =
    locale === 'pt'
      ? `O código expira em ${input.ttlMinutes} minutos.`
      : `This code expires in ${input.ttlMinutes} minutes.`;
  const footer =
    locale === 'pt'
      ? 'Se você não solicitou este email, ignore-o com segurança.'
      : 'If you did not request this email, you can safely ignore it.';

  const text = [intro, '', input.code, '', expiry, '', footer].join('\n');

  const { text: textColor } = EMAIL_BRAND.colors;
  const panelHtml = `
    ${emailLead(locale === 'pt' ? 'Seu código de acesso' : 'Your sign-in code')}
    ${emailMuted(intro)}
    <p style="margin:16px 0 8px;font-size:32px;font-weight:700;letter-spacing:0.35em;color:${textColor};">${escapeHtml(input.code)}</p>
    ${emailMuted(expiry)}`;

  const html = wrapEmailDocument(locale, panelHtml, footer);
  const subject = locale === 'pt' ? 'Seu código de acesso — Ember' : 'Your sign-in code — Ember';

  return { subject, text, html };
}
