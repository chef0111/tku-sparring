import { z } from 'zod';
import { MatchStatusSchema } from '@/lib/tournament/match-status';

export {
  MatchStatusSchema,
  type MatchStatus as MatchStatusDTO,
} from '@/lib/tournament/match-status';

export const MatchKindSchema = z.enum(['bracket', 'custom']);

export const MatchSchema = z.object({
  id: z.string(),
  kind: MatchKindSchema,
  displayLabel: z.string().nullable(),
  round: z.number().int(),
  matchIndex: z.number().int(),
  status: MatchStatusSchema,
  redAthleteId: z.string().nullable(),
  blueAthleteId: z.string().nullable(),
  redTournamentAthleteId: z.string().nullable(),
  blueTournamentAthleteId: z.string().nullable(),
  redWins: z.number().int(),
  blueWins: z.number().int(),
  winnerId: z.string().nullable(),
  tournamentWinnerId: z.string().nullable(),
  redLocked: z.boolean(),
  blueLocked: z.boolean(),
  cornersSwapped: z.boolean(),
  groupId: z.string(),
  tournamentId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const UpdateScoreSchema = z.object({
  matchId: z.string(),
  redWins: z.number().int().min(0).max(2),
  blueWins: z.number().int().min(0).max(2),
});

export const SetWinnerSchema = z.object({
  matchId: z.string(),
  winnerSide: z.enum(['red', 'blue']),
  reason: z.string().optional(),
});

export const SwapParticipantsSchema = z.object({
  matchId: z.string(),
  redTournamentAthleteId: z.string().nullable(),
  blueTournamentAthleteId: z.string().nullable(),
});

export const SetLockSchema = z.object({
  matchId: z.string(),
  side: z.enum(['red', 'blue']),
  locked: z.boolean(),
});

export const GenerateBracketSchema = z.object({
  groupId: z.string(),
});

export const ShuffleBracketSchema = z.object({
  groupId: z.string(),
});

export const RegenerateBracketSchema = z.object({
  groupId: z.string(),
});

export const ResetBracketSchema = z.object({
  groupId: z.string(),
});

export const AdminSetMatchStatusSchema = z.object({
  matchId: z.string(),
  status: MatchStatusSchema,
});

export const AssignSlotSchema = z.object({
  matchId: z.string(),
  side: z.enum(['red', 'blue']),
  tournamentAthleteId: z.string().nullable(),
});

export const SwapSlotsSchema = z.object({
  matchAId: z.string(),
  sideA: z.enum(['red', 'blue']),
  matchBId: z.string(),
  sideB: z.enum(['red', 'blue']),
});

export const CustomSlotSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('direct'),
    tournamentAthleteId: z.string(),
  }),
  z.object({ mode: z.literal('winner'), feederMatchId: z.string() }),
  z.object({ mode: z.literal('loser'), feederMatchId: z.string() }),
]);

export const CreateCustomMatchSchema = z.object({
  groupId: z.string(),
  displayLabel: z.string().trim().min(1).max(120),
  red: CustomSlotSchema,
  blue: CustomSlotSchema,
});

export type MatchDTO = z.infer<typeof MatchSchema>;
export type UpdateScoreDTO = z.infer<typeof UpdateScoreSchema>;
export type SetWinnerDTO = z.infer<typeof SetWinnerSchema>;
export type SwapParticipantsDTO = z.infer<typeof SwapParticipantsSchema>;
export type SetLockDTO = z.infer<typeof SetLockSchema>;
export type GenerateBracketDTO = z.infer<typeof GenerateBracketSchema>;
export type ShuffleBracketDTO = z.infer<typeof ShuffleBracketSchema>;
export type RegenerateBracketDTO = z.infer<typeof RegenerateBracketSchema>;
export type ResetBracketDTO = z.infer<typeof ResetBracketSchema>;
export type AdminSetMatchStatusDTO = z.infer<typeof AdminSetMatchStatusSchema>;
export type AssignSlotDTO = z.infer<typeof AssignSlotSchema>;
export type SwapSlotsDTO = z.infer<typeof SwapSlotsSchema>;
export type CustomSlotDTO = z.infer<typeof CustomSlotSchema>;
export type CreateCustomMatchDTO = z.infer<typeof CreateCustomMatchSchema>;
