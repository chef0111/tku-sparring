import type { AthleteProfileStore } from '../repositories/profile';
import type { BulkRemoveProfilesCommand } from './profile-commands';

export async function bulkRemoveProfiles(
  command: BulkRemoveProfilesCommand,
  store: AthleteProfileStore
) {
  return store.bulkRemove(command);
}
