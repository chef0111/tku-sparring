import type {
  CreateMatchDTO,
  GenerateBracketDTO,
  SetLockDTO,
  SetWinnerDTO,
  SwapParticipantsDTO,
  UpdateMatchDTO,
  UpdateScoreDTO,
} from './matches.dto';
import { recordTournamentActivity } from '@/orpc/activity/tournament-activity.dal';
import { prisma } from '@/lib/db';

export async function findByGroupId(groupId: string) {
  return prisma.match.findMany({
    where: { groupId },
    orderBy: [{ round: 'asc' }, { matchIndex: 'asc' }],
  });
}

export async function findByTournamentId(tournamentId: string) {
  return prisma.match.findMany({
    where: { tournamentId },
    orderBy: [{ round: 'asc' }, { matchIndex: 'asc' }],
  });
}

export async function findById(id: string) {
  return prisma.match.findUnique({ where: { id } });
}

export async function create(data: CreateMatchDTO) {
  return prisma.match.create({ data });
}

export async function update(id: string, data: Omit<UpdateMatchDTO, 'id'>) {
  return prisma.match.update({ where: { id }, data });
}

export async function deleteMatch(id: string) {
  return prisma.match.delete({ where: { id } });
}

function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

function standardSeedOrder(size: number): Array<number> {
  if (size === 1) return [0];
  const half = standardSeedOrder(size / 2);
  return half.flatMap((i) => [i, size - 1 - i]);
}

export async function generateBracket(
  input: GenerateBracketDTO,
  adminId: string
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
    where: { groupId: input.groupId },
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

  const bracketSize = nextPowerOfTwo(athletes.length);
  const seedOrder = standardSeedOrder(bracketSize);

  const seeded: Array<(typeof athletes)[0] | null> = new Array(
    bracketSize
  ).fill(null);

  const shuffledAthletes = [...athletes];
  for (let i = shuffledAthletes.length - 1; i > 0; i--) {
    let j = i;
    while (
      j > 0 &&
      shuffledAthletes[j]!.beltLevel === shuffledAthletes[j - 1]!.beltLevel &&
      shuffledAthletes[j]!.weight === shuffledAthletes[j - 1]!.weight
    ) {
      j--;
    }
    if (j < i) {
      const k = j + Math.floor(Math.random() * (i - j + 1));
      [shuffledAthletes[i], shuffledAthletes[k]] = [
        shuffledAthletes[k]!,
        shuffledAthletes[i]!,
      ];
    }
  }

  for (let i = 0; i < shuffledAthletes.length; i++) {
    seeded[seedOrder[i]!] = shuffledAthletes[i]!;
  }

  const totalRounds = Math.log2(bracketSize);
  const matches: Array<CreateMatchDTO> = [];

  for (let matchIdx = 0; matchIdx < bracketSize / 2; matchIdx++) {
    const redAthlete = seeded[matchIdx * 2] ?? null;
    const blueAthlete = seeded[matchIdx * 2 + 1] ?? null;

    matches.push({
      round: 0,
      matchIndex: matchIdx,
      status: 'pending',
      bestOf: 3,
      redTournamentAthleteId: redAthlete?.id ?? null,
      blueTournamentAthleteId: blueAthlete?.id ?? null,
      redAthleteId: redAthlete?.athleteProfileId ?? null,
      blueAthleteId: blueAthlete?.athleteProfileId ?? null,
      redLocked: false,
      blueLocked: false,
      groupId: input.groupId,
      tournamentId: group.tournamentId,
    });
  }

  for (let round = 1; round < totalRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round + 1);
    for (let matchIdx = 0; matchIdx < matchesInRound; matchIdx++) {
      matches.push({
        round,
        matchIndex: matchIdx,
        status: 'pending',
        bestOf: 3,
        redTournamentAthleteId: null,
        blueTournamentAthleteId: null,
        redAthleteId: null,
        blueAthleteId: null,
        redLocked: false,
        blueLocked: false,
        groupId: input.groupId,
        tournamentId: group.tournamentId,
      });
    }
  }

  if (group.thirdPlaceMatch && totalRounds >= 2) {
    matches.push({
      round: totalRounds,
      matchIndex: 0,
      status: 'pending',
      bestOf: 3,
      redTournamentAthleteId: null,
      blueTournamentAthleteId: null,
      redAthleteId: null,
      blueAthleteId: null,
      redLocked: false,
      blueLocked: false,
      groupId: input.groupId,
      tournamentId: group.tournamentId,
    });
  }

  const created = await Promise.all(
    matches.map((m) => prisma.match.create({ data: m }))
  );

  const round0 = created.filter((m) => m.round === 0);
  for (const match of round0) {
    const isBye =
      (match.redTournamentAthleteId && !match.blueTournamentAthleteId) ||
      (!match.redTournamentAthleteId && match.blueTournamentAthleteId);

    if (isBye) {
      const winnerId =
        match.redTournamentAthleteId ?? match.blueTournamentAthleteId;
      const winnerProfileId = match.redAthleteId ?? match.blueAthleteId;

      await prisma.match.update({
        where: { id: match.id },
        data: {
          status: 'complete',
          winnerTournamentAthleteId: winnerId,
          winnerId: winnerProfileId,
          redWins: match.redTournamentAthleteId ? 2 : 0,
          blueWins: match.blueTournamentAthleteId ? 2 : 0,
        },
      });

      await advanceWinner(match.id, winnerId!, group.tournamentId);
    }
  }

  await recordTournamentActivity({
    tournamentId: group.tournamentId,
    adminId,
    eventType: 'bracket.generate',
    entityType: 'group',
    entityId: input.groupId,
    payload: {
      athleteCount: athletes.length,
      bracketSize,
      matchCount: matches.length,
    },
  });

  return findByGroupId(input.groupId);
}

