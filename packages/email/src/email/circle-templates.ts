import type { EmailLocale } from './email-locale.js';
import { EMAIL_BRAND } from './email-brand.js';
import { ctaButton, emailPlainLink, escapeHtml, wrapEmailDocument } from './email-layout.js';

export type RoundOpenEmailContent = {
  subject: string;
  text: string;
  html: string;
};

export function buildRoundOpenEmailContent(input: {
  question: string;
  slots: string[];
  presenceUrl: string;
  locale?: EmailLocale;
}): RoundOpenEmailContent {
  const locale = input.locale ?? 'pt';
  const slotsText = input.slots.join(', ');
  const intro =
    locale === 'pt'
      ? `Nova rodada aberta na Ember. Pergunta: "${input.question}". Horários: ${slotsText}.`
      : `A new Ember round is open. Question: "${input.question}". Slots: ${slotsText}.`;
  const cta = locale === 'pt' ? 'Declarar presença' : 'Declare presence';
  const footer =
    locale === 'pt'
      ? 'Você recebe este email por ser membro da comunidade piloto.'
      : 'You receive this email as a pilot community member.';

  const text = [intro, '', input.presenceUrl, '', footer].join('\n');
  const panel = `
    <p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:${EMAIL_BRAND.colors.text};">${escapeHtml(intro)}</p>
    ${ctaButton(cta, input.presenceUrl)}
    ${emailPlainLink(input.presenceUrl, locale === 'pt' ? 'Ou copie o link' : 'Or copy the link')}`;
  const html = wrapEmailDocument(locale, panel, footer);
  const subject =
    locale === 'pt' ? 'Nova rodada aberta — Ember' : 'New round open — Ember';
  return { subject, text, html };
}

export type CircleFormedEmailContent = {
  subject: string;
  text: string;
  html: string;
};

export function buildCircleFormedEmailContent(input: {
  question: string;
  whenLabel: string;
  jitsiUrl: string;
  circleUrl: string;
  locale?: EmailLocale;
}): CircleFormedEmailContent {
  const locale = input.locale ?? 'pt';
  const intro =
    locale === 'pt'
      ? `Sua roda foi formada. Pergunta: "${input.question}". Horário: ${input.whenLabel}.`
      : `Your circle is ready. Question: "${input.question}". Time: ${input.whenLabel}.`;
  const ctaCircle = locale === 'pt' ? 'Ver convite da roda' : 'View circle invite';
  const ctaJitsi = locale === 'pt' ? 'Entrar no Jitsi' : 'Join Jitsi';
  const footer =
    locale === 'pt'
      ? 'Anexo: arquivo .ics para adicionar ao calendário.'
      : 'Attachment: .ics file to add to your calendar.';

  const text = [
    intro,
    '',
    input.circleUrl,
    input.jitsiUrl,
    '',
    footer,
  ].join('\n');

  const panel = `
    <p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:${EMAIL_BRAND.colors.text};">${escapeHtml(intro)}</p>
    ${ctaButton(ctaCircle, input.circleUrl)}
    ${ctaButton(ctaJitsi, input.jitsiUrl)}
    ${emailPlainLink(input.circleUrl, locale === 'pt' ? 'Detalhes da roda' : 'Circle details')}`;

  const html = wrapEmailDocument(locale, panel, footer);
  const subject =
    locale === 'pt' ? 'Sua roda Ember está pronta' : 'Your Ember circle is ready';

  return { subject, text, html };
}
