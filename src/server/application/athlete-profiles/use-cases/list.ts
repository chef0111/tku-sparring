import type { AthleteProfileStore } from '../repositories/profile';
import type { ListAthleteProfilesQuery } from './profile-commands';

export async function listProfiles(
  query: ListAthleteProfilesQuery,
  store: AthleteProfileStore
) {
  return store.list(query);
}
