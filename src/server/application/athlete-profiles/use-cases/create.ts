import { runDedupCheck } from './dedup';
import type { AthleteProfileStore } from '../repositories/profile';
import type { CreateProfileCommand } from './profile-commands';

export async function createProfile(
  command: CreateProfileCommand,
  store: AthleteProfileStore
) {
  const { confirmDuplicate, ...data } = command;

  if (!confirmDuplicate) {
    const dedup = await runDedupCheck(
      {
        athleteCode: data.athleteCode,
        name: data.name,
        affiliation: data.affiliation,
        weight: data.weight,
        beltLevel: data.beltLevel,
      },
      store
    );

    if (dedup.isHardBlock) {
      throw new Error(
        'DUPLICATE_ATHLETE_CODE_NAME: An athlete with this code and name already exists'
      );
    }

    if (dedup.isDuplicate) {
      throw new Error(
        `POSSIBLE_DUPLICATE: ${JSON.stringify(dedup.matches.map((d) => d.id))}`
      );
    }
  }

  return store.create(data);
}
