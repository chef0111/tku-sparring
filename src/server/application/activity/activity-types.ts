import type { TournamentActivityEventType } from '@/contracts/activity/event-types';

/** JSON-safe activity payload at the application boundary. */
export type MutationActivityPayload = Record<string, unknown>;

export type MutationActivityInput = {
  eventType: TournamentActivityEventType;
  payload?: MutationActivityPayload;
};
