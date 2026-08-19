import { EMAIL_BRAND, emailLogoSrc } from './email-brand.js';
import type { EmailLocale } from './email-locale.js';

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function emailHead(): string {
  const { panel, text, ink, onInkMuted, accentSoft, accent } = EMAIL_BRAND.colors;

  return `<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light only" />
    <style type="text/css">
      :root { color-scheme: light only; supported-color-schemes: light only; }
      body, .email-outer { background-color: ${accentSoft} !important; }
      .email-panel-cell { background-color: ${panel} !important; color: ${text} !important; }
      .email-panel-cell p,
      .email-panel-cell li,
      .email-panel-cell span,
      .email-panel-cell strong { color: ${text} !important; }
      .email-panel-muted { color: ${EMAIL_BRAND.colors.textSoft} !important; }
      .email-header-cell,
      .email-footer-cell { background-color: ${ink} !important; }
      .email-header-title { color: ${panel} !important; }
      .email-header-tagline,
      .email-footer-text { color: ${onInkMuted} !important; }
      a.email-link { color: ${accent} !important; }
    </style>
  </head>`;
}

export function emailLead(text: string): string {
  const { text: textColor } = EMAIL_BRAND.colors;
  return `<p style="margin:0 0 4px;font-size:17px;line-height:1.5;font-weight:600;color:${textColor};">${escapeHtml(text)}</p>`;
}

export function emailParagraph(text: string): string {
  const { text: textColor } = EMAIL_BRAND.colors;
  return `<p style="margin:0;font-size:15px;line-height:1.55;color:${textColor};">${escapeHtml(text)}</p>`;
}

export function emailMuted(text: string): string {
  const { textSoft } = EMAIL_BRAND.colors;
  return `<p class="email-panel-muted" style="margin:0;font-size:15px;line-height:1.55;color:${textSoft};">${escapeHtml(text)}</p>`;
}

export function emailSectionLabel(label: string): string {
  const { textSoft } = EMAIL_BRAND.colors;
  return `<p class="email-panel-muted" style="margin:24px 0 8px;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${textSoft};">${escapeHtml(label)}</p>`;
}

export function emailBulletList(items: string[]): string {
  const { text: textColor } = EMAIL_BRAND.colors;
  const itemsHtml = items
    .map(
      (item) =>
        `<li style="margin:0 0 8px;font-size:15px;line-height:1.5;color:${textColor};">${escapeHtml(item)}</li>`,
    )
    .join('');
  return `<ul style="margin:0;padding:0 0 0 20px;list-style:disc;">${itemsHtml}</ul>`;
}

export function emailNumberedList(items: string[]): string {
  const { text: textColor } = EMAIL_BRAND.colors;
  const itemsHtml = items
    .map(
      (item, index) =>
        `<li style="margin:0 0 10px;font-size:15px;line-height:1.5;color:${textColor};"><strong style="font-weight:600;">${index + 1}.</strong> ${escapeHtml(item)}</li>`,
    )
    .join('');
  return `<ol style="margin:0;padding:0 0 0 20px;list-style:none;">${itemsHtml}</ol>`;
}

export function ctaButton(label: string, href: string): string {
  const { accent, onAccent } = EMAIL_BRAND.colors;
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0 0;display:inline-table;">
    <tr>
      <td align="center" style="border-radius:6px;background-color:${accent};">
        <a href="${safeHref}" style="display:inline-block;padding:12px 20px;font-size:15px;font-weight:600;color:${onAccent};text-decoration:none;">${safeLabel}</a>
      </td>
    </tr>
  </table>`;
}

export function emailPlainLink(href: string, label?: string): string {
  const { accent } = EMAIL_BRAND.colors;
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label ?? href);
  return `<p style="margin:12px 0 0;font-size:14px;line-height:1.5;word-break:break-all;"><a class="email-link" href="${safeHref}" style="color:${accent};font-weight:600;text-decoration:underline;">${safeLabel}</a></p>`;
}

export function emailHeader(locale: EmailLocale): string {
  const logoSrc = emailLogoSrc();
  const tagline = EMAIL_BRAND.tagline[locale];
  const { ink, onInk, onInkMuted, accent, rule } = EMAIL_BRAND.colors;

  const logoHtml = logoSrc
    ? `<img src="${escapeHtml(logoSrc)}" alt="${escapeHtml(EMAIL_BRAND.logoAlt)}" width="56" height="56" style="display:block;border:0;outline:none;border-radius:12px;margin:0 auto;" />`
    : `<div style="width:56px;height:56px;border-radius:12px;background-color:${accent};margin:0 auto;"></div>`;

  return `<tr>
    <td class="email-header-cell" align="center" style="padding:28px 32px 24px;background-color:${ink};border-bottom:2px solid ${accent};border-radius:12px 12px 0 0;">
      ${logoHtml}
      <p class="email-header-title" style="margin:14px 0 0;font-size:18px;font-weight:600;color:${onInk};letter-spacing:-0.01em;">${escapeHtml(EMAIL_BRAND.productName)}</p>
      <p class="email-header-tagline" style="margin:6px 0 0;font-size:13px;line-height:1.4;color:${onInkMuted};letter-spacing:0.01em;">${escapeHtml(tagline)}</p>
      <div style="margin-top:16px;height:1px;background:${rule};"></div>
    </td>
  </tr>`;
}

export function emailFooter(locale: EmailLocale, footer: string): string {
  const { ink, onInkMuted } = EMAIL_BRAND.colors;
  const year = new Date().getFullYear();
  const rights =
    locale === 'pt'
      ? `© ${year} ${EMAIL_BRAND.productName}. Todos os direitos reservados.`
      : `© ${year} ${EMAIL_BRAND.productName}. All rights reserved.`;

  return `<tr>
    <td class="email-footer-cell" align="center" style="padding:20px 32px 28px;background-color:${ink};border-radius:0 0 12px 12px;">
      <p class="email-footer-text" style="margin:0 0 8px;font-size:12px;line-height:1.5;color:${onInkMuted};">${escapeHtml(footer)}</p>
      <p class="email-footer-text" style="margin:0;font-size:11px;line-height:1.5;color:${onInkMuted};">${escapeHtml(rights)}</p>
    </td>
  </tr>`;
}

export function wrapEmailDocument(locale: EmailLocale, panelHtml: string, footer: string): string {
  const { panel, text: textColor, accentSoft } = EMAIL_BRAND.colors;

  return `<!DOCTYPE html>
<html lang="${locale}">
  ${emailHead()}
  <body class="email-outer" style="margin:0;padding:0;background-color:${accentSoft};font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${textColor};">
    <table role="presentation" class="email-outer" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;background-color:${accentSoft};">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;">
            ${emailHeader(locale)}
            <tr>
              <td class="email-panel-cell" style="padding:32px;background-color:${panel};color:${textColor};">
                ${panelHtml}
              </td>
            </tr>
            ${emailFooter(locale, footer)}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
