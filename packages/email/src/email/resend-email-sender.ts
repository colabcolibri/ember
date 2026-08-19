import type { EmailSendInput, EmailSendResult, EmailSender } from './email-sender.types.js';
import { resolveEmailFrom } from './email-env.js';

export class ResendEmailSender implements EmailSender {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async send(input: EmailSendInput): Promise<EmailSendResult> {
    const from = input.from?.trim() || resolveEmailFrom();
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [input.to.trim()],
        subject: input.subject,
        text: input.text,
        ...(input.html ? { html: input.html } : {}),
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
        ...(input.attachments?.length ? { attachments: input.attachments } : {}),
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      return { ok: false, provider: 'resend', error: error.slice(0, 500) };
    }

    const payload = (await res.json()) as { id?: string };
    return { ok: true, provider: 'resend', id: payload.id };
  }
}
