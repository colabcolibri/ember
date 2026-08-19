import { z } from 'zod';

export const memberLanguageSchema = z.enum(['pt', 'en']);
export type MemberLanguage = z.infer<typeof memberLanguageSchema>;

const currentYear = new Date().getFullYear();

export const profileInputSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  editionYear: z.number().int().min(1990).max(currentYear),
  timezone: z.string().min(1).max(64),
  languages: z.array(memberLanguageSchema).min(1).max(2),
});

export type ProfileInput = z.infer<typeof profileInputSchema>;

export const profileResponseSchema = z.object({
  communityId: z.string(),
  userId: z.string(),
  displayName: z.string(),
  editionYear: z.number().int().nullable(),
  timezone: z.string(),
  languages: z.array(memberLanguageSchema),
  updatedAt: z.string().nullable(),
});

export type ProfileResponse = z.infer<typeof profileResponseSchema>;