async function advanceWinner(
  matchId: string,
  winnerTournamentAthleteId: string,
  _tournamentId: string
) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return;

  const nextRound = match.round + 1;
  const nextMatchIndex = Math.floor(match.matchIndex / 2);
  const isRedSide = match.matchIndex % 2 === 0;

  const winner = await prisma.tournamentAthlete.findUnique({
    where: { id: winnerTournamentAthleteId },
  });

  const nextMatch = await prisma.match.findFirst({
    where: {
      groupId: match.groupId,
      round: nextRound,
      matchIndex: nextMatchIndex,
    },
  });

  if (!nextMatch) return;

  await prisma.match.update({
    where: { id: nextMatch.id },
    data: isRedSide
      ? {
          redTournamentAthleteId: winnerTournamentAthleteId,
          redAthleteId: winner?.athleteProfileId ?? null,
        }
      : {
          blueTournamentAthleteId: winnerTournamentAthleteId,
          blueAthleteId: winner?.athleteProfileId ?? null,
        },
  });
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

  await prisma.match.deleteMany({ where: { groupId } });

  await recordTournamentActivity({
    tournamentId: group.tournamentId,
    adminId,
    eventType: 'bracket.shuffle',
    entityType: 'group',
    entityId: groupId,
    payload: {},
  });

  return generateBracket({ groupId }, adminId);
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

  await prisma.match.deleteMany({ where: { groupId } });

  await recordTournamentActivity({
    tournamentId: group.tournamentId,
    adminId,
    eventType: 'bracket.regenerate',
    entityType: 'group',
    entityId: groupId,
    payload: {},
  });

  return generateBracket({ groupId }, adminId);
}

export async function setLock(input: SetLockDTO) {
  const data =
    input.side === 'red'
      ? { redLocked: input.locked }
      : { blueLocked: input.locked };

  return prisma.match.update({
    where: { id: input.matchId },
    data,
  });
}

