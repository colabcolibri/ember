import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

import type { EmailSendInput, EmailSendResult, EmailSender } from './email-sender.types.js';
import { resolveEmailFrom } from './email-env.js';
import { resolveSmtpConfig, type SmtpConfig } from './smtp-config.js';

export function createSmtpTransport(config: SmtpConfig): Transporter {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    ...(config.user ? { auth: { user: config.user, pass: config.pass ?? '' } } : {}),
  });
}

export class SmtpEmailSender implements EmailSender {
  private readonly transport: Transporter;

  constructor(transport?: Transporter) {
    this.transport = transport ?? createSmtpTransport(resolveSmtpConfig());
  }

  async send(input: EmailSendInput): Promise<EmailSendResult> {
    const from = input.from?.trim() || resolveEmailFrom();

    try {
      const info = await this.transport.sendMail({
        from,
        to: input.to.trim(),
        subject: input.subject,
        text: input.text,
        ...(input.html ? { html: input.html } : {}),
        ...(input.replyTo ? { replyTo: input.replyTo } : {}),
        ...(input.attachments?.length
          ? {
              attachments: [
                ...input.attachments.map((attachment) => ({
                  filename: attachment.filename,
                  content: Buffer.from(attachment.content, 'base64'),
                  cid: attachment.content_id,
                  contentType: attachment.content_type,
                })),
                ...(input.files?.map((file) => ({
                  filename: file.filename,
                  content: file.content,
                  contentType: file.contentType,
                })) ?? []),
              ],
            }
          : input.files?.length
            ? {
                attachments: input.files.map((file) => ({
                  filename: file.filename,
                  content: file.content,
                  contentType: file.contentType,
                })),
              }
            : {}),
      });

      return { ok: true, provider: 'smtp', id: info.messageId };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { ok: false, provider: 'smtp', error: message.slice(0, 500) };
    }
  }
}
