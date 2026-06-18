import type { BracketLifecycleStore } from '@/server/application/matches/repositories/bracket-lifecycle';
import type { Prisma, PrismaClient } from '@/generated/prisma/client';
import type { Round0Baseline } from '@/server/domain/tournament/bracket/round0-baseline';
import { applyRound0ByeAdvancement } from '@/server/infrastructure/matches/progression';
import {
  clearAllGroupMatchRowsData,
  clearBracketUpperRoundData,
  round0ShuffleResetPatch,
  shuffleAthletePool,
} from '@/server/domain/tournament/bracket/helpers';
import {
  buildRound0Baseline,
  parseRound0Baseline,
} from '@/server/domain/tournament/bracket/round0-baseline';
import {
  nextPowerOfTwo,
  planBracketShell,
  planRound0Placements,
} from '@/server/domain/tournament/bracket/bracket-shape';
import { coalesceMatchRead } from '@/server/domain/tournament/match/match-read';
import { BadRequestError, NotFoundError } from '@/server/application/errors';
import { assertTournamentAction } from '@/server/application/policies/tournament-policy';
import {
  publishTournamentMutation,
  recordMutationActivity,
} from '@/server/infrastructure/mutation-effects';
import { prisma } from '@/lib/db';

type MatchBracketWriteDb = Pick<
  PrismaClient,
  'match' | 'tournamentAthlete' | 'group'
>;

type GroupBaselineRow = { round0Baseline?: unknown };

function mapBracketError(e: unknown): never {
  if (e instanceof BadRequestError || e instanceof NotFoundError) {
    throw e;
  }
  if (e instanceof Error) {
    throw new BadRequestError(e.message);
  }
  throw e;
}

async function loadGroupMatches(groupId: string) {
  const rows = await prisma.match.findMany({
    where: { groupId },
    orderBy: [{ round: 'asc' }, { matchIndex: 'asc' }],
  });
  return rows.map(coalesceMatchRead);
}

function groupUpdateRound0Baseline(
  db: MatchBracketWriteDb,
  groupId: string,
  baseline: ReturnType<typeof buildRound0Baseline> | null
) {
  return db.group.update({
    where: { id: groupId },
    data: { round0Baseline: baseline } as never,
  });
}

