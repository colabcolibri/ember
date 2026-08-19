import { z } from 'zod';

export const magicLinkRequestSchema = z.object({
  email: z.string().email().max(320),
  communitySlug: z.string().min(1).max(64).optional(),
});

export type MagicLinkRequest = z.infer<typeof magicLinkRequestSchema>;

export const presenceIntentionSchema = z.enum(['surprise', 'frontier', 'ease']);
export type PresenceIntention = z.infer<typeof presenceIntentionSchema>;

export const roundSlotSchema = z.enum(['mon-evening', 'wed-evening', 'sat-morning']);
export type RoundSlot = z.infer<typeof roundSlotSchema>;

export const presenceInputSchema = z.object({
  slots: z.array(roundSlotSchema).min(1).max(3),
  intention: presenceIntentionSchema,
});

export type PresenceInput = z.infer<typeof presenceInputSchema>;

export const ROUND_SLOTS: RoundSlot[] = ['mon-evening', 'wed-evening', 'sat-morning'];
