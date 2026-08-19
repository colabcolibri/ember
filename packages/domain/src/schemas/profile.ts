import { z } from 'zod';

export const memberLanguageSchema = z.enum(['pt', 'en']);
export type MemberLanguage = z.infer<typeof memberLanguageSchema>;

export const profileInputSchema = z.object({
  timezone: z.string().min(1).max(64),
  languages: z.array(memberLanguageSchema).min(1).max(2),
});

export type ProfileInput = z.infer<typeof profileInputSchema>;

export const profileResponseSchema = profileInputSchema.extend({
  communityId: z.string(),
  userId: z.string(),
  updatedAt: z.string(),
});

export type ProfileResponse = z.infer<typeof profileResponseSchema>;
