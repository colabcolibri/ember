export {
  sendTransactionalEmail,
  createEmailDeliveryContext,
  type EmailDeliveryRecord,
  type EmailSendResult,
} from './email-send.js';
export {
  createEmailSenderFromEnv,
  resetEmailSenderCacheForTests,
  resolveEmailFrom,
  resolveAppUrl,
} from './email/create-email-sender.js';
export { buildLoginCodeEmailContent } from './email/login-code-templates.js';
export { buildMagicLinkEmailContent, buildMagicLinkUrl } from './email/magic-link-templates.js';
export {
  buildCircleFormedEmailContent,
  buildCircleReminderEmailContent,
  buildRoundOpenEmailContent,
} from './email/circle-templates.js';
export { EMAIL_BRAND } from './email/email-brand.js';
export { recordSentEmail } from './record-sent-email.js';
export { countSentEmailsByKind, listSentEmails } from './sent-emails-db.js';
export type { EmailFileAttachment } from './email/email-sender.types.js';
export { requireEmailPepper } from './crypto/email-pepper.js';
