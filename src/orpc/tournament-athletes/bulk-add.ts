import { TournamentAthleteDAL } from './dal';
import { GroupDAL } from '@/orpc/groups/dal';
import { prisma } from '@/lib/db';

export async function bulkAddAthletesToTournament(input: {
  tournamentId: string;
  athleteProfileIds: Array<string>;
  autoAssign: boolean;
  adminId: string;
}) {
  const { tournamentId, athleteProfileIds, autoAssign, adminId } = input;

  const profiles = await prisma.athleteProfile.findMany({
    where: { id: { in: athleteProfileIds } },
  });

  const createdProfiles = await TournamentAthleteDAL.bulkCreate(
    tournamentId,
    profiles
  );
  const added = createdProfiles.length;
  const createdProfileIds = createdProfiles.map((p) => p.id);

  if (autoAssign && added > 0) {
    await GroupDAL.autoAssignAllEligible({ tournamentId, adminId });
  }

  let assigned = 0;
  if (createdProfileIds.length > 0) {
    const rows = await prisma.tournamentAthlete.findMany({
      where: {
        tournamentId,
        athleteProfileId: { in: createdProfileIds },
      },
      select: { groupId: true },
    });
    assigned = rows.filter((r) => r.groupId != null).length;
  }

  return { added, assigned, unassigned: added - assigned };
}
