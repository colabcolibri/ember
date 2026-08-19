import type { EmailSendInput, EmailSendResult, EmailSender } from './email-sender.types.js';

export class NoopEmailSender implements EmailSender {
  async send(input: EmailSendInput): Promise<EmailSendResult> {
    console.info('[email:noop]', {
      to: maskEmail(input.to),
      subject: input.subject,
      textLength: input.text.length,
    });
    return { ok: true, provider: 'noop', id: 'noop' };
  }
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) {
    return '***';
  }
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}
