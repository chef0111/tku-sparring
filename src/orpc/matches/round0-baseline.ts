import { z } from 'zod';

export const ROUND0_BASELINE_VERSION = 1 as const;

const Round0BaselineSlotSchema = z.object({
  matchIndex: z.number().int(),
  redTournamentAthleteId: z.string().nullable(),
  blueTournamentAthleteId: z.string().nullable(),
  redAthleteId: z.string().nullable(),
  blueAthleteId: z.string().nullable(),
  redLocked: z.boolean(),
  blueLocked: z.boolean(),
});

export const Round0BaselineV1Schema = z.object({
  v: z.literal(ROUND0_BASELINE_VERSION),
  slots: z.array(Round0BaselineSlotSchema),
});

export type Round0BaselineV1 = z.infer<typeof Round0BaselineV1Schema>;
export type Round0BaselineSlotV1 = z.infer<typeof Round0BaselineSlotSchema>;

export function parseRound0Baseline(raw: unknown): Round0BaselineV1 | null {
  const r = Round0BaselineV1Schema.safeParse(raw);
  return r.success ? r.data : null;
}

export function buildRound0Baseline(
  rows: ReadonlyArray<{
    matchIndex: number;
    redTournamentAthleteId: string | null;
    blueTournamentAthleteId: string | null;
    redAthleteId: string | null;
    blueAthleteId: string | null;
    redLocked: boolean;
    blueLocked: boolean;
  }>
): Round0BaselineV1 {
  return {
    v: ROUND0_BASELINE_VERSION,
    slots: rows.map((m) => ({
      matchIndex: m.matchIndex,
      redTournamentAthleteId: m.redTournamentAthleteId,
      blueTournamentAthleteId: m.blueTournamentAthleteId,
      redAthleteId: m.redAthleteId,
      blueAthleteId: m.blueAthleteId,
      redLocked: m.redLocked,
      blueLocked: m.blueLocked,
    })),
  };
}
