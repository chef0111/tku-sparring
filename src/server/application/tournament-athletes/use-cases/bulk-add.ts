import type { BulkAddAthletesCommand } from './roster-commands';
import type { DivisionAssignmentStore } from '@/server/application/divisions/repositories/assign';
import type { TournamentAthleteStore } from '../repositories/roster';
import { autoAssignAllEligible } from '@/server/application/divisions/use-cases/assign';

export async function bulkAddAthletes(
  command: BulkAddAthletesCommand,
  store: TournamentAthleteStore,
  assignStore: DivisionAssignmentStore
) {
  const profiles = await store.findProfilesByIds(command.athleteProfileIds);
  const createdProfiles = await store.bulkCreate(
    command.tournamentId,
    profiles
  );
  const added = createdProfiles.length;
  const createdProfileIds = createdProfiles.map((p) => p.id);

  if (command.autoAssign && added > 0) {
    await autoAssignAllEligible(
      { tournamentId: command.tournamentId, adminId: command.adminId },
      assignStore
    );
  }

  const assigned =
    createdProfileIds.length > 0
      ? await store.countAssigned(command.tournamentId, createdProfileIds)
      : 0;

  return { added, assigned, unassigned: added - assigned };
}
