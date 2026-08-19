import { z } from 'zod';

export const attendanceInputSchema = z.object({
  happened: z.boolean(),
});

export type AttendanceInput = z.infer<typeof attendanceInputSchema>;