async function runBracketShufflePlacements(
  db: MatchBracketWriteDb,
  groupId: string,
  tournamentId: string
): Promise<void> {
  const allMatches = await db.match.findMany({
    where: { groupId, kind: 'bracket' },
    orderBy: [{ round: 'asc' }, { matchIndex: 'asc' }],
  });
  if (allMatches.length === 0) {
    throw new Error('No bracket yet. Generate a bracket first.');
  }

  const athletes = await db.tournamentAthlete.findMany({
    where: { groupId },
    orderBy: [{ beltLevel: 'desc' }, { weight: 'asc' }],
  });

  const round0 = allMatches.filter((m) => m.round === 0);
  round0.sort((a, b) => a.matchIndex - b.matchIndex);

  const bracketSizeFromTree = round0.length * 2;
  const bracketSize = nextPowerOfTwo(athletes.length);
  if (bracketSizeFromTree !== bracketSize) {
    throw new Error(
      'Bracket shell size does not match athlete count; regenerate the bracket.'
    );
  }

  await Promise.all([
    db.match.updateMany({
      where: { groupId, kind: 'custom' },
      data: clearAllGroupMatchRowsData(),
    }),
    db.match.updateMany({
      where: { groupId, kind: 'bracket', round: { gte: 1 } },
      data: clearBracketUpperRoundData(),
    }),
    ...round0.map((m) =>
      db.match.update({
        where: { id: m.id },
        data: round0ShuffleResetPatch(m),
      })
    ),
  ]);

  const round0Fresh = await db.match.findMany({
    where: { groupId, kind: 'bracket', round: 0 },
    orderBy: { matchIndex: 'asc' },
  });

  const lockedIdsFresh = new Set<string>();
  for (const m of round0Fresh) {
    if (m.redLocked && m.redTournamentAthleteId) {
      lockedIdsFresh.add(m.redTournamentAthleteId);
    }
    if (m.blueLocked && m.blueTournamentAthleteId) {
      lockedIdsFresh.add(m.blueTournamentAthleteId);
    }
  }

  const pool = athletes.filter((a) => !lockedIdsFresh.has(a.id));
  const shuffled = shuffleAthletePool(pool);

  const placementAthletes = athletes.map((a) => ({
    id: a.id,
    athleteProfileId: a.athleteProfileId,
  }));

  const round0ForPlan = round0Fresh.map((m) => ({
    id: m.id,
    matchIndex: m.matchIndex,
    redLocked: m.redLocked,
    blueLocked: m.blueLocked,
    redTournamentAthleteId: m.redTournamentAthleteId,
    blueTournamentAthleteId: m.blueTournamentAthleteId,
    redAthleteId: m.redAthleteId,
    blueAthleteId: m.blueAthleteId,
  }));

  const placementPlan = planRound0Placements({
    bracketSize,
    athletes: placementAthletes,
    round0Matches: round0ForPlan,
    shuffledAthletes: shuffled.map((a) => ({
      id: a.id,
      athleteProfileId: a.athleteProfileId,
    })),
  });

  await Promise.all(
    placementPlan.updates.map((update) =>
      db.match.update({
        where: { id: update.matchId },
        data: update.data,
      })
    )
  );

  const placedForBaseline = await db.match.findMany({
    where: { groupId, kind: 'bracket', round: 0 },
    orderBy: { matchIndex: 'asc' },
  });
  await groupUpdateRound0Baseline(
    db,
    groupId,
    buildRound0Baseline(placedForBaseline)
  );

  await applyRound0ByeAdvancement(groupId, tournamentId, db);
}

async function restoreBracketFromRound0Baseline(
  db: MatchBracketWriteDb,
  groupId: string,
  tournamentId: string,
  baseline: Round0Baseline
): Promise<void> {
  const slotsSorted = [...baseline.slots].sort(
    (a, b) => a.matchIndex - b.matchIndex
  );

  const allMatches = await db.match.findMany({
    where: { groupId, kind: 'bracket' },
    orderBy: [{ round: 'asc' }, { matchIndex: 'asc' }],
  });
  if (allMatches.length === 0) {
    throw new Error('No bracket yet. Generate a bracket first.');
  }

  const athletes = await db.tournamentAthlete.findMany({
    where: { groupId },
    orderBy: [{ beltLevel: 'desc' }, { weight: 'asc' }],
  });

  const round0 = allMatches.filter((m) => m.round === 0);
  round0.sort((a, b) => a.matchIndex - b.matchIndex);

  const bracketSizeFromTree = round0.length * 2;
  const bracketSize = nextPowerOfTwo(athletes.length);
  if (bracketSizeFromTree !== bracketSize) {
    throw new Error(
      'Bracket shell size does not match athlete count; regenerate the bracket.'
    );
  }

  if (slotsSorted.length !== round0.length) {
    throw new Error(
      'Saved bracket layout is out of date. Shuffle once to refresh it.'
    );
  }

  const athleteIds = new Set(athletes.map((a) => a.id));
  for (const s of slotsSorted) {
    if (!round0.some((r) => r.matchIndex === s.matchIndex)) {
      throw new Error(
        'Saved bracket layout is out of date. Shuffle once to refresh it.'
      );
    }
    for (const ta of [s.redTournamentAthleteId, s.blueTournamentAthleteId]) {
      if (ta != null && !athleteIds.has(ta)) {
        throw new Error(
          'Group athletes changed since the saved layout. Shuffle once to refresh it.'
        );
      }
    }
  }

  await Promise.all([
    db.match.updateMany({
      where: { groupId, kind: 'custom' },
      data: clearAllGroupMatchRowsData(),
    }),
    db.match.updateMany({
      where: { groupId, kind: 'bracket', round: { gte: 1 } },
      data: clearBracketUpperRoundData(),
    }),
    ...round0.map((m) =>
      db.match.update({
        where: { id: m.id },
        data: round0ShuffleResetPatch(m),
      })
    ),
  ]);

  await Promise.all(
    slotsSorted.map((s) => {
      const row = round0.find((r) => r.matchIndex === s.matchIndex)!;
      return db.match.update({
        where: { id: row.id },
        data: {
          redTournamentAthleteId: s.redTournamentAthleteId,
          blueTournamentAthleteId: s.blueTournamentAthleteId,
          redAthleteId: s.redAthleteId,
          blueAthleteId: s.blueAthleteId,
          redLocked: s.redLocked,
          blueLocked: s.blueLocked,
          redWins: 0,
          blueWins: 0,
          winnerId: null,
          tournamentWinnerId: null,
          status: 'pending',
        },
      });
    })
  );

  await applyRound0ByeAdvancement(groupId, tournamentId, db);
}

