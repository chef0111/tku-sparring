import { CustomMatchValidationError } from '@/lib/tournament/custom-match-validation';
import { prisma } from '@/lib/db';

export type CustomSlotInput =
  | { mode: 'direct'; tournamentAthleteId: string }
  | { mode: 'winner'; feederMatchId: string }
  | { mode: 'loser'; feederMatchId: string };

export type CustomSlotDb = Pick<typeof prisma, 'match' | 'tournamentAthlete'>;

export async function resolveCustomSlot(
  groupId: string,
  slot: CustomSlotInput,
  db: CustomSlotDb = prisma
): Promise<{
  tournamentAthleteId: string;
  athleteProfileId: string | null;
}> {
  if (slot.mode === 'direct') {
    const ta = await db.tournamentAthlete.findFirst({
      where: { id: slot.tournamentAthleteId, groupId },
    });
    if (!ta) {
      throw new CustomMatchValidationError(
        'Tournament athlete not found in this group'
      );
    }
    return {
      tournamentAthleteId: ta.id,
      athleteProfileId: ta.athleteProfileId,
    };
  }

  const feeder = await db.match.findFirst({
    where: { id: slot.feederMatchId, groupId },
  });
  if (!feeder) {
    throw new CustomMatchValidationError(
      'Feeder match not found in this group'
    );
  }
  if (feeder.kind === 'custom') {
    throw new CustomMatchValidationError(
      'Bracket matches only — custom matches cannot be feeders'
    );
  }
  if (feeder.status !== 'complete') {
    throw new CustomMatchValidationError('Feeder match must be complete');
  }
  if (!feeder.tournamentWinnerId) {
    throw new CustomMatchValidationError('Feeder match has no winner');
  }

  if (slot.mode === 'winner') {
    if (
      feeder.redTournamentAthleteId == null ||
      feeder.blueTournamentAthleteId == null
    ) {
      throw new CustomMatchValidationError(
        'Winner slot requires both athletes present in the feeder match'
      );
    }
    const ta = await db.tournamentAthlete.findUnique({
      where: { id: feeder.tournamentWinnerId },
      select: { athleteProfileId: true },
    });
    if (!ta)
      throw new CustomMatchValidationError('Winner tournament athlete missing');
    return {
      tournamentAthleteId: feeder.tournamentWinnerId,
      athleteProfileId: ta.athleteProfileId,
    };
  }

  if (
    feeder.redTournamentAthleteId == null ||
    feeder.blueTournamentAthleteId == null
  ) {
    throw new CustomMatchValidationError(
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
    throw new CustomMatchValidationError(
      'Winner does not match a feeder corner'
    );
  }
  if (!loserTa) throw new CustomMatchValidationError('Could not resolve loser');

  const ta = await db.tournamentAthlete.findUnique({
    where: { id: loserTa },
    select: { athleteProfileId: true },
  });
  if (!ta)
    throw new CustomMatchValidationError('Loser tournament athlete missing');

  return {
    tournamentAthleteId: loserTa,
    athleteProfileId: ta.athleteProfileId,
  };
}
