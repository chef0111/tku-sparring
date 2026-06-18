import type { AthleteProfileStore, DedupMatch } from '../repositories/profile';
import type { DedupQuery } from './profile-commands';

export type DedupResult = {
  isDuplicate: boolean;
  isHardBlock: boolean;
  matches: Array<DedupMatch>;
};

export async function runDedupCheck(
  input: DedupQuery,
  store: AthleteProfileStore
): Promise<DedupResult> {
  if (input.athleteCode) {
    const hardMatch = await store.findByAthleteCodeAndName(
      input.athleteCode,
      input.name,
      input.excludeId
    );
    if (hardMatch) {
      return { isDuplicate: true, isHardBlock: true, matches: [hardMatch] };
    }
    return { isDuplicate: false, isHardBlock: false, matches: [] };
  }

  const softMatches = await store.findPossibleDuplicates({
    name: input.name,
    affiliation: input.affiliation,
    weight: input.weight,
    beltLevel: input.beltLevel,
    excludeId: input.excludeId,
  });

  if (softMatches.length > 0) {
    return { isDuplicate: true, isHardBlock: false, matches: softMatches };
  }

  return { isDuplicate: false, isHardBlock: false, matches: [] };
}
