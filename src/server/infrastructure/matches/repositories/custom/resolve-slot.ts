import type { CustomSlotInput } from '@/server/domain/tournament/custom/types';
import { CustomMatchValidationError } from '@/server/domain/tournament/custom/errors';
import { resolveFeederSlotId } from '@/server/domain/tournament/custom/feeder-slot';
import { prisma } from '@/lib/db';

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

  const tournamentAthleteId = resolveFeederSlotId(feeder, slot.mode);
  const ta = await db.tournamentAthlete.findUnique({
    where: { id: tournamentAthleteId },
    select: { athleteProfileId: true },
  });
  if (!ta) {
    throw new CustomMatchValidationError(
      slot.mode === 'winner'
        ? 'Winner tournament athlete missing'
        : 'Loser tournament athlete missing'
    );
  }

  return {
    tournamentAthleteId,
    athleteProfileId: ta.athleteProfileId,
  };
}
