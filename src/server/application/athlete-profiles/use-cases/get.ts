import type { AthleteProfileStore } from '../repositories/profile';
import { NotFoundError } from '@/server/application/errors';

export async function getProfile(id: string, store: AthleteProfileStore) {
  const profile = await store.findById(id);
  if (!profile) {
    throw new NotFoundError('Athlete profile not found');
  }
  return profile;
}
