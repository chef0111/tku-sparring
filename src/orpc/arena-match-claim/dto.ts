import { z } from 'zod';

export const ClaimMatchSchema = z.object({
  matchId: z.string().min(1),
  groupId: z.string().min(1),
  tournamentId: z.string().min(1),
  deviceId: z.string().min(1),
});

export const ReleaseMatchClaimSchema = z.object({
  matchId: z.string().min(1),
  deviceId: z.string().min(1),
});

export type ClaimMatchDTO = z.infer<typeof ClaimMatchSchema>;
export type ReleaseMatchClaimDTO = z.infer<typeof ReleaseMatchClaimSchema>;
