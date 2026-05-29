import { throwMatchBadRequest } from './match-domain-error';
import type { CustomSlotDTO } from './dto';
import { prisma } from '@/lib/db';

export async function resolveCustomSlot(
  groupId: string,
  slot: CustomSlotDTO
): Promise<{
  tournamentAthleteId: string;
  athleteProfileId: string | null;
}> {
  if (slot.mode === 'direct') {
    const ta = await prisma.tournamentAthlete.findFirst({
      where: { id: slot.tournamentAthleteId, groupId },
    });
    if (!ta) throwMatchBadRequest('Tournament athlete not found in this group');
    return {
      tournamentAthleteId: ta.id,
      athleteProfileId: ta.athleteProfileId,
    };
  }

  const feeder = await prisma.match.findFirst({
    where: { id: slot.feederMatchId, groupId },
  });
  if (!feeder) throwMatchBadRequest('Feeder match not found in this group');
  if (feeder.kind === 'custom') {
    throwMatchBadRequest(
      'Bracket matches only — custom matches cannot be feeders'
    );
  }
  if (feeder.status !== 'complete') {
    throwMatchBadRequest('Feeder match must be complete');
  }
  if (!feeder.tournamentWinnerId) {
    throwMatchBadRequest('Feeder match has no winner');
  }

  if (slot.mode === 'winner') {
    if (
      feeder.redTournamentAthleteId == null ||
      feeder.blueTournamentAthleteId == null
    ) {
      throwMatchBadRequest(
        'Winner slot requires both athletes present in the feeder match'
      );
    }
    const ta = await prisma.tournamentAthlete.findUnique({
      where: { id: feeder.tournamentWinnerId },
      select: { athleteProfileId: true },
    });
    if (!ta) throwMatchBadRequest('Winner tournament athlete missing');
    return {
      tournamentAthleteId: feeder.tournamentWinnerId,
      athleteProfileId: ta.athleteProfileId,
    };
  }

  if (
    feeder.redTournamentAthleteId == null ||
    feeder.blueTournamentAthleteId == null
  ) {
    throwMatchBadRequest(
      'Loser slot requires both athletes in the feeder match'
    );
  }
  const w = feeder.tournamentWinnerId;
  let loserTa: string | null = null;
  if (w === feeder.redTournamentAthleteId) {
    loserTa = feeder.blueTournamentAthleteId;
  } else if (w === feeder.blueTournamentAthleteId) {
    loserTa = feeder.redTournamentAthleteId;
  } else {
    throwMatchBadRequest('Winner does not match a feeder corner');
  }
  if (!loserTa) throwMatchBadRequest('Could not resolve loser');

  const ta = await prisma.tournamentAthlete.findUnique({
    where: { id: loserTa },
    select: { athleteProfileId: true },
  });
  if (!ta) throwMatchBadRequest('Loser tournament athlete missing');

  return {
    tournamentAthleteId: loserTa,
    athleteProfileId: ta.athleteProfileId,
  };
}
