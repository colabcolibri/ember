import type { EmailLocale } from './email-locale.js';
import {
  ctaButton,
  emailBulletList,
  emailLead,
  emailMuted,
  emailNumberedList,
  emailParagraph,
  emailPlainLink,
  emailSectionLabel,
  wrapEmailDocument,
} from './email-layout.js';

export type RoundOpenEmailContent = {
  subject: string;
  text: string;
  html: string;
};

function buildRoundOpenText(input: {
  theme: string;
  questions: string[];
  slotLabels: string[];
  presenceUrl: string;
  locale: EmailLocale;
}): string {
  const { locale } = input;
  const title = locale === 'pt' ? 'Inscrições abertas na Ember' : 'New Ember round is open';
  const themeLabel = locale === 'pt' ? 'Tema' : 'Theme';
  const questionsLabel = locale === 'pt' ? 'Perguntas' : 'Questions';
  const slotsLabel = locale === 'pt' ? 'Horários disponíveis' : 'Available slots';
  const cta = locale === 'pt' ? 'Declarar presença' : 'Declare presence';
  const footer =
    locale === 'pt'
      ? 'Você recebe este email por ser membro da comunidade piloto.'
      : 'You receive this email as a pilot community member.';

  const questionsBlock = input.questions.map((q, index) => `${index + 1}. ${q}`).join('\n');
  const slotsBlock = input.slotLabels.map((slot) => `• ${slot}`).join('\n');

  return [
    title,
    '',
    `${themeLabel}: "${input.theme}"`,
    '',
    `${questionsLabel}:`,
    questionsBlock,
    '',
    `${slotsLabel}:`,
    slotsBlock,
    '',
    `${cta}: ${input.presenceUrl}`,
    '',
    footer,
  ].join('\n');
}

export function buildRoundOpenEmailContent(input: {
  theme: string;
  questions: string[];
  slotLabels: string[];
  presenceUrl: string;
  locale?: EmailLocale;
}): RoundOpenEmailContent {
  const locale = input.locale ?? 'pt';
  const title = locale === 'pt' ? 'Inscrições abertas' : 'New round open';
  const themeLabel = locale === 'pt' ? 'Tema' : 'Theme';
  const questionsLabel = locale === 'pt' ? 'Perguntas' : 'Questions';
  const slotsLabel = locale === 'pt' ? 'Horários disponíveis' : 'Available slots';
  const intro =
    locale === 'pt'
      ? 'As inscrições estão abertas. Escolha um horário e declare sua presença.'
      : 'A new round is open. Pick a slot and declare your presence.';
  const cta = locale === 'pt' ? 'Declarar presença' : 'Declare presence';
  const footer =
    locale === 'pt'
      ? 'Você recebe este email por ser membro da comunidade piloto.'
      : 'You receive this email as a pilot community member.';

  const text = buildRoundOpenText({ ...input, locale });

  const panel = `
    ${emailLead(title)}
    ${emailMuted(intro)}
    ${emailSectionLabel(themeLabel)}
    ${emailParagraph(input.theme)}
    ${emailSectionLabel(questionsLabel)}
    ${emailNumberedList(input.questions)}
    ${emailSectionLabel(slotsLabel)}
    ${emailBulletList(input.slotLabels)}
    ${ctaButton(cta, input.presenceUrl)}
    ${emailPlainLink(input.presenceUrl, locale === 'pt' ? 'Ou copie o link' : 'Or copy the link')}`;

  const html = wrapEmailDocument(locale, panel, footer);
  const subject =
    locale === 'pt' ? 'Inscrições abertas — Ember' : 'New round open — Ember';
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
  const title = locale === 'pt' ? 'Seu círculo está pronto' : 'Your circle is ready';
  const intro =
    locale === 'pt'
      ? 'Seu trio está confirmado. Veja os detalhes abaixo e entre no encontro no horário marcado.'
      : 'Your trio is confirmed. See the details below and join at the scheduled time.';
  const questionLabel = locale === 'pt' ? 'Pergunta do encontro' : 'Circle question';
  const whenLabel = locale === 'pt' ? 'Horário do encontro' : 'Time';
  const ctaCircle = locale === 'pt' ? 'Ver convite do círculo' : 'View circle invite';
  const ctaJitsi = locale === 'pt' ? 'Entrar no Jitsi' : 'Join Jitsi';
  const footer =
    locale === 'pt'
      ? 'Anexo: arquivo .ics para adicionar ao calendário.'
      : 'Attachment: .ics file to add to your calendar.';

  const text = [
    title,
    '',
    intro,
    '',
    `${questionLabel}: "${input.question}"`,
    `${whenLabel}: ${input.whenLabel}`,
    '',
    input.circleUrl,
    input.jitsiUrl,
    '',
    footer,
  ].join('\n');

  const panel = `
    ${emailLead(title)}
    ${emailMuted(intro)}
    ${emailSectionLabel(questionLabel)}
    ${emailParagraph(input.question)}
    ${emailSectionLabel(whenLabel)}
    ${emailParagraph(input.whenLabel)}
    ${ctaButton(ctaCircle, input.circleUrl)}
    ${ctaButton(ctaJitsi, input.jitsiUrl)}
    ${emailPlainLink(input.circleUrl, locale === 'pt' ? 'Detalhes do círculo' : 'Circle details')}`;

  const html = wrapEmailDocument(locale, panel, footer);
  const subject =
    locale === 'pt' ? 'Seu círculo Ember está pronto' : 'Your Ember circle is ready';

  return { subject, text, html };
}
