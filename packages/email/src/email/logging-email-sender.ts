import type { EmailSendInput, EmailSendResult, EmailSender } from './email-sender.types.js';

export class LoggingEmailSender implements EmailSender {
  async send(input: EmailSendInput): Promise<EmailSendResult> {
    console.info('[email:logging]', {
      to: input.to,
      subject: input.subject,
      text: input.text,
      htmlLength: input.html?.length ?? 0,
    });
    return { ok: true, provider: 'logging', id: 'logging' };
  }
}
