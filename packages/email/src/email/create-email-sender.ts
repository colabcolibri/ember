import type { EmailProvider, EmailSender } from './email-sender.types.js';
import { LoggingEmailSender } from './logging-email-sender.js';
import { MisconfiguredEmailSender } from './misconfigured-email-sender.js';
import { NoopEmailSender } from './noop-email-sender.js';
import { ResendEmailSender } from './resend-email-sender.js';
import { SmtpEmailSender } from './smtp-email-sender.js';

let cachedSender: EmailSender | null = null;

function resolveProvider(): EmailProvider {
  const raw = process.env.EMBER_EMAIL_PROVIDER?.trim().toLowerCase();
  if (raw === 'logging' || raw === 'resend' || raw === 'smtp') {
    return raw;
  }
  return 'noop';
}

export function createEmailSenderFromEnv(): EmailSender {
  if (cachedSender) {
    return cachedSender;
  }

  const provider = resolveProvider();

  switch (provider) {
    case 'logging':
      cachedSender = new LoggingEmailSender();
      break;
    case 'resend': {
      const apiKey = process.env.RESEND_API_KEY?.trim();
      if (!apiKey) {
        cachedSender = new MisconfiguredEmailSender(
          'EMBER_EMAIL_PROVIDER=resend exige RESEND_API_KEY',
        );
        break;
      }
      cachedSender = new ResendEmailSender(apiKey);
      break;
    }
    case 'smtp':
      cachedSender = new SmtpEmailSender();
      break;
    case 'noop':
    default:
      cachedSender = new NoopEmailSender();
      break;
  }

  return cachedSender;
}

export function resetEmailSenderCacheForTests(): void {
  cachedSender = null;
}

export { resolveEmailFrom, resolveAppUrl } from './email-env.js';
