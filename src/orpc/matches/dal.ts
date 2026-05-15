import type {
  AssignSlotDTO,
  CreateMatchDTO,
  GenerateBracketDTO,
  SetLockDTO,
  SetWinnerDTO,
  SwapParticipantsDTO,
  SwapSlotsDTO,
  UpdateMatchDTO,
  UpdateScoreDTO,
} from './dto';
import { recordTournamentActivity } from '@/orpc/activity/dal';
import { publishMatchInvalidateEvent } from '@/lib/tournament/tournament-sse-bus';
import { prisma } from '@/lib/db';

export class MatchDAL {
  static async findByGroupId(groupId: string) {
    return prisma.match.findMany({
      where: { groupId },
      orderBy: [{ round: 'asc' }, { matchIndex: 'asc' }],
    });
  }

  static async findByTournamentId(tournamentId: string) {
    return prisma.match.findMany({
      where: { tournamentId },
      orderBy: [{ round: 'asc' }, { matchIndex: 'asc' }],
    });
  }

  static async findById(id: string) {
    return prisma.match.findUnique({ where: { id } });
  }

  static async create(data: CreateMatchDTO) {
    return prisma.match.create({ data });
  }

  static async update(id: string, data: Omit<UpdateMatchDTO, 'id'>) {
    return prisma.match.update({ where: { id }, data });
  }

  static async deleteMatch(id: string) {
    return prisma.match.delete({ where: { id } });
  }

  private static nextPowerOfTwo(n: number): number {
    let p = 1;
    while (p < n) p *= 2;
    return p;
  }

