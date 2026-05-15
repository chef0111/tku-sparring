import { z } from 'zod';

export const ClaimMatchSchema = z.object({
  matchId: z.string().min(1),
  groupId: z.string().min(1),
  tournamentId: z.string().min(1),
  deviceId: z.string().min(1),
});

export const MatchClaimHeartbeatSchema = z.object({
  matchId: z.string().min(1),
  deviceId: z.string().min(1),
});

export const ReleaseMatchClaimSchema = MatchClaimHeartbeatSchema;

export type ClaimMatchDTO = z.infer<typeof ClaimMatchSchema>;
export type MatchClaimHeartbeatDTO = z.infer<typeof MatchClaimHeartbeatSchema>;
export type ReleaseMatchClaimDTO = z.infer<typeof ReleaseMatchClaimSchema>;
