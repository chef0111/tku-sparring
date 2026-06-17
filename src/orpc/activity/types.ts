import { z } from 'zod';
import { TOURNAMENT_ACTIVITY_EVENT_TYPES } from '@/server/application/activity/activity-types';

export { TOURNAMENT_ACTIVITY_EVENT_TYPES } from '@/server/application/activity/activity-types';
export type { TournamentActivityEventType } from '@/server/application/activity/activity-types';

export type {
  ActivityRecordInput as ActivityInput,
  ActivityDatabase,
} from '@/server/application/activity/activity-record';

export const TournamentActivityEventTypeSchema = z.enum(
  TOURNAMENT_ACTIVITY_EVENT_TYPES
);
