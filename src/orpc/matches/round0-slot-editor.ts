import type { AssignSlotDTO, SetLockDTO, SwapSlotsDTO } from './dto';
import { prisma } from '@/lib/db';

export async function setRound0SlotLock(input: SetLockDTO) {
  const data =
    input.side === 'red'
      ? { redLocked: input.locked }
      : { blueLocked: input.locked };

  return prisma.match.update({
    where: { id: input.matchId },
    data,
  });
}

export async function assignRound0Slot(input: AssignSlotDTO, _adminId: string) {
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

export async function swapRound0Slots(input: SwapSlotsDTO, _adminId: string) {
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
