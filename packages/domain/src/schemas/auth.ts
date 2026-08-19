import { z } from 'zod';
import { regionalSlotRefSchema } from './slot-calendar.js';

export const loginCodeRequestSchema = z.object({
  email: z.string().email().max(320),
  communitySlug: z.string().min(1).max(64).optional(),
});

export type LoginCodeRequest = z.infer<typeof loginCodeRequestSchema>;

export const loginCodeVerifySchema = z.object({
  email: z.string().email().max(320),
  code: z.string().regex(/^\d{6}$/, 'Código deve ter 6 dígitos'),
});

export type LoginCodeVerify = z.infer<typeof loginCodeVerifySchema>;

/** @deprecated use loginCodeRequestSchema */
export const magicLinkRequestSchema = loginCodeRequestSchema;
export type MagicLinkRequest = LoginCodeRequest;

export const presenceIntentionSchema = z.enum(['surprise', 'frontier', 'ease']);
export type PresenceIntention = z.infer<typeof presenceIntentionSchema>;

export const roundSlotSchema = z.enum(['mon-evening', 'wed-evening', 'sat-morning']);
export type RoundSlot = z.infer<typeof roundSlotSchema>;

const presenceSlotSchema = z.union([roundSlotSchema, regionalSlotRefSchema]);

export const presenceInputSchema = z.object({
  slots: z.array(presenceSlotSchema).min(1).max(10),
  intention: presenceIntentionSchema,
  timezone: z.string().trim().min(1).max(64).optional(),
});

export type PresenceInput = z.infer<typeof presenceInputSchema>;

export const ROUND_SLOTS: RoundSlot[] = ['mon-evening', 'wed-evening', 'sat-morning'];

/** Mapa legado membro → slot facilitador (compatibilidade). */
export const SLOT_COMPAT: Record<RoundSlot, string> = {
  'mon-evening': 'mon-19h',
  'wed-evening': 'wed-19h',
  'sat-morning': 'sat-10h',
};