export async function updateScore(input: UpdateScoreDTO, adminId: string) {
  const match = await prisma.match.findUnique({
    where: { id: input.matchId },
  });
  if (!match) throw new Error('Match not found');

  const bestOf = match.bestOf;
  const winsNeeded = Math.ceil(bestOf / 2);

  let winnerId: string | null = null;
  let winnerTournamentAthleteId: string | null = null;
  let status: string = match.status;

  if (input.redWins >= winsNeeded) {
    winnerId = match.redAthleteId;
    winnerTournamentAthleteId = match.redTournamentAthleteId;
    status = 'complete';
  } else if (input.blueWins >= winsNeeded) {
    winnerId = match.blueAthleteId;
    winnerTournamentAthleteId = match.blueTournamentAthleteId;
    status = 'complete';
  } else if (input.redWins > 0 || input.blueWins > 0) {
    status = 'active';
  }

  const updated = await prisma.match.update({
    where: { id: input.matchId },
    data: {
      redWins: input.redWins,
      blueWins: input.blueWins,
      winnerId,
      winnerTournamentAthleteId,
      status,
    },
  });

  if (status === 'complete' && winnerTournamentAthleteId) {
    await advanceWinner(
      input.matchId,
      winnerTournamentAthleteId,
      match.tournamentId
    );
  }

  await recordTournamentActivity({
    tournamentId: match.tournamentId,
    adminId,
    eventType: 'match.score_edit',
    entityType: 'match',
    entityId: input.matchId,
    payload: {
      redWins: input.redWins,
      blueWins: input.blueWins,
      status,
    },
  });

  return updated;
}

export async function setWinner(input: SetWinnerDTO, adminId: string) {
  const match = await prisma.match.findUnique({
    where: { id: input.matchId },
  });
  if (!match) throw new Error('Match not found');

  const winnerId =
    input.winnerSide === 'red' ? match.redAthleteId : match.blueAthleteId;
  const winnerTournamentAthleteId =
    input.winnerSide === 'red'
      ? match.redTournamentAthleteId
      : match.blueTournamentAthleteId;

  const updated = await prisma.match.update({
    where: { id: input.matchId },
    data: {
      winnerId,
      winnerTournamentAthleteId,
      status: 'complete',
    },
  });

  if (winnerTournamentAthleteId) {
    await advanceWinner(
      input.matchId,
      winnerTournamentAthleteId,
      match.tournamentId
    );
  }

  await recordTournamentActivity({
    tournamentId: match.tournamentId,
    adminId,
    eventType: 'match.winner_override',
    entityType: 'match',
    entityId: input.matchId,
    payload: {
      winnerSide: input.winnerSide,
      reason: input.reason,
    },
  });

  return updated;
}

export async function swapParticipants(
  input: SwapParticipantsDTO,
  _adminId: string
) {
  const match = await prisma.match.findUnique({
    where: { id: input.matchId },
    include: { group: { include: { tournament: true } } },
  });
  if (!match) throw new Error('Match not found');

  const status = match.group.tournament.status;
  if (status === 'completed') {
    throw new Error('Cannot swap participants in a completed tournament');
  }

  const redAthlete = input.redTournamentAthleteId
    ? await prisma.tournamentAthlete.findUnique({
        where: { id: input.redTournamentAthleteId },
      })
    : null;
  const blueAthlete = input.blueTournamentAthleteId
    ? await prisma.tournamentAthlete.findUnique({
        where: { id: input.blueTournamentAthleteId },
      })
    : null;

  return prisma.match.update({
    where: { id: input.matchId },
    data: {
      redTournamentAthleteId: input.redTournamentAthleteId,
      blueTournamentAthleteId: input.blueTournamentAthleteId,
      redAthleteId: redAthlete?.athleteProfileId ?? null,
      blueAthleteId: blueAthlete?.athleteProfileId ?? null,
    },
  });
}
