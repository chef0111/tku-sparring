import { z } from 'zod';
import { TOURNAMENT_ACTIVITY_EVENT_TYPES } from '@/contracts/activity/event-types';

const TournamentActivityEventTypeSchema = z.enum(
  TOURNAMENT_ACTIVITY_EVENT_TYPES
);

export const ListTournamentActivitySchema = z.object({
  tournamentId: z.string(),
  eventTypes: z.array(TournamentActivityEventTypeSchema).max(20).optional(),
  cursor: z.object({ id: z.string() }).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export type ListTournamentActivityDTO = z.infer<
  typeof ListTournamentActivitySchema
>;
