import { describe, expect, it } from 'vitest';

import { advanceWinner } from 'src/server/infrastructure/matches/progression';
import type { ProgressionDb } from 'src/server/infrastructure/matches/progression';
import { getScoreTransition } from '@/lib/tournament/match/match-transition';
import { getSuccessorSlot } from '@/lib/tournament/bracket/bracket-progression';
import { planBracketShell } from '@/server/domain/tournament/bracket/bracket-shape';

type MatchRow = {
  id: string;
  kind: string;
  groupId: string;
  tournamentId: string;
  round: number;
  matchIndex: number;
  status: string;
  redWins: number;
  blueWins: number;
  redTournamentAthleteId: string | null;
  blueTournamentAthleteId: string | null;
  redAthleteId: string | null;
  blueAthleteId: string | null;
  winnerId: string | null;
  tournamentWinnerId: string | null;
};

function createInMemoryDb(initial: Array<MatchRow>) {
  const matches = new Map(initial.map((m) => [m.id, { ...m }]));
  const athletes = new Map(
    initial.flatMap((m) => {
      const out: Array<
        [string, { id: string; athleteProfileId: string | null }]
      > = [];
      if (m.redTournamentAthleteId) {
        out.push([
          m.redTournamentAthleteId,
          { id: m.redTournamentAthleteId, athleteProfileId: m.redAthleteId },
        ]);
      }
      if (m.blueTournamentAthleteId) {
        out.push([
          m.blueTournamentAthleteId,
          {
            id: m.blueTournamentAthleteId,
            athleteProfileId: m.blueAthleteId,
          },
        ]);
      }
      return out;
    })
  );

  const db = {
    match: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        (await matches.get(where.id)) ?? null,
      findFirst: async ({
        where,
      }: {
        where: {
          kind?: string;
          groupId: string;
          round: number;
          matchIndex: number;
        };
      }) => {
        for (const m of await matches.values()) {
          if (
            (where.kind == null || m.kind === where.kind) &&
            m.groupId === where.groupId &&
            m.round === where.round &&
            m.matchIndex === where.matchIndex
          ) {
            return m;
          }
        }
        return null;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<MatchRow>;
      }) => {
        const row = await matches.get(where.id);
        if (!row) throw new Error('missing');
        Object.assign(row, data);
        return row;
      },
    },
    tournamentAthlete: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        (await athletes.get(where.id)) ?? null,
    },
  } as unknown as ProgressionDb;

  return { db, matches };
}

async function simulateUpdateScore(
  db: ProgressionDb,
  match: MatchRow,
  redWins: number,
  blueWins: number
) {
  const transition = getScoreTransition({ match, redWins, blueWins });
  Object.assign(match, transition.data);
  if (transition.data.status === 'complete' && transition.advancedWinnerId) {
    await advanceWinner(match.id, transition.advancedWinnerId, db);
  }
}

describe('bracket score progression integration', () => {
  it('advances round-0 winner into round-1 red slot for a 4-athlete shell', async () => {
    const shell = planBracketShell({
      groupId: 'g1',
      tournamentId: 't1',
      athleteCount: 4,
      thirdPlaceMatch: false,
    });

    const rows: Array<MatchRow> = shell.matches.map((m, i) => ({
      id: `m-${m.round}-${m.matchIndex}`,
      kind: 'bracket',
      groupId: m.groupId,
      tournamentId: m.tournamentId,
      round: m.round,
      matchIndex: m.matchIndex,
      status: 'pending',
      redWins: 0,
      blueWins: 0,
      redTournamentAthleteId: null,
      blueTournamentAthleteId: null,
      redAthleteId: null,
      blueAthleteId: null,
      winnerId: null,
      tournamentWinnerId: null,
      ...(i === 0
        ? {
            redTournamentAthleteId: 'ta-red',
            blueTournamentAthleteId: 'ta-blue',
            redAthleteId: 'ap-red',
            blueAthleteId: 'ap-blue',
          }
        : i === 1
          ? {
              redTournamentAthleteId: 'ta-c',
              blueTournamentAthleteId: 'ta-d',
              redAthleteId: 'ap-c',
              blueAthleteId: 'ap-d',
            }
          : {}),
    }));

    const { db, matches } = createInMemoryDb(rows);
    const r0m0 = matches.get('m-0-0')!;

    await simulateUpdateScore(db, r0m0, 2, 0);

    const successor = getSuccessorSlot({ round: 0, matchIndex: 0 });
    const next = [...matches.values()].find(
      (m) =>
        m.round === successor.round && m.matchIndex === successor.matchIndex
    )!;

    expect(r0m0.status).toBe('complete');
    expect(r0m0.tournamentWinnerId).toBe('ta-red');
    expect(next.redTournamentAthleteId).toBe('ta-red');
    expect(next.redAthleteId).toBe('ap-red');
  });
});
