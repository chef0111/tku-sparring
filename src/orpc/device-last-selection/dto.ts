import { z } from 'zod';

/** Treat `''` like missing so DB + DAL never see empty FK strings. */
const optionalNullableId = z
  .string()
  .nullable()
  .optional()
  .transform((v) => (v == null || v.trim() === '' ? null : v));

export const GetLastSelectionSchema = z.object({
  deviceId: z.string().min(1),
});

export const SetLastSelectionSchema = z.object({
  deviceId: z.string().min(1),
  tournamentId: optionalNullableId,
  groupId: optionalNullableId,
  matchId: optionalNullableId,
});

export type GetLastSelectionDTO = z.infer<typeof GetLastSelectionSchema>;
export type SetLastSelectionDTO = z.infer<typeof SetLastSelectionSchema>;