export const bracketLifecycleStore: BracketLifecycleStore = {
  async findGroup(groupId) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { tournament: { select: { status: true } } },
    });
    if (!group) return null;

    return {
      id: group.id,
      tournamentId: group.tournamentId,
      tournamentStatus: group.tournament.status,
      thirdPlaceMatch: group.thirdPlaceMatch,
      round0Baseline: (group as typeof group & GroupBaselineRow).round0Baseline,
    };
  },

  async countBracketMatches(groupId) {
    return prisma.match.count({
      where: { groupId, kind: 'bracket' },
    });
  },

  async generate(input) {
    const { command, group, activity } = input;

    try {
      const result = await prisma.$transaction(async (tx) => {
        const fresh = await tx.group.findUnique({
          where: { id: command.groupId },
          include: { tournament: { select: { status: true } } },
        });
        if (!fresh) throw new NotFoundError('Group not found');
        assertTournamentAction(fresh.tournament.status, 'bracket.generate');

        const existing = await tx.match.count({
          where: { groupId: command.groupId, kind: 'bracket' },
        });
        if (existing > 0) {
          throw new BadRequestError(
            'Matches already exist for this group. Use regenerate to recreate.'
          );
        }

        const athletes = await tx.tournamentAthlete.findMany({
          where: { groupId: command.groupId },
          orderBy: [{ beltLevel: 'desc' }, { weight: 'asc' }],
        });

        if (athletes.length < 2) {
          throw new BadRequestError(
            'At least 2 athletes are required to generate a bracket'
          );
        }

        const shell = planBracketShell({
          groupId: command.groupId,
          tournamentId: group.tournamentId,
          athleteCount: athletes.length,
          thirdPlaceMatch: fresh.thirdPlaceMatch,
        });

        await Promise.all(
          shell.matches.map((m) => tx.match.create({ data: m }))
        );

        await recordMutationActivity(
          {
            tournamentId: group.tournamentId,
            adminId: command.adminId,
            eventType: activity.eventType,
            entityType: 'group',
            entityId: command.groupId,
            payload: {
              athleteCount: athletes.length,
              bracketSize: shell.bracketSize,
              mode: 'shell',
            } as Prisma.InputJsonValue,
          },
          tx
        );

        return { tournamentId: group.tournamentId, groupId: command.groupId };
      });

      publishTournamentMutation(result.tournamentId);
      return loadGroupMatches(result.groupId);
    } catch (e) {
      mapBracketError(e);
    }
  },

  async shuffle(input) {
    const { command, group, activity } = input;

    try {
      const result = await prisma.$transaction(async (tx) => {
        const fresh = await tx.group.findUnique({
          where: { id: command.groupId },
          include: { tournament: { select: { status: true } } },
        });
        if (!fresh) throw new NotFoundError('Group not found');
        assertTournamentAction(fresh.tournament.status, 'bracket.shuffle');

        await runBracketShufflePlacements(
          tx,
          command.groupId,
          group.tournamentId
        );

        await recordMutationActivity(
          {
            tournamentId: group.tournamentId,
            adminId: command.adminId,
            eventType: activity.eventType,
            entityType: 'group',
            entityId: command.groupId,
            payload: activity.payload as Prisma.InputJsonValue | undefined,
          },
          tx
        );

        return { tournamentId: group.tournamentId, groupId: command.groupId };
      });

      publishTournamentMutation(result.tournamentId);
      return loadGroupMatches(result.groupId);
    } catch (e) {
      mapBracketError(e);
    }
  },

  async reset(input) {
    const { command, group, activity } = input;

    try {
      const result = await prisma.$transaction(async (tx) => {
        const fresh = await tx.group.findUnique({
          where: { id: command.groupId },
          include: { tournament: { select: { status: true } } },
        });
        if (!fresh) throw new NotFoundError('Group not found');
        assertTournamentAction(fresh.tournament.status, 'bracket.reset');

        const baseline = parseRound0Baseline(
          (fresh as typeof fresh & GroupBaselineRow).round0Baseline
        );
        if (!baseline) {
          throw new BadRequestError(
            'No saved bracket layout yet. Shuffle once to save a layout, then reset can restore it.'
          );
        }

        await restoreBracketFromRound0Baseline(
          tx,
          command.groupId,
          group.tournamentId,
          baseline
        );

        await recordMutationActivity(
          {
            tournamentId: group.tournamentId,
            adminId: command.adminId,
            eventType: activity.eventType,
            entityType: 'group',
            entityId: command.groupId,
            payload: activity.payload as Prisma.InputJsonValue | undefined,
          },
          tx
        );

        return { tournamentId: group.tournamentId, groupId: command.groupId };
      });

      publishTournamentMutation(result.tournamentId);
      return loadGroupMatches(result.groupId);
    } catch (e) {
      mapBracketError(e);
    }
  },

  async regenerate(input) {
    const { command, group, activity } = input;

    try {
      const result = await prisma.$transaction(async (tx) => {
        const fresh = await tx.group.findUnique({
          where: { id: command.groupId },
          include: { tournament: { select: { status: true } } },
        });
        if (!fresh) throw new NotFoundError('Group not found');
        assertTournamentAction(fresh.tournament.status, 'bracket.regenerate');

        await tx.match.updateMany({
          where: { groupId: command.groupId },
          data: clearAllGroupMatchRowsData(),
        });
        await tx.match.deleteMany({ where: { groupId: command.groupId } });

        const athletes = await tx.tournamentAthlete.findMany({
          where: { groupId: command.groupId },
          orderBy: [{ beltLevel: 'desc' }, { weight: 'asc' }],
        });
        if (athletes.length < 2) {
          throw new BadRequestError(
            'At least 2 athletes are required to generate a bracket'
          );
        }

        const shell = planBracketShell({
          groupId: command.groupId,
          tournamentId: group.tournamentId,
          athleteCount: athletes.length,
          thirdPlaceMatch: fresh.thirdPlaceMatch,
        });

        await Promise.all(
          shell.matches.map((row) => tx.match.create({ data: row }))
        );

        await groupUpdateRound0Baseline(tx, command.groupId, null);

        await recordMutationActivity(
          {
            tournamentId: group.tournamentId,
            adminId: command.adminId,
            eventType: activity.eventType,
            entityType: 'group',
            entityId: command.groupId,
            payload: activity.payload as Prisma.InputJsonValue | undefined,
          },
          tx
        );

        return { tournamentId: group.tournamentId, groupId: command.groupId };
      });

      publishTournamentMutation(result.tournamentId);
      return loadGroupMatches(result.groupId);
    } catch (e) {
      mapBracketError(e);
    }
  },
};
