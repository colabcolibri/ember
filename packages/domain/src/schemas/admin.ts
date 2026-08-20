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

const matchGroupSchema = z.object({
  memberIds: z.array(z.string()).min(2).max(4),
  slot: z.string().min(1),
  score: z.number().optional(),
});

export const publishGroupsSchema = z.object({
  groups: z.array(matchGroupSchema).min(1),
});

export type PublishGroupsInput = z.infer<typeof publishGroupsSchema>;

export const updateRoundSchema = createRoundSchema;

export type UpdateRoundInput = z.infer<typeof updateRoundSchema>;

/** Accepts groups (preferred) or legacy trios payload. */
export const publishMatchSchema = z
  .union([
    publishGroupsSchema,
    z.object({
      trios: z
        .array(
          z.object({
            memberIds: z.tuple([z.string(), z.string(), z.string()]),
            slot: z.string().min(1),
            score: z.number().optional(),
          }),
        )
        .min(1),
    }),
  ])
  .transform((payload) => {
    if ('groups' in payload) {
      return {
        groups: payload.groups.map((group) => ({
          ...group,
          score: group.score ?? 0,
        })),
      };
    }
    return {
      groups: payload.trios.map((trio) => ({
        memberIds: [...trio.memberIds],
        slot: trio.slot,
        score: trio.score ?? 0,
      })),
    };
  });

/** @deprecated use publishGroupsSchema or publishMatchSchema */
export const publishTriosSchema = publishGroupsSchema;

export type PublishTriosInput = PublishGroupsInput;
