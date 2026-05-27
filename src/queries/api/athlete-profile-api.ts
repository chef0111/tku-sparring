import type {
  AthleteProfilesDTO,
  CheckDuplicateDTO,
  CreateAthleteProfileDTO,
  UpdateAthleteProfileDTO,
} from '@/orpc/athlete-profiles/dto';
import { client } from '@/orpc/client';

export function listAthleteProfiles(input: AthleteProfilesDTO) {
  return client.athleteProfile.list(input);
}

export function createAthleteProfile(data: CreateAthleteProfileDTO) {
  return client.athleteProfile.create(data);
}

export function checkAthleteProfileDuplicate(data: CheckDuplicateDTO) {
  return client.athleteProfile.checkDuplicate(data);
}

export function updateAthleteProfile(data: UpdateAthleteProfileDTO) {
  return client.athleteProfile.update(data);
}

export function deleteAthleteProfile(data: { id: string }) {
  return client.athleteProfile.delete(data);
}

export function bulkDeleteAthleteProfiles(data: { ids: Array<string> }) {
  return client.athleteProfile.bulkDelete(data);
}
