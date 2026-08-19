import { z } from 'zod';
import { regionalSlotRefSchema } from './slot-calendar.js';
import { roundDateTimeSlotInputSchema } from '../meeting/round-slots.js';

export const FACILITATOR_ROUND_SLOTS = [
  'mon-19h',
  'tue-19h',
  'wed-19h',
  'thu-19h',
  'sat-10h',
] as const;

export type FacilitatorRoundSlot = (typeof FACILITATOR_ROUND_SLOTS)[number];

const legacySlotSchema = z.enum(FACILITATOR_ROUND_SLOTS);
const roundSlotSelectionSchema = z.union([
  legacySlotSchema,
  regionalSlotRefSchema,
  roundDateTimeSlotInputSchema,
]);

export const createRoundSchema = z.object({
  theme: z.string().trim().min(3).max(200),
  questions: z.array(z.string().trim().min(3).max(500)).min(1).max(8),
  slots: z.array(roundSlotSelectionSchema).min(1).max(20),
  templateId: z.string().optional(),
});

export type CreateRoundInput = z.infer<typeof createRoundSchema>;

export const meetingTemplateSchema = z.object({
  name: z.string().min(1).max(120),
  circleSize: z.number().int().min(3).max(5),
  durationMinutes: z.number().int().min(15).max(90),
});

export type MeetingTemplateInput = z.infer<typeof meetingTemplateSchema>;

export const publishTriosSchema = z.object({
  trios: z
    .array(
      z.object({
        memberIds: z.tuple([z.string(), z.string(), z.string()]),
        slot: z.string().min(1),
        score: z.number().optional(),
      }),
    )
    .min(1),
});

export type PublishTriosInput = z.infer<typeof publishTriosSchema>;
