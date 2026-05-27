import type { TournamentActivityEventType } from '@/orpc/activity/event-types';
import type { AthleteProfilesDTO } from '@/orpc/athlete-profiles/dto';
import type { ListTournamentAthletesDTO } from '@/orpc/tournament-athletes/dto';
import type { ListTournamentsDTO } from '@/orpc/tournaments/dto';

export function activityTypesQueryKeyPart(
  eventTypes: Array<TournamentActivityEventType> | undefined
): string {
  if (!eventTypes?.length) {
    return 'all';
  }
  return [...eventTypes].sort().join(',');
}

export const matchKeys = {
  all: ['match'] as const,
  lists: () => [...matchKeys.all, 'list'] as const,
  listByGroup: (groupId: string) => [...matchKeys.lists(), groupId] as const,
  listByTournament: (tournamentId: string) =>
    [...matchKeys.lists(), 'tournament', tournamentId] as const,
};

export const groupKeys = {
  all: ['group'] as const,
  lists: () => [...groupKeys.all, 'list'] as const,
  list: (tournamentId: string) => [...groupKeys.lists(), tournamentId] as const,
};

export const tournamentKeys = {
  all: ['tournament'] as const,
  lists: () => [...tournamentKeys.all, 'list'] as const,
  list: (input: ListTournamentsDTO) =>
    [...tournamentKeys.lists(), input] as const,
  listAll: () => [...tournamentKeys.lists(), 'all'] as const,
  details: () => [...tournamentKeys.all, 'get'] as const,
  detail: (id: string) => [...tournamentKeys.details(), id] as const,
};

export const tournamentAthleteKeys = {
  all: ['tournamentAthlete'] as const,
  lists: () => [...tournamentAthleteKeys.all, 'list'] as const,
  list: (input: ListTournamentAthletesDTO) =>
    [...tournamentAthleteKeys.lists(), input] as const,
  listInfinite: (input: Omit<ListTournamentAthletesDTO, 'page'>) =>
    [...tournamentAthleteKeys.lists(), 'infinite', input] as const,
};

export const athleteProfileKeys = {
  all: ['athleteProfile'] as const,
  lists: () => [...athleteProfileKeys.all, 'list'] as const,
  list: (input: AthleteProfilesDTO) =>
    [...athleteProfileKeys.lists(), input] as const,
  listInfinite: (input: Omit<AthleteProfilesDTO, 'page'>) =>
    [...athleteProfileKeys.lists(), 'infinite', input] as const,
};

export const activityKeys = {
  all: ['activity'] as const,
  lists: () => [...activityKeys.all, 'list'] as const,
  list: (tournamentId: string, eventTypesPart: string) =>
    [...activityKeys.lists(), tournamentId, eventTypesPart] as const,
  listForTournament: (
    tournamentId: string,
    eventTypes?: Array<TournamentActivityEventType>
  ) => activityKeys.list(tournamentId, activityTypesQueryKeyPart(eventTypes)),
};

export const sessionKeys = {
  all: ['session'] as const,
  current: () => [...sessionKeys.all] as const,
};

export const advanceSettingsKeys = {
  all: ['advanceSettings'] as const,
  selectionCatalog: (deviceId: string | null, tournamentId: string | null) =>
    [
      ...advanceSettingsKeys.all,
      'selectionCatalog',
      deviceId,
      tournamentId,
    ] as const,
  selectionMatches: (
    deviceId: string | null,
    tournamentId: string | null,
    groupId: string | null
  ) =>
    [
      ...advanceSettingsKeys.all,
      'selectionMatches',
      deviceId,
      tournamentId,
      groupId,
    ] as const,
};
