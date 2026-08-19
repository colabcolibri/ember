export type EmailInlineAttachment = {
  filename: string;
  content: string;
  content_id: string;
  content_type: string;
};

export type EmailFileAttachment = {
  filename: string;
  content: string;
  contentType: string;
};

export interface EmailSendInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
  replyTo?: string;
  attachments?: EmailInlineAttachment[];
  files?: EmailFileAttachment[];
}

export interface EmailSendResult {
  ok: boolean;
  provider: EmailProvider;
  id?: string;
  error?: string;
}

export interface EmailSender {
  send(input: EmailSendInput): Promise<EmailSendResult>;
}

export type EmailProvider = 'noop' | 'logging' | 'resend' | 'smtp';
