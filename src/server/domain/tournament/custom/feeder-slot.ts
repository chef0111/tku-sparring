import { CustomMatchValidationError } from '@/server/domain/tournament/custom/errors';

export type CustomFeederMatch = {
  kind: string;
  status: string;
  redTournamentAthleteId: string | null;
  blueTournamentAthleteId: string | null;
  tournamentWinnerId: string | null;
};

export function resolveFeederSlotId(
  feeder: CustomFeederMatch,
  mode: 'winner' | 'loser'
): string {
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

  if (mode === 'winner') {
    if (
      feeder.redTournamentAthleteId == null ||
      feeder.blueTournamentAthleteId == null
    ) {
      throw new CustomMatchValidationError(
        'Winner slot requires both athletes present in the feeder match'
      );
    }
    return feeder.tournamentWinnerId;
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
  if (w === feeder.redTournamentAthleteId) {
    return feeder.blueTournamentAthleteId;
  }
  if (w === feeder.blueTournamentAthleteId) {
    return feeder.redTournamentAthleteId;
  }
  throw new CustomMatchValidationError('Winner does not match a feeder corner');
}
