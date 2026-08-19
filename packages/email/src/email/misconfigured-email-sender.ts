import type { EmailSendInput, EmailSendResult, EmailSender } from './email-sender.types.js';

export class MisconfiguredEmailSender implements EmailSender {
  private readonly reason: string;

  constructor(reason: string) {
    this.reason = reason;
  }

  async send(_input: EmailSendInput): Promise<EmailSendResult> {
    return { ok: false, provider: 'resend', error: this.reason };
  }
}
