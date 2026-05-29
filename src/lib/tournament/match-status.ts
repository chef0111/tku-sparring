import { z } from 'zod';

export const MatchStatusSchema = z.enum(['pending', 'active', 'complete']);
export type MatchStatus = z.infer<typeof MatchStatusSchema>;

export const MATCH_STATUS_RANK: Record<MatchStatus, number> = {
  pending: 0,
  active: 1,
  complete: 2,
};
