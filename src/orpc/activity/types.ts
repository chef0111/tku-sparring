import { z } from 'zod';
import { TOURNAMENT_ACTIVITY_EVENT_TYPES } from '@/server/domain/tournament/activity/event-types';

export { TOURNAMENT_ACTIVITY_EVENT_TYPES } from '@/server/domain/tournament/activity/event-types';
export type { TournamentActivityEventType } from '@/server/domain/tournament/activity/event-types';

export type {
  ActivityRecordInput as ActivityInput,
  ActivityDatabase,
} from '@/server/application/activity/activity-record';

export const TournamentActivityEventTypeSchema = z.enum(
  TOURNAMENT_ACTIVITY_EVENT_TYPES
);
