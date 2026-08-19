import { EMAIL_BRAND, emailLogoSrc } from './email-brand.js';
import type { EmailLocale } from './email-locale.js';

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function ctaButton(label: string, href: string): string {
  const { accent, onAccent } = EMAIL_BRAND.colors;
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0 0;display:inline-table;">
    <tr>
      <td align="center" style="border-radius:6px;background:${accent};">
        <a href="${safeHref}" style="display:inline-block;padding:12px 20px;font-size:15px;font-weight:600;color:${onAccent};text-decoration:none;">${safeLabel}</a>
      </td>
    </tr>
  </table>`;
}

export function emailPlainLink(href: string, label?: string): string {
  const { accent } = EMAIL_BRAND.colors;
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label ?? href);
  return `<p style="margin:12px 0 0;font-size:14px;line-height:1.5;word-break:break-all;"><a href="${safeHref}" style="color:${accent};font-weight:600;text-decoration:underline;">${safeLabel}</a></p>`;
}

export function emailHeader(locale: EmailLocale): string {
  const logoSrc = emailLogoSrc();
  const tagline = EMAIL_BRAND.tagline[locale];
  const { ink, textSoft, accent, rule, panel } = EMAIL_BRAND.colors;

  const logoHtml = logoSrc
    ? `<img src="${escapeHtml(logoSrc)}" alt="${escapeHtml(EMAIL_BRAND.logoAlt)}" width="56" height="56" style="display:block;border:0;outline:none;border-radius:12px;" />`
    : `<div style="width:56px;height:56px;border-radius:12px;background:${accent};margin:0 auto;"></div>`;

  return `<tr>
    <td align="center" style="padding:28px 32px 24px;background:${ink};border-bottom:2px solid ${accent};border-radius:12px 12px 0 0;">
      ${logoHtml}
      <p style="margin:14px 0 0;font-size:18px;font-weight:600;color:${panel};letter-spacing:-0.01em;">${escapeHtml(EMAIL_BRAND.productName)}</p>
      <p style="margin:6px 0 0;font-size:13px;line-height:1.4;color:${textSoft};letter-spacing:0.01em;">${escapeHtml(tagline)}</p>
      <div style="margin-top:16px;height:1px;background:${rule};"></div>
    </td>
  </tr>`;
}

export function emailFooter(locale: EmailLocale, footer: string): string {
  const { ink, muted } = EMAIL_BRAND.colors;
  const year = new Date().getFullYear();
  const rights =
    locale === 'pt'
      ? `© ${year} ${EMAIL_BRAND.productName}. Todos os direitos reservados.`
      : `© ${year} ${EMAIL_BRAND.productName}. All rights reserved.`;

  return `<tr>
    <td align="center" style="padding:20px 32px 28px;background:${ink};border-radius:0 0 12px 12px;">
      <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:${muted};">${escapeHtml(footer)}</p>
      <p style="margin:0;font-size:11px;line-height:1.5;color:${muted};">${escapeHtml(rights)}</p>
    </td>
  </tr>`;
}

export function wrapEmailDocument(locale: EmailLocale, panelHtml: string, footer: string): string {
  const { panel, text: textColor, accentSoft } = EMAIL_BRAND.colors;

  return `<!DOCTYPE html>
<html lang="${locale}">
  <body style="margin:0;padding:0;background:${accentSoft};font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${textColor};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;">
            ${emailHeader(locale)}
            <tr>
              <td style="padding:32px;background:${panel};">
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