  /** Uniform random permutation (Math.random). */
  private static shuffleAthletePool<T>(items: Array<T>): Array<T> {
    const a = [...items];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j]!, a[i]!];
    }
    return a;
  }

  static async generateBracket(
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

    const bracketSize = MatchDAL.nextPowerOfTwo(athletes.length);
    const totalRounds = Math.log2(bracketSize);
    const matches: Array<CreateMatchDTO> = [];

    for (let matchIdx = 0; matchIdx < bracketSize / 2; matchIdx++) {
      matches.push({
        round: 0,
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

    await Promise.all(matches.map((m) => prisma.match.create({ data: m })));

    if (!options?.skipActivity) {
      await recordTournamentActivity({
        tournamentId: group.tournamentId,
        adminId,
        eventType: 'bracket.generate',
        entityType: 'group',
        entityId: input.groupId,
        payload: {
          athleteCount: athletes.length,
          bracketSize,
          mode: 'shell',
        },
      });
    }

    return MatchDAL.findByGroupId(input.groupId);
  }

  private static async applyRound0ByeAdvancement(
    groupId: string,
    tournamentId: string
  ) {
    const round0 = await prisma.match.findMany({
      where: { groupId, round: 0 },
      orderBy: { matchIndex: 'asc' },
    });

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

        await MatchDAL.advanceWinner(match.id, winnerId!, tournamentId);
      }
    }
  }

  private static async advanceWinner(
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

  private static async clearWinnerAdvancement(match: {
    groupId: string;
    round: number;
    matchIndex: number;
    winnerTournamentAthleteId: string | null;
  }) {
    const wta = match.winnerTournamentAthleteId;
    if (!wta) return;

    const nextRound = match.round + 1;
    const nextMatchIndex = Math.floor(match.matchIndex / 2);
    const isRedSide = match.matchIndex % 2 === 0;

    const nextMatch = await prisma.match.findFirst({
      where: {
        groupId: match.groupId,
        round: nextRound,
        matchIndex: nextMatchIndex,
      },
    });

    if (!nextMatch) return;

    if (isRedSide && nextMatch.redTournamentAthleteId === wta) {
      await prisma.match.update({
        where: { id: nextMatch.id },
        data: { redTournamentAthleteId: null, redAthleteId: null },
      });
    } else if (!isRedSide && nextMatch.blueTournamentAthleteId === wta) {
      await prisma.match.update({
        where: { id: nextMatch.id },
        data: { blueTournamentAthleteId: null, blueAthleteId: null },
      });
    }
  }

  static async resetBracket(groupId: string, adminId: string) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { tournament: { select: { id: true, status: true } } },
    });
    if (!group) throw new Error('Group not found');
    if (group.tournament.status !== 'draft') {
      throw new Error('Reset only allowed in Draft status');
    }

    await prisma.match.updateMany({
      where: { groupId },
      data: {
        redTournamentAthleteId: null,
        blueTournamentAthleteId: null,
        redAthleteId: null,
        blueAthleteId: null,
        redWins: 0,
        blueWins: 0,
        winnerId: null,
        winnerTournamentAthleteId: null,
        status: 'pending',
        redLocked: false,
        blueLocked: false,
      },
    });

    await recordTournamentActivity({
      tournamentId: group.tournamentId,
      adminId,
      eventType: 'bracket.reset',
      entityType: 'group',
      entityId: groupId,
      payload: {},
    });

    return MatchDAL.findByGroupId(groupId);
  }

  static async shuffleBracket(groupId: string, adminId: string) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { tournament: { select: { id: true, status: true } } },
    });
    if (!group) throw new Error('Group not found');
    if (group.tournament.status !== 'draft') {
      throw new Error('Shuffle only allowed in Draft status');
    }

    const allMatches = await prisma.match.findMany({
      where: { groupId },
      orderBy: [{ round: 'asc' }, { matchIndex: 'asc' }],
    });
    if (allMatches.length === 0) {
      throw new Error('No bracket yet. Generate a bracket first.');
    }

    const athletes = await prisma.tournamentAthlete.findMany({
      where: { groupId },
      orderBy: [{ beltLevel: 'desc' }, { weight: 'asc' }],
    });

    const lockedIds = new Set<string>();
    const round0 = allMatches.filter((m) => m.round === 0);
    round0.sort((a, b) => a.matchIndex - b.matchIndex);

    for (const m of round0) {
      if (m.redLocked && m.redTournamentAthleteId) {
        lockedIds.add(m.redTournamentAthleteId);
      }
      if (m.blueLocked && m.blueTournamentAthleteId) {
        lockedIds.add(m.blueTournamentAthleteId);
      }
    }

    const pool = athletes.filter((a) => !lockedIds.has(a.id));
    const shuffled = MatchDAL.shuffleAthletePool(pool);

    let si = 0;
    for (const m of round0) {
      let redTa = m.redTournamentAthleteId;
      let blueTa = m.blueTournamentAthleteId;
      let redProfile = m.redAthleteId;
      let blueProfile = m.blueAthleteId;

      if (!m.redLocked) {
        const next = shuffled[si++] ?? null;
        redTa = next?.id ?? null;
        redProfile = next?.athleteProfileId ?? null;
      }
      if (!m.blueLocked) {
        const next = shuffled[si++] ?? null;
        blueTa = next?.id ?? null;
        blueProfile = next?.athleteProfileId ?? null;
      }

      await prisma.match.update({
        where: { id: m.id },
        data: {
          redTournamentAthleteId: redTa,
          blueTournamentAthleteId: blueTa,
          redAthleteId: redProfile,
          blueAthleteId: blueProfile,
          redWins: 0,
          blueWins: 0,
          winnerId: null,
          winnerTournamentAthleteId: null,
          status: 'pending',
        },
      });
    }

    const higher = allMatches.filter((m) => m.round >= 1);
    for (const m of higher) {
      await prisma.match.update({
        where: { id: m.id },
        data: {
          redTournamentAthleteId: null,
          blueTournamentAthleteId: null,
          redAthleteId: null,
          blueAthleteId: null,
          redWins: 0,
          blueWins: 0,
          winnerId: null,
          winnerTournamentAthleteId: null,
          status: 'pending',
        },
      });
    }

    await MatchDAL.applyRound0ByeAdvancement(groupId, group.tournamentId);

    await recordTournamentActivity({
      tournamentId: group.tournamentId,
      adminId,
      eventType: 'bracket.shuffle',
      entityType: 'group',
      entityId: groupId,
      payload: {},
    });

    return MatchDAL.findByGroupId(groupId);
  }

  static async regenerateBracket(groupId: string, adminId: string) {
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

    return MatchDAL.generateBracket({ groupId }, adminId, {
      skipActivity: true,
    });
  }

  static async setLock(input: SetLockDTO) {
    const data =
      input.side === 'red'
        ? { redLocked: input.locked }
        : { blueLocked: input.locked };

    return prisma.match.update({
      where: { id: input.matchId },
      data,
    });
  }

  static async assignSlot(input: AssignSlotDTO, _adminId: string) {
    const match = await prisma.match.findUnique({
      where: { id: input.matchId },
      include: { group: { include: { tournament: true } } },
    });
    if (!match) throw new Error('Match not found');
    if (match.group.tournament.status !== 'draft') {
      throw new Error('Assign only allowed in Draft status');
    }
    if (match.round !== 0) {
      throw new Error('Athletes can only be assigned to opening-round slots');
    }

    const locked = input.side === 'red' ? match.redLocked : match.blueLocked;
    if (locked) {
      throw new Error('That slot is locked');
    }

    if (input.tournamentAthleteId === null) {
      const data =
        input.side === 'red'
          ? {
              redTournamentAthleteId: null,
              redAthleteId: null,
            }
          : {
              blueTournamentAthleteId: null,
              blueAthleteId: null,
            };
      return prisma.match.update({ where: { id: input.matchId }, data });
    }

    const ta = await prisma.tournamentAthlete.findUnique({
      where: { id: input.tournamentAthleteId },
    });
    if (!ta) throw new Error('Tournament athlete not found');
    if (ta.groupId !== match.groupId) {
      throw new Error('Athlete does not belong to this bracket group');
    }

    const data =
      input.side === 'red'
        ? {
            redTournamentAthleteId: ta.id,
            redAthleteId: ta.athleteProfileId,
          }
        : {
            blueTournamentAthleteId: ta.id,
            blueAthleteId: ta.athleteProfileId,
          };

    return prisma.match.update({ where: { id: input.matchId }, data });
  }

  static async swapSlots(input: SwapSlotsDTO, _adminId: string) {
    const [a, b] = await Promise.all([
      prisma.match.findUnique({
        where: { id: input.matchAId },
        include: { group: { include: { tournament: true } } },
      }),
      prisma.match.findUnique({
        where: { id: input.matchBId },
        include: { group: { include: { tournament: true } } },
      }),
    ]);
    if (!a || !b) throw new Error('Match not found');
    if (a.groupId !== b.groupId) {
      throw new Error('Both slots must be in the same group');
    }
    if (a.group.tournament.status !== 'draft') {
      throw new Error('Swap only allowed in Draft status');
    }
    if (a.round !== 0 || b.round !== 0) {
      throw new Error('Can only swap opening-round slots');
    }

    const lockA = input.sideA === 'red' ? a.redLocked : a.blueLocked;
    const lockB = input.sideB === 'red' ? b.redLocked : b.blueLocked;
    if (lockA || lockB) {
      throw new Error('Cannot swap a locked slot');
    }

    if (input.matchAId === input.matchBId) {
      if (input.sideA === input.sideB) {
        throw new Error('Invalid swap');
      }
      return prisma.match.update({
        where: { id: a.id },
        data: {
          redTournamentAthleteId: a.blueTournamentAthleteId,
          blueTournamentAthleteId: a.redTournamentAthleteId,
          redAthleteId: a.blueAthleteId,
          blueAthleteId: a.redAthleteId,
        },
      });
    }

    const aRedTa = a.redTournamentAthleteId;
    const aBlueTa = a.blueTournamentAthleteId;
    const aRedProfile = a.redAthleteId;
    const aBlueProfile = a.blueAthleteId;
    const bRedTa = b.redTournamentAthleteId;
    const bBlueTa = b.blueTournamentAthleteId;
    const bRedProfile = b.redAthleteId;
    const bBlueProfile = b.blueAthleteId;

    const aTa = input.sideA === 'red' ? aRedTa : aBlueTa;
    const aProf = input.sideA === 'red' ? aRedProfile : aBlueProfile;
    const bTa = input.sideB === 'red' ? bRedTa : bBlueTa;
    const bProf = input.sideB === 'red' ? bRedProfile : bBlueProfile;

    return prisma
      .$transaction([
        prisma.match.update({
          where: { id: input.matchAId },
          data:
            input.sideA === 'red'
              ? {
                  redTournamentAthleteId: bTa,
                  redAthleteId: bProf,
                }
              : {
                  blueTournamentAthleteId: bTa,
                  blueAthleteId: bProf,
                },
        }),
        prisma.match.update({
          where: { id: input.matchBId },
          data:
            input.sideB === 'red'
              ? {
                  redTournamentAthleteId: aTa,
                  redAthleteId: aProf,
                }
              : {
                  blueTournamentAthleteId: aTa,
                  blueAthleteId: aProf,
                },
        }),
      ])
      .then((r) => r[1]!);
  }

  static async updateScore(input: UpdateScoreDTO, adminId: string) {
    const match = await prisma.match.findUnique({
      where: { id: input.matchId },
    });
    if (!match) throw new Error('Match not found');

    const bestOf = match.bestOf;
    const winsNeeded = Math.ceil(bestOf / 2);

    const willBeComplete =
      input.redWins >= winsNeeded || input.blueWins >= winsNeeded;

    const hadCompleted =
      match.status === 'complete' ||
      match.redWins >= winsNeeded ||
      match.blueWins >= winsNeeded;

    if (!willBeComplete && hadCompleted && match.winnerTournamentAthleteId) {
      await MatchDAL.clearWinnerAdvancement(match);
    }

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
      winnerId = null;
      winnerTournamentAthleteId = null;
      status = 'active';
    } else {
      winnerId = null;
      winnerTournamentAthleteId = null;
      // 0–0: back to selectable in arena list (selectionMatches only lists `pending`).
      status =
        match.redTournamentAthleteId && match.blueTournamentAthleteId
          ? 'pending'
          : 'active';
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
      await MatchDAL.advanceWinner(
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

    publishMatchInvalidateEvent(match.tournamentId);

    return updated;
  }

  static async setWinner(input: SetWinnerDTO, adminId: string) {
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
      await MatchDAL.advanceWinner(
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

    publishMatchInvalidateEvent(match.tournamentId);

    return updated;
  }

  static async swapParticipants(input: SwapParticipantsDTO, adminId: string) {
    return prisma.$transaction(async (tx) => {
      const match = await tx.match.findUnique({
        where: { id: input.matchId },
        include: { group: { include: { tournament: true } } },
      });
      if (!match) throw new Error('Match not found');

      const status = match.group.tournament.status;
      if (status === 'completed') {
        throw new Error('Cannot swap participants in a completed tournament');
      }

      const redAthlete = input.redTournamentAthleteId
        ? await tx.tournamentAthlete.findUnique({
            where: { id: input.redTournamentAthleteId },
          })
        : null;
      const blueAthlete = input.blueTournamentAthleteId
        ? await tx.tournamentAthlete.findUnique({
            where: { id: input.blueTournamentAthleteId },
          })
        : null;

      const updated = await tx.match.update({
        where: { id: input.matchId },
        data: {
          redTournamentAthleteId: input.redTournamentAthleteId,
          blueTournamentAthleteId: input.blueTournamentAthleteId,
          redAthleteId: redAthlete?.athleteProfileId ?? null,
          blueAthleteId: blueAthlete?.athleteProfileId ?? null,
        },
      });

      await recordTournamentActivity(
        {
          tournamentId: match.tournamentId,
          adminId,
          eventType: 'match.swap_participants',
          entityType: 'match',
          entityId: input.matchId,
          payload: {
            previousRedTournamentAthleteId: match.redTournamentAthleteId,
            previousBlueTournamentAthleteId: match.blueTournamentAthleteId,
            redTournamentAthleteId: input.redTournamentAthleteId,
            blueTournamentAthleteId: input.blueTournamentAthleteId,
          },
        },
        tx
      );

      return updated;
    });
  }
}
