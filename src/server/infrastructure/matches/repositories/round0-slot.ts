import type { Round0SlotStore } from '@/server/application/matches/repositories/round0-slot';
import { BadRequestError, NotFoundError } from '@/server/application/errors';
import { coalesceMatchRead } from '@/server/domain/tournament/match/match-read';
import { prisma } from '@/lib/db';

export const round0SlotStore: Round0SlotStore = {
  async findMatch(matchId) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { tournament: { select: { status: true } } },
    });
    if (!match) return null;

    const { tournament, ...row } = match;
    return { ...coalesceMatchRead(row), tournamentStatus: tournament.status };
  },

  async setLock(command) {
    const data =
      command.side === 'red'
        ? { redLocked: command.locked }
        : { blueLocked: command.locked };

    const updated = await prisma.match.update({
      where: { id: command.matchId },
      data,
    });
    return coalesceMatchRead(updated);
  },

  async assignSlot(command) {
    const match = await prisma.match.findUnique({
      where: { id: command.matchId },
      include: { group: { include: { tournament: true } } },
    });
    if (!match) throw new NotFoundError('Match not found');
    if (match.round !== 0) {
      throw new BadRequestError(
        'Athletes can only be assigned to opening-round slots'
      );
    }
    if (match.status === 'complete') {
      throw new BadRequestError('Cannot assign to a complete match');
    }

    const locked = command.side === 'red' ? match.redLocked : match.blueLocked;
    if (locked) {
      throw new BadRequestError('That slot is locked');
    }

    if (command.tournamentAthleteId === null) {
      const data =
        command.side === 'red'
          ? {
              redTournamentAthleteId: null,
              redAthleteId: null,
            }
          : {
              blueTournamentAthleteId: null,
              blueAthleteId: null,
            };
      const updated = await prisma.match.update({
        where: { id: command.matchId },
        data,
      });
      return coalesceMatchRead(updated);
    }

    const ta = await prisma.tournamentAthlete.findUnique({
      where: { id: command.tournamentAthleteId },
    });
    if (!ta) throw new NotFoundError('Tournament athlete not found');
    if (ta.groupId !== match.groupId) {
      throw new BadRequestError(
        'Athlete does not belong to this bracket group'
      );
    }

    const data =
      command.side === 'red'
        ? {
            redTournamentAthleteId: ta.id,
            redAthleteId: ta.athleteProfileId,
          }
        : {
            blueTournamentAthleteId: ta.id,
            blueAthleteId: ta.athleteProfileId,
          };

    const updated = await prisma.match.update({
      where: { id: command.matchId },
      data,
    });
    return coalesceMatchRead(updated);
  },

  async swapSlots(command) {
    const [a, b] = await Promise.all([
      prisma.match.findUnique({
        where: { id: command.matchAId },
        include: { group: { include: { tournament: true } } },
      }),
      prisma.match.findUnique({
        where: { id: command.matchBId },
        include: { group: { include: { tournament: true } } },
      }),
    ]);
    if (!a || !b) throw new NotFoundError('Match not found');
    if (a.groupId !== b.groupId) {
      throw new BadRequestError('Both slots must be in the same group');
    }
    if (a.round !== 0 || b.round !== 0) {
      throw new BadRequestError('Can only swap opening-round slots');
    }
    if (a.status === 'complete' || b.status === 'complete') {
      throw new BadRequestError('Cannot swap slots on a complete match');
    }

    const lockA = command.sideA === 'red' ? a.redLocked : a.blueLocked;
    const lockB = command.sideB === 'red' ? b.redLocked : b.blueLocked;
    if (lockA || lockB) {
      throw new BadRequestError('Cannot swap a locked slot');
    }

    if (command.matchAId === command.matchBId) {
      if (command.sideA === command.sideB) {
        throw new BadRequestError('Invalid swap');
      }
      const updated = await prisma.match.update({
        where: { id: a.id },
        data: {
          redTournamentAthleteId: a.blueTournamentAthleteId,
          blueTournamentAthleteId: a.redTournamentAthleteId,
          redAthleteId: a.blueAthleteId,
          blueAthleteId: a.redAthleteId,
        },
      });
      return coalesceMatchRead(updated);
    }

    const aRedTa = a.redTournamentAthleteId;
    const aBlueTa = a.blueTournamentAthleteId;
    const aRedProfile = a.redAthleteId;
    const aBlueProfile = a.blueAthleteId;
    const bRedTa = b.redTournamentAthleteId;
    const bBlueTa = b.blueTournamentAthleteId;
    const bRedProfile = b.redAthleteId;
    const bBlueProfile = b.blueAthleteId;

    const aTa = command.sideA === 'red' ? aRedTa : aBlueTa;
    const aProf = command.sideA === 'red' ? aRedProfile : aBlueProfile;
    const bTa = command.sideB === 'red' ? bRedTa : bBlueTa;
    const bProf = command.sideB === 'red' ? bRedProfile : bBlueProfile;

    const [, updated] = await prisma.$transaction([
      prisma.match.update({
        where: { id: command.matchAId },
        data:
          command.sideA === 'red'
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
        where: { id: command.matchBId },
        data:
          command.sideB === 'red'
            ? {
                redTournamentAthleteId: aTa,
                redAthleteId: aProf,
              }
            : {
                blueTournamentAthleteId: aTa,
                blueAthleteId: aProf,
              },
      }),
    ]);

    return coalesceMatchRead(updated);
  },
};
