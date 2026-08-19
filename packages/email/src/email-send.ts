import type Database from 'better-sqlite3';
import { ensureDatabaseReady } from '@ember/db';
import { requireEmailPepper } from './crypto/email-pepper.js';
import type { EmailSendResult } from './email/email-sender.types.js';
import { createEmailSenderFromEnv, resolveEmailFrom } from './email/create-email-sender.js';
import { emailLogoAttachments } from './email/email-brand.js';
import { recordSentEmail } from './record-sent-email.js';

import type { EmailFileAttachment } from './email/email-sender.types.js';

export type { EmailFileAttachment, EmailSendResult };

export type EmailDeliveryRecord = {
  db: Database.Database;
  pepper: string;
  kind: string;
  meta?: Record<string, string>;
};

export async function sendTransactionalEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  delivery?: EmailDeliveryRecord;
  meta?: Record<string, string>;
  files?: EmailFileAttachment[];
}): Promise<EmailSendResult> {
  const sender = createEmailSenderFromEnv();
  const result = await sender.send({
    to: input.to.trim().toLowerCase(),
    from: resolveEmailFrom(),
    subject: input.subject,
    text: input.text,
    html: input.html,
    replyTo: input.replyTo,
    attachments: emailLogoAttachments(),
    files: input.files,
  });

  if (result.ok) {
    if (input.delivery) {
      recordSentEmail(input.delivery.db, {
        email: input.to,
        pepper: input.delivery.pepper,
        kind: input.delivery.kind,
        subject: input.subject,
        provider: result.provider,
        html: input.html,
        text: input.text,
        meta: {
          ...input.delivery.meta,
          ...input.meta,
        },
      });
    }

    console.info('[email] sent', {
      provider: result.provider,
      kind: input.delivery?.kind ?? null,
      emailDomain: input.to.split('@')[1] ?? 'unknown',
    });
    return result;
  }

  console.error('[email] send failed', {
    provider: result.provider,
    kind: input.delivery?.kind ?? null,
    emailDomain: input.to.split('@')[1] ?? 'unknown',
    error: result.error,
  });
  return result;
}

export function createEmailDeliveryContext(input: {
  kind: string;
  meta?: Record<string, string>;
  db?: Database.Database;
  pepper?: string;
}): EmailDeliveryRecord {
  return {
    db: input.db ?? ensureDatabaseReady(),
    pepper: input.pepper ?? requireEmailPepper(),
    kind: input.kind,
    meta: input.meta,
  };
}
