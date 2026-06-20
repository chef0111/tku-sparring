import type {
  AthleteProfileData,
  AthleteRow,
} from '@/features/dashboard/types';

export function athleteProfileToRow(profile: AthleteProfileData): AthleteRow {
  return {
    id: profile.id,
    athleteCode: profile.athleteCode ?? '',
    name: profile.name,
    gender: profile.gender === 'F' ? 'F' : 'M',
    beltLevel: profile.beltLevel,
    weight: profile.weight,
    affiliation: profile.affiliation,
    image: profile.image ?? '',
  };
}
