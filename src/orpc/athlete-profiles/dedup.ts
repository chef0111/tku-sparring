import { AthleteProfileDAL } from './dal';

export interface DedupResult {
  isDuplicate: boolean;
  isHardBlock: boolean;
  matches: Array<{ id: string; name: string; affiliation: string }>;
}

/**
 * Runs both hard-block and soft-warning de-dup checks.
 * Used by the checkDuplicate procedure and by createAthleteProfile.
 */
export async function runDedupCheck(input: {
  athleteCode: string;
  name: string;
  affiliation: string;
  beltLevel: number;
  weight: number;
  excludeId?: string;
}): Promise<DedupResult> {
  if (input.athleteCode) {
    const hardMatch = await AthleteProfileDAL.findByAthleteCodeAndName(
      input.athleteCode,
      input.name,
      input.excludeId
    );
    if (hardMatch) {
      return { isDuplicate: true, isHardBlock: true, matches: [hardMatch] };
    }
    // When athleteCode is provided and no hard match, skip soft check
    return { isDuplicate: false, isHardBlock: false, matches: [] };
  }

  const softMatches = await AthleteProfileDAL.findPossibleDuplicates({
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
