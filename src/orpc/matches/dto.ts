import { z } from 'zod';

export const MatchStatusSchema = z.enum(['pending', 'active', 'complete']);

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
  winnerTournamentAthleteId: z.string().nullable(),
  redLocked: z.boolean(),
  blueLocked: z.boolean(),
  groupId: z.string(),
  tournamentId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateMatchSchema = z.object({
  kind: MatchKindSchema.default('bracket'),
  displayLabel: z.string().nullable().optional(),
  round: z.number().int().default(0),
  matchIndex: z.number().int().default(0),
  status: MatchStatusSchema.default('pending'),
  redAthleteId: z.string().nullable().optional(),
  blueAthleteId: z.string().nullable().optional(),
  redTournamentAthleteId: z.string().nullable().optional(),
  blueTournamentAthleteId: z.string().nullable().optional(),
  redLocked: z.boolean().default(false),
  blueLocked: z.boolean().default(false),
  groupId: z.string(),
  tournamentId: z.string(),
});

export const UpdateMatchSchema = z.object({
  id: z.string(),
  kind: MatchKindSchema.optional(),
  displayLabel: z.string().nullable().optional(),
  status: MatchStatusSchema.optional(),
  redWins: z.number().int().optional(),
  blueWins: z.number().int().optional(),
  winnerId: z.string().nullable().optional(),
  winnerTournamentAthleteId: z.string().nullable().optional(),
  redTournamentAthleteId: z.string().nullable().optional(),
  blueTournamentAthleteId: z.string().nullable().optional(),
  redAthleteId: z.string().nullable().optional(),
  blueAthleteId: z.string().nullable().optional(),
  redLocked: z.boolean().optional(),
  blueLocked: z.boolean().optional(),
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
  displayLabel: z.string().min(1).max(120),
  red: CustomSlotSchema,
  blue: CustomSlotSchema,
});

export type MatchStatusDTO = z.infer<typeof MatchStatusSchema>;
export type MatchDTO = z.infer<typeof MatchSchema>;
export type CreateMatchDTO = z.infer<typeof CreateMatchSchema>;
export type UpdateMatchDTO = z.infer<typeof UpdateMatchSchema>;
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
