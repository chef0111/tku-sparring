import { applyRound0ByeAdvancement } from '../match-progression';
import { findMatchesByGroupId } from '../match-read';
import {
  clearAllGroupMatchRowsData,
  clearBracketUpperRoundData,
  round0ShuffleResetPatch,
  shuffleAthletePool,
} from './bracket-helpers';
import { buildRound0Baseline, parseRound0Baseline } from './round0-baseline';
import type { Round0Baseline } from './round0-baseline';
import type { GenerateBracketDTO } from '../dto';
import type { PrismaClient } from '@/generated/prisma/client';
import {
  nextPowerOfTwo,
  planBracketShell,
  planRound0Placements,
} from '@/lib/tournament/bracket-shape';
import { recordTournamentActivity } from '@/orpc/activity/dal';
import { prisma } from '@/lib/db';

type MatchBracketWriteDb = Pick<
  PrismaClient,
  'match' | 'tournamentAthlete' | 'group'
>;

type GroupBaselineRow = { round0Baseline?: unknown };

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

/**
 * Re-seeds round 0 from a shuffled athlete pool, clears higher-round progression,
 * then applies round-0 bye advancement. Used by shuffle only.
 *
 * Persists {@link buildRound0Baseline} on the group after placements (pre-bye) so
 * {@link resetBracket} can restore that layout without reshuffling.
 */
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

export async function generateBracket(
  input: GenerateBracketDTO,
  adminId: string,
  options?: { skipActivity?: boolean }
) {
  const group = await prisma.group.findUnique({
    where: { id: input.groupId },
    include: { tournament: { select: { id: true, status: true } } },
  });
  if (!group) throw new Error('Group not found');
  if (group.tournament.status !== 'draft') {
    throw new Error('Brackets can only be generated in Draft status');
  }

  const existing = await prisma.match.count({
    where: { groupId: input.groupId, kind: 'bracket' },
  });
  if (existing > 0) {
    throw new Error(
      'Matches already exist for this group. Use regenerate to recreate.'
    );
  }

  const athletes = await prisma.tournamentAthlete.findMany({
    where: { groupId: input.groupId },
    orderBy: [{ beltLevel: 'desc' }, { weight: 'asc' }],
  });

  if (athletes.length < 2) {
    throw new Error('At least 2 athletes are required to generate a bracket');
  }

  const shell = planBracketShell({
    groupId: input.groupId,
    tournamentId: group.tournamentId,
    athleteCount: athletes.length,
    thirdPlaceMatch: group.thirdPlaceMatch,
  });

  await Promise.all(shell.matches.map((m) => prisma.match.create({ data: m })));

  if (!options?.skipActivity) {
    await recordTournamentActivity({
      tournamentId: group.tournamentId,
      adminId,
      eventType: 'bracket.generate',
      entityType: 'group',
      entityId: input.groupId,
      payload: {
        athleteCount: athletes.length,
        bracketSize: shell.bracketSize,
        mode: 'shell',
      },
    });
  }

  return findMatchesByGroupId(input.groupId);
}

export async function resetBracket(groupId: string, adminId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { tournament: { select: { id: true, status: true } } },
  });
  if (!group) throw new Error('Group not found');
  if (group.tournament.status !== 'draft') {
    throw new Error('Reset only allowed in Draft status');
  }

  const baseline = parseRound0Baseline(
    (group as typeof group & GroupBaselineRow).round0Baseline
  );
  if (!baseline) {
    throw new Error(
      'No saved bracket layout yet. Shuffle once to save a layout, then reset can restore it.'
    );
  }

  await restoreBracketFromRound0Baseline(
    prisma,
    groupId,
    group.tournamentId,
    baseline
  );

  await recordTournamentActivity({
    tournamentId: group.tournamentId,
    adminId,
    eventType: 'bracket.reset',
    entityType: 'group',
    entityId: groupId,
    payload: {},
  });

  return findMatchesByGroupId(groupId);
}

export async function shuffleBracket(groupId: string, adminId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { tournament: { select: { id: true, status: true } } },
  });
  if (!group) throw new Error('Group not found');
  if (group.tournament.status !== 'draft') {
    throw new Error('Shuffle only allowed in Draft status');
  }

  await runBracketShufflePlacements(prisma, groupId, group.tournamentId);

  await recordTournamentActivity({
    tournamentId: group.tournamentId,
    adminId,
    eventType: 'bracket.shuffle',
    entityType: 'group',
    entityId: groupId,
    payload: {},
  });

  return findMatchesByGroupId(groupId);
}

export async function regenerateBracket(groupId: string, adminId: string) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { tournament: { select: { id: true, status: true } } },
  });
  if (!group) throw new Error('Group not found');
  if (group.tournament.status !== 'draft') {
    throw new Error('Regeneration only allowed in Draft status');
  }

  await prisma.$transaction(async (tx) => {
    await tx.match.updateMany({
      where: { groupId },
      data: clearAllGroupMatchRowsData(),
    });
    await tx.match.deleteMany({ where: { groupId } });

    const athletes = await tx.tournamentAthlete.findMany({
      where: { groupId },
      orderBy: [{ beltLevel: 'desc' }, { weight: 'asc' }],
    });
    if (athletes.length < 2) {
      throw new Error('At least 2 athletes are required to generate a bracket');
    }

    const shell = planBracketShell({
      groupId,
      tournamentId: group.tournamentId,
      athleteCount: athletes.length,
      thirdPlaceMatch: group.thirdPlaceMatch,
    });

    await Promise.all(
      shell.matches.map((row) => tx.match.create({ data: row }))
    );

    await groupUpdateRound0Baseline(tx, groupId, null);
  });

  await recordTournamentActivity({
    tournamentId: group.tournamentId,
    adminId,
    eventType: 'bracket.regenerate',
    entityType: 'group',
    entityId: groupId,
    payload: {},
  });

  return findMatchesByGroupId(groupId);
}
