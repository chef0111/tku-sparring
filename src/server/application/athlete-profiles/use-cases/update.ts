import type { AthleteProfileStore } from '../repositories/profile';
import type { UpdateProfileData } from './profile-commands';

export async function updateProfile(
  id: string,
  data: UpdateProfileData,
  store: AthleteProfileStore
) {
  return store.update(id, data);
}
