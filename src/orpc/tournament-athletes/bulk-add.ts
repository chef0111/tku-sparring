import { TournamentAthleteDAL } from './dal';
import type { GroupAssignmentStore } from '@/server/application/groups/repositories/assign';
import { autoAssignAllEligible } from '@/server/application/groups/use-cases/assign';
import { prisma } from '@/lib/db';

export async function bulkAddAthletesToTournament(input: {
  tournamentId: string;
  athleteProfileIds: Array<string>;
  autoAssign: boolean;
  adminId: string;
  assignStore: GroupAssignmentStore;
}) {
  const { tournamentId, athleteProfileIds, autoAssign, adminId, assignStore } =
    input;

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
    await autoAssignAllEligible({ tournamentId, adminId }, assignStore);
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
