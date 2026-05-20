import { describe, expect, it } from 'vitest';

import { advanceWinner } from '../match-progression';
import type { ProgressionDb } from '../match-progression';
import { getScoreTransition } from '@/lib/tournament/match-transition';
import { getSuccessorSlot } from '@/lib/tournament/bracket-progression';
import { planBracketShell } from '@/lib/tournament/bracket-shape';

type MatchRow = {
  id: string;
  kind: string;
  groupId: string;
  tournamentId: string;
  round: number;
  matchIndex: number;
  status: string;
  bestOf: number;
  redWins: number;
  blueWins: number;
  redTournamentAthleteId: string | null;
  blueTournamentAthleteId: string | null;
  redAthleteId: string | null;
  blueAthleteId: string | null;
  winnerId: string | null;
  winnerTournamentAthleteId: string | null;
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

  const db: ProgressionDb = {
    match: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        matches.get(where.id) ?? null,
      findFirst: async ({
        where,
      }: {
        where: {
          groupId: string;
          round: number;
          matchIndex: number;
        };
      }) => {
        for (const m of matches.values()) {
          if (
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
        const row = matches.get(where.id);
        if (!row) throw new Error('missing');
        Object.assign(row, data);
        return row;
      },
    },
    tournamentAthlete: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        athletes.get(where.id) ?? null,
    },
  };

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
  if (
    transition.data.status === 'complete' &&
    transition.advanceWinnerTournamentAthleteId
  ) {
    await advanceWinner(
      match.id,
      transition.advanceWinnerTournamentAthleteId,
      db
    );
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
      bestOf: 3,
      redWins: 0,
      blueWins: 0,
      redTournamentAthleteId: null,
      blueTournamentAthleteId: null,
      redAthleteId: null,
      blueAthleteId: null,
      winnerId: null,
      winnerTournamentAthleteId: null,
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
    expect(r0m0.winnerTournamentAthleteId).toBe('ta-red');
    expect(next.redTournamentAthleteId).toBe('ta-red');
    expect(next.redAthleteId).toBe('ap-red');
  });
});
