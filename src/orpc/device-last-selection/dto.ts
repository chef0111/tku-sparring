import { z } from 'zod';

export const GetLastSelectionSchema = z.object({
  deviceId: z.string().min(1),
});

export const SetLastSelectionSchema = z.object({
  deviceId: z.string().min(1),
  tournamentId: z.string().nullable().optional(),
  groupId: z.string().nullable().optional(),
  matchId: z.string().nullable().optional(),
});

export type GetLastSelectionDTO = z.infer<typeof GetLastSelectionSchema>;
export type SetLastSelectionDTO = z.infer<typeof SetLastSelectionSchema>;
