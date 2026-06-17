import type { AthleteProfileStore } from '../repositories/profile';

export async function removeProfile(id: string, store: AthleteProfileStore) {
  return store.remove(id);
}
