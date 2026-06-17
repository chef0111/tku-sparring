import type { TournamentActivityEventType } from '@/server/domain/tournament/activity/event-types';

export type { TournamentActivityEventType } from '@/server/domain/tournament/activity/event-types';
export { TOURNAMENT_ACTIVITY_EVENT_TYPES } from '@/server/domain/tournament/activity/event-types';

/** JSON-safe activity payload at the application boundary. */
export type MutationActivityPayload = Record<string, unknown>;

export type MutationActivityInput = {
  eventType: TournamentActivityEventType;
  payload?: MutationActivityPayload;
};
